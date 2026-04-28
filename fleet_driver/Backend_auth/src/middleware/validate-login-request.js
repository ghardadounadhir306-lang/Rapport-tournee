function validateLoginRequest(req, res, next) {
  const body = req.body || {};

  const rawEmployeeId =
    typeof body.employeeId === 'string'
      ? body.employeeId
      : typeof body.employee_id === 'string'
      ? body.employee_id
      : '';

  const rawPassword = typeof body.password === 'string' ? body.password : '';

  const employeeId = rawEmployeeId.trim();
  const password = rawPassword.trim();

  if (!employeeId || !password) {
    return res.status(400).json({
      message: 'employeeId (or employee_id) and password are required',
    });
  }

  req.body.employeeId = employeeId;
  req.body.password = password;

  return next();
}

module.exports = validateLoginRequest;
