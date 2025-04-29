require('dotenv').config();
const express = require('express');
const path = require('node:path');
const app = express();

const indexRouter = require('./routes/indexRouter');
// Setup html embedded and templates
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// Setup assets (css, images, etc)
const assetsPath = path.join(__dirname, 'public');
app.use(express.static(assetsPath));
// Parse form data into req.body
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
// Setup routes
app.use('/', indexRouter);

app.listen(PORT, () => {
	console.log("Up and running. Over.");
});
