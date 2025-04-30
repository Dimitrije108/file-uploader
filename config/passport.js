const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const sessionInit = session({
	cookie: {
	 maxAge: 7 * 24 * 60 * 60 * 1000
	},
	secret: 'random secret',
	resave: false,
	saveUninitialized: false,
	store: new PrismaSessionStore(
		new PrismaClient(),
		{
			checkPeriod: 2 * 60 * 1000,
			dbRecordIdIsSessionId: true,
			dbRecordIdFunction: undefined,
		}
	)
});

passport.use(
	new LocalStrategy(
		{ usernameField: 'email' },
		async (email, password, done) => {
		console.log('localStrategy has executed');
		try {
			const user = await prisma.user.findUnique({
				where: {
					email: email,
				}
			});
			// Check if user exists
			if (!user) {
				return done(null, false, { message: "Incorrect username" });
			}
			// Check user password
			const match = await bcrypt.compare(password, user.password);
			if (!match) {
				return done(null, false, { message: "Incorrect password" });
			}
			return done(null, user);
		} catch(err) {
			return done(err);
		}
	})
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
		const user = await prisma.user.findUnique({
			where: {
				id: id,
			}
		});

    done(null, user);
  } catch(err) {
    done(err);
  }
});

module.exports = {
	sessionInit
};