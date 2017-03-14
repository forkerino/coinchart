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
const favicon = require('serve-favicon');

const app = express();
const server = http.createServer(app);
const io = socket(server);

mongoose.Promise = global.Promise;
app.use('/', express.static(process.cwd() + '/public'));
app.use(favicon(path.join(__dirname,'public','img','favicon.ico')));

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
	
	socket.on('changeperiod', function(period){
		socket.broadcast.emit('changeperiod', period);	
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
		  			if (pre[1][0].length < curr[1][0].length) {
		  				let diff = curr[1][0].length - pre[1][0].length;
		  				pre[1][0] = curr[1][0];
		  				while (diff > 0){
		  					pre[1][1].unshift(null);
		  					diff--;
		  				}
		  			}
		  			pre[1].push(curr[1][1]); 
		  			return pre;
			  	});
			  	
			// console.log("Chartdata: ", transformedData);
			  	
			const colors = ["rgba(0, 255, 255", "rgba(220, 20, 60", "rgba(255, 20, 147", "rgba(218, 165, 32", "rgba(32, 178, 170", 
				"rgba(218, 112, 214", "rgba(0, 128, 128", "rgba(64, 224, 208", "rgba(46, 139, 87", "rgba(128, 128, 0", 
				"rgba(255, 69, 0", "rgba(250, 128, 114", "rgba(199, 21, 133", "rgba(221, 160, 221", "rgba(244, 164, 96",
				"rgba(210, 105, 30", "rgba(222, 184, 135", "rgba(255, 215, 0", "rgba(107, 142, 35", "rgba(188, 143, 143"];
			let pickedcolors = [];
			let datasets = transformedData[0].map(function(c,i){
				let randC;
				do { 
					randC = Math.floor(Math.random() * colors.length);
				} while (pickedcolors.includes(randC));
				pickedcolors.push(randC);
				let randomColor = `${colors[randC]}, 1)`;
				let randomColorB = `${colors[randC]}, 0.8)`;
				
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