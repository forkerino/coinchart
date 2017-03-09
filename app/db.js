'use strict';

const mongoose = require('mongoose');
const CoinSet = require('./models/coinset');
const Coin = require('./models/coin');

mongoose.Promise = global.Promise;

const db = {
	getSet: function getSet(){
		console.log("getSet called");
		let q = CoinSet.findOne({},"coins");
		return new Promise(function(resolve, reject){
			q.exec()
			.then(function(data){
				console.log("data: ", data);
				resolve(data.coins);
				return;
			});
		});
	},

	addToSet: function addToSet(coin){
		console.log("addToSet called with " + coin);
		let q = CoinSet.findOne({}, "coins");
		return new Promise(function(resolve, reject){
			q.exec()
				.then(function(data){
					console.log("THIS: ", data);
					if (data.coins.length === 0){
						let coinset = new CoinSet();
						console.log(coin);
						coinset.coins = [coin];
						coinset.save(function(err,coinset){
							if (err) {
								reject(err);
							}
							console.log(coinset.coins);
							resolve(coinset.coins);
							return;
						});
					} else if (data.coins.indexOf(coin) != -1){
						resolve(data.coins);
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
		return new Promise(function(resolve, reject){
			Coin.findOne({coin: coin, period: period, timestamp: {$gt: d}}, 
			function(err, data){
				if (err) {
					reject (err);
					return;
				}
				if (data) {
					resolve({price: data.prices});
				}
				else resolve(null);
			});
		});
	},

	setCoinData: function setCoinData(coin, period='365day', prices){
		// console.log("Got here, coin,period,prices : ", coin, period, prices);
		Coin.findOne({coin:coin, period: period})
			.exec().then(function(err, data){
				//console.log(data);
				if (err) throw err;
				if (data) {
					Coin.findOneAndUpdate({coin:coin, period: period}, {
						timestamp: new Date(), 
						prices: prices || []
					}, 
					function(err, data){
						if (err) throw err;
						console.log(data);
					});
				} else {
					let coindata = new Coin();
					coindata.coin = coin;
					coindata.period = period;
					coindata.timestamp = new Date();
					coindata.prices = prices || [];
					coindata.save(function(err,data){
						if(err) throw err;
						console.log(data);
						return data;
					});
				}
		});
	}
};

module.exports = db;