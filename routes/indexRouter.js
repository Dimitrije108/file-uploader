const { Router } = require('express');

const indexRouter = Router();

indexRouter.get('/', (req, res) => {
	// insert controller
	res.render('index');
});

module.exports = indexRouter;
