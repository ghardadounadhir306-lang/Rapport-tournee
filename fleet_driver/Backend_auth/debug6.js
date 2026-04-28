require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign({ sub: 247, employeeId: 'DRV-00247' }, process.env.JWT_SECRET);
console.log('Test token:', token);
