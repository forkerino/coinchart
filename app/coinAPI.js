'use strict';

const https = require('https');

module.exports = function(path) {
	const host = 'www.coincap.io';
    return new Promise(
        function (resolve, reject) {
        	let result = "";
			let options = {
				host,
				path,
				method: 'GET'
			}

			const req = https.request(options, function(res){
            	res.on('data', (d) => result += d );
            	res.on('end', () => resolve(JSON.parse(result)));
            });

            req.on('error', (e)=> reject(new Error(e)));
            req.end();
        });
}
// module.exports = function(path){
	
// 	const headers = {};
// 	let result = "";

// 	let options = {
// 		host,
// 		path,
// 		method: 'GET',
// 		headers,
// 	}

// 	const req = https.request(options, function(res){
// 		res.setEncoding('utf-8');

// 		let responseString = '';

// 		res.on('data', (data) => responseString += data);

// 		res.on('end', function(){
// 			return new Promise(function(resolve, reject){
// 				if (responseString == "") reject("no response");
// 				resolve(JSON.parse(responseString));
// 			});
// 		});
// 	});

// 	req.write(result);
// 	req.end();
	
// }