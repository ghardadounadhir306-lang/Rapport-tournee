const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function timingSafeStringCompare(left, right) {
  const leftBuffer = Buffer.from(String(left), 'utf8');
  const rightBuffer = Buffer.from(String(right), 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function mapDriver(row) {
  const firstName = row.prenom || '';
  const lastName = row.nom || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    id: row.id,
    name: fullName || row.employee_id || `Driver #${row.id}`,
    employee_id: row.employee_id || `DRV-${String(row.id).padStart(5, '0')}`,
    role: row.role || 'driver',
    vehicle: {
      id: 0,
      plate: row.vehicle_plate || 'N/A',
      type: row.vehicle_type || 'Unknown',
      model: row.vehicle_model || 'Unknown',
    },
  };
}

// Cache column check so we don't query information_schema on every request
let _chauffeurCols = null;

async function getChauffeurColumns() {
  if (_chauffeurCols) return _chauffeurCols;

  const { rows } = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'chauffeurs'
  `);

  _chauffeurCols = new Set(rows.map((r) => r.column_name));
  return _chauffeurCols;
}

function buildDriverSelect(cols, whereCol) {
  const selectParts = ['c.id', 'c.nom', 'c.prenom'];

  if (cols.has('employee_id')) selectParts.push('c.employee_id');
  if (cols.has('role')) selectParts.push('c.role');
  if (cols.has('cin')) selectParts.push('c.cin');

  const hasCamion = cols.has('camion');

  if (hasCamion) {
    selectParts.push('bc.camion AS vehicle_plate');
    selectParts.push('bc.type AS vehicle_type');
    selectParts.push('bc.marque AS vehicle_model');
  } else {
    selectParts.push("NULL AS vehicle_plate");
    selectParts.push("NULL AS vehicle_type");
    selectParts.push("NULL AS vehicle_model");
  }

  const join = hasCamion ? 'LEFT JOIN base_camion bc ON bc.camion = c.camion' : '';

  return `
    SELECT ${selectParts.join(', ')}
    FROM chauffeurs c
    ${join}
    WHERE c.${whereCol} = $1
    LIMIT 1
  `;
}

async function getDriverByEmployeeId(employeeId) {
  const cols = await getChauffeurColumns();

  // employee_id column might not exist — fall back to id
  const whereCol = cols.has('employee_id') ? 'employee_id' : 'id';
  const sql = buildDriverSelect(cols, whereCol);

  const { rows } = await db.query(sql, [employeeId]);
  return rows[0] || null;
}

async function getDriverById(id) {
  const cols = await getChauffeurColumns();
  const sql = buildDriverSelect(cols, 'id');

  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
}

async function loginWithEmployeeIdAndCin({ employeeId, password }) {
  const driverRow = await getDriverByEmployeeId(employeeId);

  if (!driverRow) {
    throw createHttpError(404, 'Employee not found');
  }

  if (!driverRow.cin) {
    throw createHttpError(500, 'Employee CIN is missing in database');
  }

  const isValidPassword = timingSafeStringCompare(password, driverRow.cin);

  if (!isValidPassword) {
    throw createHttpError(401, 'Wrong password');
  }

  const token = jwt.sign(
    {
      sub: driverRow.id,
      employeeId: driverRow.employee_id || employeeId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );

  return {
    token,
    driver: mapDriver(driverRow),
  };
}

async function getDriverProfileByUserId(id) {
  const driverRow = await getDriverById(id);

  if (!driverRow) {
    return null;
  }

  return mapDriver(driverRow);
}

module.exports = {
  loginWithEmployeeIdAndCin,
  getDriverProfileByUserId,
};
