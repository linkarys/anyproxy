'use strict';

const
	path = require('path'),
	fs = require('fs'),
	comboUrl = require('combo-url'),
	CombinedStream = require('combined-stream');

module.exports = combo;

// 检测url是否请求combo
module.exports.isCombo = comboUrl.isCombo;

function combo(req, res) {
	let
		comboFiles = comboUrl.parse(req.url).combo,
		combinedStream = CombinedStream.create(),
		allFileOK = true;

	for (let i = 0, len = comboFiles.length; i < len; i++) {
		let file = path.join('/Users/linkary/Programing/Alibaba/temp/demo/', comboFiles[i]);

		try {
			// 测试文件状态
			fs.statSync(file);

			// 合并文件stream
			combinedStream.append(fs.createReadStream(file));

		} catch(err) {

			// 打印错误信息并中断操作
			console.log(err);
			allFileOK = false;
			break;
		}
	}

	// 当combo中某个文件错误时，输出空字符串
	if (!allFileOK) {
		return '';
	} else {

		return combinedStream;

		// 输出合并的文件
		combinedStream.pipe(res);
	}
}
