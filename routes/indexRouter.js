const { Router } = require('express');
const indexRouter = Router();
const indexController = require('../controllers/indexController');

indexRouter.get('/', indexController.getIndex);

indexRouter.get('/new', indexController.createFolderGet);
indexRouter.post('/new', indexController.createFolderPost);

indexRouter.get('/folders/:id', indexController.getFolder);

indexRouter.get('/upload/:id', indexController.uploadToFolderGet);
indexRouter.post('/upload/:id', indexController.uploadToFolderPost);
indexRouter.get('/upload', indexController.uploadGet);
indexRouter.post('/upload', indexController.uploadPost);
indexRouter.get('/download/:id', indexController.download);

module.exports = indexRouter;
