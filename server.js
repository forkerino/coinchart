'use strict'
const express = require('express');
const dotenv = require('dotenv').config();
const path = require('path');
const port = process.env.PORT || 3000;
const http = require('http');
const socket = require('socket.io');
const coinAPI = require('./app/coinAPI');
const mongoose = require('mongoose');
const db = require('./app/db');

const app = express();
const server = http.createServer(app);
const io = socket(server);

mongoose.Promise = global.Promise;
app.use('/', express.static(process.cwd() + '/public'));

mongoose.connect(process.env.MLAB_URI);

io.on('connection', function(socket){
	['BTC', 'ETH','DASH', 'XRP', 'LTC'].forEach(db.addToSet);
	db.getSet().then(addCoin).catch(throws);
	//addCoin(db.getSet());
	console.log("Connected to Server");

	coinAPI('/front')
		.then((data) => io.emit('coins', data))
		.catch((err)=> console.error(err));

	socket.on('addcoin', function(coin){
		if (coin.coin.length!==0) set.push(coin.coin);
		console.log(coin);
		addCoin(set, coin.period);	
	});

	socket.on('removecoin', function(coin){
		if (coin.coin!=="") set.splice(set.indexOf(coin.coin), 1);
		if (set.length === 0) io.emit('coindata', null);
		addCoin(set, coin.period);
	});

});

app.set('view engine', 'ejs');

app.get('/', (req, res)=> res.render('index.ejs', {

}));

server.listen(port);

function addCoin(set, period='365day') {
	console.log(set);
	Promise.all(set.map(coin => coinAPI(`/history/${period}/${coin}`)))
		.then(function(data){
			let transformedData = data
				.map(function(coin){
		  			return [set, 
		  				coin.price.map(function(datepricepair){
	  					let date = new Date(datepricepair[0]).toLocaleString();
		  				let price = (datepricepair[1]);
		  				return [date,price];
		  			})
		  			.reduce(function(pre, curr){
		  					return [pre[0].concat(curr[0]),pre[1].concat(curr[1])];
	  				},[[],[]])]; // [[[ddd],[ppp]],[[ddd],[ppp]]]
		  		})
		  		.reduce(function(pre, curr, i){
		  			pre[1].push(curr[1][1]); 
		  			return pre;
			  	});

			let datasets = transformedData[0].map(function(c,i){
				let r = Math.floor(Math.random() * 128)+128;
	            let g = Math.floor(Math.random() * 128)+128;
	            let b = Math.floor(Math.random() * 128)+128;
				let randomColor = `rgba(${r}, ${g},${b}, 1)`;
				let randomColorB = `rgba(${r}, ${g},${b}, 0.8)`;
				return {
					label: c, 
					data: transformedData[1][i+1], 
					fill: false,
					lineTension: 0.1,
					pointRadius: 0,
					pointHoverRadius: 3,
					pointHitRadius: 5,
					borderColor: randomColor,
					backgroundColor: randomColorB
				};
			});

			let chartData = {
				labels: transformedData[1][0],
				datasets
			};
			io.emit('coindata', chartData);
		})
		.catch(err=> console.error(err));
}