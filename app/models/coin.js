'use strict';

const mongoose = require('mongoose');

const coinSchema = mongoose.Schema({
	coin: String,
	period: String,
	timestamp: {type: Date, expires: 3600},
	prices: [[]]
});

module.exports = mongoose.model('Coin', coinSchema);