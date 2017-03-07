'use strict';

const mongoose = require('mongoose');
const CoinSet = require('./models/coinset');
const Coin = require('./models/coin');

mongoose.Promise = global.Promise;

const db = {
	getSet: function getSet(){
		console.log("getSet called");
		CoinSet.find({},function(err, data){
			if (err) throw err;
			console.log("data : " + data);
			let coins = [];
			if (data.coins) {
				console.log("data.coins: " + data.coins);
				data.coins.forEach(coins.push);
			}
			return coins;
		});
	},

	addToSet: function addToSet(coin){
		console.log("addToSet called with " + coin);
		CoinSet.findOneAndUpdate({}, {$push: {coins : coin}},
			function(err, coins){
				if (err) throw err;
				return coins;
			});
	},

	removeFromSet: function removeFromSet(coin){
		CoinSet.findOneAndUpdate({}, {$pull: {coins: coin}},
			function(err, coins){
				if (err) throw err;
				return coins;
			});
	},


}

module.exports = db;