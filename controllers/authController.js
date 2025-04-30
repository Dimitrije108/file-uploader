const asyncHandler = require('express-async-handler');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const validateSignUp = [
	body('name').trim()
		.isAlpha().withMessage('Name must only contain letters.')
		.isLength({ min: 1, max: 30 }).withMessage('Name must be between 1 and 30 characters.'),
	body('email').normalizeEmail()
		.isEmail().withMessage('Email must be a valid email address.'),
	body('password').trim()
		.isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
	body('confirmPass').trim()
		.custom(async (value, { req }) => {
			if (value === req.body.password) {
				return true;
			}
			throw new Error('Confirm password must match the password.');
		}),
];

const validateLogIn = [
	body('email').normalizeEmail()
		.isEmail().withMessage('Email must be a valid email address.'),
	body('password').trim()
		.notEmpty().withMessage('Password cannot be empty.'),
];

const signUpGet = (req, res) => {
	res.render('sign-up');
};

const signUpPost = [
	validateSignUp,
	asyncHandler(async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).render('sign-up', { 
				errors: errors.array() 
			});
		};
		
		const { name, email } = req.body;
		const hashedPass = await bcrypt.hash(req.body.password, 10);
		await prisma.user.create({
			data: {
				email,
				name,
				password: hashedPass,
			}
		})
		res.redirect('/auth/log-in');
})];

const logInGet = (req, res) => {
	const message = req.session.messages;
	req.session.messages = [];
	res.render('log-in', { message });
};

const logInPost = [
	validateLogIn,
	asyncHandler(async (req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).render('log-in', { 
				errors: errors.array() 
			});
		};

		return passport.authenticate('local', {
			successRedirect: '/',
			failureRedirect: '/auth/log-in',
			failureMessage: true
		})(req, res, next);
})];

const logOutGet = (req, res, next) => {
	req.logout((err) => {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	})
};

module.exports = {
	signUpGet,
	signUpPost,
	logInGet,
	logInPost,
	logOutGet
};