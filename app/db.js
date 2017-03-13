'use strict';

const mongoose = require('mongoose');
const CoinSet = require('./models/coinset');
const CoinList = require('./models/coinlist');
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
			})
			.catch(err => console.error(err));
		});
	},

	addToSet: function addToSet(coin){
		console.log("addToSet called with " + coin);
		let q = CoinSet.findOne({});
		return new Promise(function(resolve, reject){
			q.exec()
				.then(function(data){
					console.log("THIS: ", data);
					if (data.coins.indexOf(coin) != -1){
						resolve(data.coins);
					} else {
						CoinSet.findOneAndUpdate({}, 
							{$push: {coins : coin}},
							{ 
								new: true,
								upsert: true
							},
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
		const d = new Date() - ((period == '1day' || period == '7day')? 300000 : 3600000);
		// console.log(d);
		return new Promise(function(resolve, reject){
			Coin.findOne({$and : [{coin: coin}, {period: period}, {timestamp : {$gte : d}}]})
			.exec()
			.then(function(data){

				if (data !== null) {
					resolve({price: data.prices});
				}
				else resolve(null);
			})
			.catch(err => console.error(err));
		});
	},

	setCoinData: function setCoinData(coin, period='365day', prices){
		// console.log("Got here, coin,period,prices : ", coin, period, prices);
		Coin.findOne({coin:coin.short, period: period})
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
						// console.log(data);
					});
				} else {
					let coindata = new Coin();
					coindata.coin = coin.short;
					coindata.period = period;
					coindata.timestamp = new Date();
					coindata.prices = prices || [];
					coindata.save(function(err,data){
						if(err) throw err;
						// console.log(data);
						return data;
					});
				}
		}).catch(err=>console.error(err));
	},
	
	getList: function getList(){
		console.log("getList called");
		let q = CoinList.findOne({},"coins");
		return new Promise(function(resolve, reject){
			q.exec()
			.then(function(data){
				console.log("getList length: ", data.coins.length);
				if (data){
					resolve(data.coins);
					return;
				} else {
					resolve(null);
				}
			})
			.catch(err => console.error(err));
		});
	},
	
	setList: function setList(coins){
		console.log("setList called");
		let q = CoinList.findOneAndUpdate({}, 
			{ 
				coins: coins,
				timestamp: new Date()
			},
			{ 
				new: true,
				upsert: true
			});
		return new Promise(function(resolve, reject){
			q.exec()
			.then(function(data){
				console.log("data setList: ", data);
				resolve(data.coins);
				return;
			})
			.catch(err => console.error(err));
		});
		
	}
};

module.exports = db;