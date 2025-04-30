const { Router } = require('express');
const authRouter = Router();
const authController = require('../controllers/authController');

authRouter.get('/sign-up', authController.signUpGet);
authRouter.post('/sign-up', authController.signUpPost);

authRouter.get('/log-in', authController.logInGet);
authRouter.post('/log-in', authController.logInPost);
authRouter.get('/log-out', authController.logOutGet);

module.exports = authRouter;