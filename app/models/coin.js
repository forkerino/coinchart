'use strict';

const mongoose = require('mongoose');

const coinSchema = mongoose.Schema({
	coin: String,
	period: String,
	timestamp: Date,
	prices: [[]]
});

module.exports = mongoose.model('Coin', coinSchema);