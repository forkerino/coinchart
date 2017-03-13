'use strict';
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
	console.log("Connected to Server");
	db.getSet()
		.then(function(coins){
			io.emit('coinset', coins);	
			return coins;
		})
		.then(addCoin)
		.catch(err => console.error(err));
		
	db.getList()
		.then(function(data){
		if (data == null || data.timestamp - new Date() >= 86400000){ // refresh once a day
			coinAPI('/front')
				.then(function(data){
					const sortedCoins = data.sort((a, b) => a.position24 - b.position24).map(v => ({
		  				long: v.long, 
		  				short: v.short, 
		  				price: v.price
		  			}));
					io.emit('coins', sortedCoins);
					db.setList(data);
				})
				.catch((err)=> console.error(err));
		} else {
			io.emit('coins', data);
		}
	})
		.catch(err => console.error(err));
	
	socket.on('addcoin', function(coindata){
		if (coindata.coin.length!==0) {
			db.addToSet(coindata.coin)
				.then(data=>addCoin(data, coindata.period))
				.catch(err => console.error(err));
		} else {
			db.getSet()
				.then(data=>addCoin(data, coindata.period))
				.catch(err => console.error(err));
		}
	});

	socket.on('removecoin', function(coindata){
		console.log('removecoin: ', coindata);
		if (coindata.coin!=="") {
			db.removeFromSet(coindata.coin)
				.then(data=>addCoin(data, coindata.period))
				.catch(err => console.error(err));
		} 
	});
});

app.set('view engine', 'ejs');

app.get('/', (req, res)=> res.render('index.ejs', {

}));

server.listen(port);

function addCoin(coinSet, period='365day') {
	console.log("Set: ", coinSet);
	// console.log("Period: ", period);
	let coinPromises = coinSet.map(function(coin){
		return db.getCoinData(coin.short, period)
			.then(function(data){
				if (data == null) {
					return coinAPI(`/history/${period}/${coin.short}`);
				} else {
					return data;
				}
			})
			.catch(err => console.error(err));
	});
	if (coinPromises.length == 0) {
		io.emit('coindata', null);
		return;
	}
	Promise.all(coinPromises)//coinSet.map(coin => coinAPI(`/history/${period}/${coin}`)))
		.then(function(data){
			// console.log(data);
			let transformedData = data
				.map(function(coin, i){
					// console.log(coin.price);
					db.setCoinData(coinSet[i], period, coin.price);
		  			return [coinSet.map(c => c.short), 
		  				coin.price.map(function(datepricepair){
			  				let date = new Date(datepricepair[0]).toLocaleString();
			  				let price = (datepricepair[1]);
			  				return [date,price];
			  			}) // [[[d,p],[d,p]],[[d,p],[d,p]]]
			  			.reduce(function(pre, curr){
			  					return [pre[0].concat(curr[0]),pre[1].concat(curr[1])];
			  			},[[],[]])]; // [[[ddd],[ppp]],[[ddd],[ppp]]]
		  		})
		  		.reduce(function(pre, curr, i){
		  			pre[1].push(curr[1][1]); 
		  			return pre;
			  	});

			let datasets = transformedData[0].map(function(c,i){
				let r = Math.floor(Math.random() * 64)+192;
	            let g = Math.floor(Math.random() * 64)+192;
	            let b = Math.floor(Math.random() * 64)+192;
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
				labels: [...new Set(...transformedData[1])],
				datasets
			};

			io.emit('coindata', chartData);
		})
		.catch(err=> console.error(err));
}