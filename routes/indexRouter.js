const { Router } = require('express');
const indexRouter = Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
// this is where the files will be stored
const upload = multer({ dest: 'public/uploads/' });

indexRouter.get('/', async (req, res) => {
	
	const folders = await prisma.folder.findMany({
		where: {
			userId: req.user.id,
		}
	});

	res.render('index', {
		user: req.user,
		folders
	});
});

indexRouter.get('/upload', (req, res) => {
	res.render('upload', {
		user: req.user
	});
});

indexRouter.post('/upload', upload.array('files', 12), (req, res) => {
	console.log(req.files);
	res.redirect('/upload');
	// we will think about folders later and how to upload into them
});

module.exports = indexRouter;
