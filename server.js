'use strict'
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const Rx = require('rx');
const http = require('http');
const socket = require('socket.io');
const coinAPI = require('./app/coinAPI');

const app = express();
const server = http.createServer(app);
const io = socket(server);

console.log(coinAPI('/coins'));

io.on('connection', function(socket){
	const set = ['BTC', 'ETH','DASH', 'XRP', 'LTC'];
	io.emit('currentset', set);
	console.log("Connected to Server");
	coinAPI('/front')
		.then((data) => io.emit('coins', data))
		.catch((err)=> console.error(err));

	socket.on('addcoin', function(coins){
		Promise.all(coins.map(coin => coinAPI(`/history/365day/${coin}`)))
			.then((data)=> io.emit('coindata', data))
			.catch((err)=> console.error(err));
	});
});

app.set('view engine', 'ejs');

app.get('/', (req, res)=> res.render('index.ejs', {

}));

server.listen(3000);

