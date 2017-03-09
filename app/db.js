'use strict';

const mongoose = require('mongoose');
const CoinSet = require('./models/coinset');
const Coin = require('./models/coin');

mongoose.Promise = global.Promise;

const db = {
	getSet: function getSet(){
		console.log("getSet called");
		let q = CoinSet.find({},"coins");
		return new Promise(function(resolve, reject){
			q.exec()
			.then(function(data){
				console.log("data: ", data);
				resolve(data[0].coins);
				return;
			});
		});
	},

	addToSet: function addToSet(coin){
		console.log("addToSet called with " + coin);
		let q = CoinSet.find({}, "coins");
		return new Promise(function(resolve, reject){
			q.exec()
				.then(function(data){
					if (data[0].coins.length === 0){
						let coinset = new CoinSet();
						coinset.coins = [].push(coin);
						coinset.save(function(err,coinset){
							if (err) {
								reject(err);
							}
							console.log(coinset);
							resolve(data[0].coins);
							return;
						});
					} else if (data[0].coins.indexOf(coin) != -1){
						resolve(data[0].coins);
					} else {
						CoinSet.findOneAndUpdate({}, 
							{$push: {coins : coin}},
							{ new: true },
							function(err, coins){
								console.log(coins.coins);
								if (err) reject(err);
								resolve(coins.coins);
						});
					}
				})
				.catch(err => console.error(err));
		});
	},

	removeFromSet: function removeFromSet(coin){
		console.log("removeFromSet called with ", coin);
		return new Promise(function(resolve, reject){
			CoinSet.findOneAndUpdate({}, {$pull: {coins: coin}}, {new: true})
				.exec()
				.then(function(data){
					console.log("coins: ", data.coins);
					resolve(data.coins);
					return;
				})
				.catch(err => reject(err));
		});
	},

	getCoinData: function getCoinData(coin, period='365day'){
		const d = new Date() - (period == '1day' || period == '7day')? 300000 : 3600000;
		Coin.find({coin: coin, period: period, timestamp: {$gt: d}}, 
			function(err, data){
				if (err) throw err;
				return data;
		});
	},

	setCoinData: function setCoinData(coin, period='365day', prices){
		const d = new Date();
		Coin.find({coin:coin, period: period},
			function(err, data){
				if (err) throw err;
				if (data) {
					Coin.findOneAndUpdate({coin:coin, period: period}, {
						timestamp: d, 
						prices: prices
					}, 
					function(err, data){
						if (err) throw err;
						console.log(data);
					});
				} else {
					let coindata = new Coin();
					coindata.coin = coin;
					coindata.period = period;
					coindata.timestamp = d;
					coindata.prices = prices;
					coindata.save(function(err,data){
						if(err) throw err;
						console.log(data);
						return data;
					});
				}
		});
	}
}

module.exports = db;