'use strict';
const mongoose = require('mongoose');

const coinListSchema = mongoose.Schema({
    timestamp: { type: Date, expires: 86400 },
	coins : []
});

module.exports = mongoose.model('CoinList', coinListSchema);