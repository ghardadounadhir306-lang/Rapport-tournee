require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign({ sub: 315, employeeId: 'DRV-00412' }, process.env.JWT_SECRET);
console.log('Seed token:', token);
