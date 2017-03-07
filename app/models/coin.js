'use strict';

const mongoose = require('mongoose');

const coinSchema = mongoose.Schema({
	coin: String,
	data: [{
		period: String,
		timestamp: Number,
		prices: {
			time: Number,
			price: Number
		}
	}]
});

module.exports = mongoose.model('Coin', coinSchema);