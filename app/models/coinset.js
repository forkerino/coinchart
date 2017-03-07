'use strict';
const mongoose = require('mongoose');

const coinSetSchema = mongoose.Schema({
	coins : []
});

module.exports = mongoose.model('CoinSet', coinSetSchema);