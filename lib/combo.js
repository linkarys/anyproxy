'use strict';

const
	path = require('path'),
	fs = require('fs'),
	comboParser = require('./comboParser'),
	util = require('./util'),
	color = require('colorful'),
	http = require('http'),
	https = require('https'),
	Readable = require('stream').Readable,
	CombinedStream = require('combined-stream');

module.exports = combo;

function combo(req, res) {
	let
		parsedUrl = comboParser.parse(req.url),
		combos = parsedUrl.combo,
		combinedStream = CombinedStream.create(),
		readableStream = new Readable(),
		configs = util.parseCfg('.anyproxy'),
		dest = '',
		allFileOK = true;

	// combo files
	Object.keys(configs).forEach(function(key) {
		let config = configs[key];

		combos.forEach(function(combo) {

			let fullpath = path.join(parsedUrl.protocol, parsedUrl.hostname, combo);

			if (config.pattern && new RegExp(config.pattern).test(fullpath)) {
				let filePath = path.join(config.dest, combo.replace(new RegExp('.*' + config.pattern), ''));

				combinedStream.append(fetchLocalFile(filePath));
				readableStream.push(fetchLocalFile(filePath));

			} else {
				fetchRemoteFile(combinedStream, res, {
					path: combo,
					hostname: parsedUrl.hostname,
					protocol: parsedUrl.protocol,
					method: req.method,
					port: req.port || parsedUrl.protocol === 'http:' ? '80' : '443',
					headers: req.headers
				});
			}
		});

		// return combinedStream;
	});

	if (!Object.keys(configs).length) {

		combos.forEach(function(combo) {

			fetchRemoteFile(combinedStream, res, {
				path: combo,
				hostname: parsedUrl.hostname,
				protocol: parsedUrl.protocol,
				method: req.method,
				port: req.port || parsedUrl.protocol === 'http:' ? '80' : '443',
				headers: req.headers
			});
		});

	}
}

function fetchRemoteFile(stream, usrRes, urlPattern) {

	console.log(urlPattern);
	console.log('use remote');

	let options = {
		 hostname : urlPattern.hostname,
		 port     : urlPattern.port,
		 path     : urlPattern.path,
		 method   : urlPattern.method,
		 protocol : urlPattern.protocol,
		 headers  : urlPattern.headers
	};

	options.rejectUnauthorized = false;
	try{
		 delete options.headers['accept-encoding']; //avoid gzipped response
	}catch(e){}

	(/https/.test(options.protocol) ? https : http).request(options, function(res) {

		//deal response data
		var resData = [];

		res.setEncoding('utf8');

		res.on('data',function(chunk){
			stream.append(chunk);
		});

		res.on('end',function(){
			stream.pipe(usrRes);
		 });

		res.on('error',function(error){
			console.log(error);
		});
	 }).end();
}

function fetchLocalFile(filePath) {

	try {
		// 测试文件状态
		fs.accessSync(file);

		return fs.createReadStream(file);

	} catch(err) {

		// 打印错误信息
		console.log(color.red(err), color.yellow(filePath));
		return '';
	}
}
