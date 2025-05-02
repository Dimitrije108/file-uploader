const { Router } = require('express');
const indexRouter = Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
// this is where the files will be stored
const upload = multer({ dest: 'public/uploads/' });

const validateFolder = [
	body('name').trim()
		.notEmpty().withMessage('Name cannot be empty.')
		.isLength({ min: 1, max: 30 }).withMessage('Name must be between 1 and 30 characters.'),
];

const checkAuthentication = (req,res,next) => {
	if (req.isAuthenticated()){
		next();
	} else {
		res.redirect("/login");
	}
}

indexRouter.get('/', async (req, res) => {
	const folders = await prisma.folder.findMany({
		where: {
			userId: req.user.id,
		}
	});

	const files = await prisma.file.findMany({
		where: {
			folderId: null
		}
	})

	res.render('index', {
		user: req.user,
		folders,
		files
	});
});

indexRouter.get('/new', [
	checkAuthentication,
	(req, res) => {
		res.render('create-folder');
	}
]);

indexRouter.post('/new', [
	checkAuthentication,
	validateFolder,
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).render('create-folder', { 
				errors: errors.array() 
			});
		};
		
		const userId = req.user.id;
		const name = req.body.name;

		await prisma.folder.create({
			data: {
				name,
				userId,
			},
		})

		res.redirect('/');
	}
]);

indexRouter.get('/folders/:id', [ 
	checkAuthentication,
	async (req, res) => {
		const folder = await prisma.folder.findUnique({
			where: {
				id: Number(req.params.id)
			}
		})

		const files = await prisma.file.findMany({
			where: {
				folderId: folder.id
			}
		})

		res.render('folder', {
			folder,
			files
		});
	}
]);

indexRouter.get('/upload', [ 
	checkAuthentication,
	(req, res) => {
		res.render('upload', {
			user: req.user
		});
	}
]);

indexRouter.post('/upload', [
	checkAuthentication,
	upload.array('files', 12), (req, res) => {
		console.log(req.files);
		res.redirect('/upload');
		// we will think about folders later and how to upload into them
	}
]);

module.exports = indexRouter;
