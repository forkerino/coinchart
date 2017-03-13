'use strict';
const mongoose = require('mongoose');

const coinListSchema = mongoose.Schema({
    timestamp: Date,
	coins : []
});

module.exports = mongoose.model('CoinList', coinListSchema);