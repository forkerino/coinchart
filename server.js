const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

const port = process.env.PORT || 3000;



dotenv.config();

const app = express();

app.set('view engine', 'ejs');

app.route('*')
	.get(function (req, res){
		res.render('index.ejs');
	});

app.listen(port, function(){
	console.log(`listening on port ${port}`);
});