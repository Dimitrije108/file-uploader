const { Router } = require('express');
const indexRouter = Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
// this is where the files will be stored
// TODO: delete dest once cloud is setup
const upload = multer({ 
	torage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 } // Limit to 10MB
});
// Supabase cloud storage
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

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

const uploadFile = async (file, folderId) => {
	let filepath;
	if (folderId) {
		filepath = `${folderId}/${file.originalname}`;
	} else {
		filepath = file.originalname;
	}

	const { data, error } = await supabase
		.storage
		.from('file-uploader')
		.upload(filepath, file.buffer);
	
	if (error) {
    return res.status(500).send(`Upload failed ${error.message}`);
  }
	return data;
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
		res.render('upload');
	}
]);

indexRouter.post('/upload', [
	checkAuthentication,
	upload.single('file'), 
	async (req, res) => {
		if (!req.file) {
			return res.status(400).send('No files uploaded');
		}
		const file = req.file;
		// Upload the file to the cloud
		const cloudData = await uploadFile(file);
		// Make a db file instance with the cloud's file URL 
		await prisma.file.create({
			data: {
				path: cloudData.path,
				name: file.originalname,
				size: file.size
			},
		});
		
		res.redirect('/upload');
	}
]);

indexRouter.get('/upload/:id', [ 
	checkAuthentication,
	(req, res) => {
		res.render('upload');
	}
]);

indexRouter.post('/upload/:id', [
	checkAuthentication,
	upload.single('file'), 
	async (req, res) => {
		if (!req.file) {
			return res.status(400).send('No files uploaded');
		}
		const folderId = req.params.id;
		const file = req.file;
		// Upload the file to the cloud
		const cloudData = await uploadFile(file, folderId);
		// Make a db file instance with the cloud's file URL 
		await prisma.file.create({
			data: {
				path: cloudData.path,
				name: file.originalname,
				size: file.size,
				folderId
			},
		});

		res.redirect(`/folders/${folderId}`);
	}
]);

module.exports = indexRouter;
