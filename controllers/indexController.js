const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
// Multer setup for uploading files
const upload = multer({ 
	torage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 } // Limit to 10MB
});
// Supabase cloud storage setup
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const validateFolder = [
	body('name').trim()
		.notEmpty().withMessage('Name cannot be empty.')
		.isLength({ min: 1, max: 30 }).withMessage('Name must be between 1 and 30 characters.'),
];
// Check user auth
const checkAuthentication = (req,res,next) => {
	if (req.isAuthenticated()){
		next();
	} else {
		res.redirect("/login");
	}
}
// Upload file to supabase cloud
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
// Download file from supabase cloud
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

const getIndex = asyncHandler(async (req, res) => {
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

const createFolderGet = [
	checkAuthentication,
	(req, res) => {
		res.render('create-folder');
	}
];

const createFolderPost = [
	checkAuthentication,
	validateFolder,
	asyncHandler(async (req, res) => {
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
	})
];

const getFolder = [ 
	checkAuthentication,
	asyncHandler(async (req, res) => {
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
	})
];

const uploadToFolderGet = [ 
	checkAuthentication,
	(req, res) => {
		res.render('upload', {
			folderId: req.params.id
		});
	}
];

const uploadToFolderPost = [
	checkAuthentication,
	upload.single('file'), 
	asyncHandler(async (req, res) => {
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
	})
];

const uploadGet = [ 
	checkAuthentication,
	(req, res) => {
		res.render('upload', {
			folderId: false
		});
	}
];

const uploadPost = [
	checkAuthentication,
	upload.single('file'), 
	asyncHandler(async (req, res) => {
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
	})
];

const download = [
	checkAuthentication,
	asyncHandler(async (req, res) => {
		const file = await prisma.file.findUnique({
			where: {
				id: Number(req.params.id)
			}
		});
		await downloadFile(file.path, res);
	})
];

module.exports = {
	getIndex,
	createFolderGet,
	createFolderPost,
	getFolder,
	uploadToFolderGet,
	uploadToFolderPost,
	uploadGet,
	uploadPost,
	download,
};
