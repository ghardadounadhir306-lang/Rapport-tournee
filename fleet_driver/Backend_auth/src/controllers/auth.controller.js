const authService = require('../services/auth.service');

async function login(req, res, next) {
  try {
    const { employeeId, password } = req.body;
    const authResult = await authService.loginWithEmployeeIdAndCin({
      employeeId,
      password,
    });

    return res.json(authResult);
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const driver = await authService.getDriverProfileByUserId(req.user.id);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    return res.json({ driver });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  me,
};
