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
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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
    throw new Error (`Upload failed ${error.message}`);
  }
	return data;
}

const downloadFile = async (path, res) => {
	const { data, error } = await supabase
		.storage
		.from('file-uploader')
		.download(path);

	if (error) {
		throw new Error (`Download failed ${error.message}`);
	}
	const buffer = Buffer.from(await data.arrayBuffer());

	res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${path.split('/').pop()}"`);
  res.send(buffer);
}

indexRouter.get('/', async (req, res) => {
	let folders;
	let files;

	if (req.user) {
		folders = await prisma.folder.findMany({
			where: {
				userId: req.user.id,
			}
		});

		files = await prisma.file.findMany({
			where: {
				AND: [
					{ folderId: null },
					{ userId: req.user.id },
				]
			}
		})
	}

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

indexRouter.get('/upload/:id', [ 
	checkAuthentication,
	(req, res) => {
		res.render('upload', {
			folderId: req.params.id
		});
	}
]);

indexRouter.post('/upload/:id', [
	checkAuthentication,
	upload.single('file'), 
	async (req, res) => {
		if (!req.file) {
			return res.status(400).send('No files uploaded');
		}
		const userId = req.user.id;
		const folderId = Number(req.params.id);
		const file = req.file;
		// Upload the file to the cloud
		const cloudData = await uploadFile(file, folderId);
		// Make a db file instance with the cloud's file URL 
		await prisma.file.create({
			data: {
				path: cloudData.path,
				name: file.originalname,
				size: file.size,
				folderId,
				userId
			},
		});

		res.redirect(`/folders/${folderId}`);
	}
]);

indexRouter.get('/upload', [ 
	checkAuthentication,
	(req, res) => {
		res.render('upload', {
			folderId: false
		});
	}
]);

indexRouter.post('/upload', [
	checkAuthentication,
	upload.single('file'), 
	async (req, res) => {
		if (!req.file) {
			return res.status(400).send('No files uploaded');
		}
		const userId = req.user.id;
		const file = req.file;
		// Upload the file to the cloud
		const cloudData = await uploadFile(file);
		// Make a db file instance with the cloud's file URL 
		await prisma.file.create({
			data: {
				path: cloudData.path,
				name: file.originalname,
				size: file.size,
				userId,
			},
		});
		
		res.redirect('/');
	}
]);

indexRouter.get('/download/:id', async (req, res) => {
	const file = await prisma.file.findUnique({
		where: {
			id: Number(req.params.id)
		}
	});
	await downloadFile(file.path, res);
});

module.exports = indexRouter;
