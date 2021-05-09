import * as querystring from 'querystring';
import * as http from 'http';
import md5 = require('md5');
import {appId, appSecret} from './private';

type ErrorMap = {
  [key: string]: string
}
const errorMap: ErrorMap = {
  52003: '用户认证失败',
  54001: '签名错误',
  54004: '账户余额不足',
};

export const translate = (word) => {
  const salt = Math.random();
  const sign = md5(appId + word + salt + appSecret);
  let from, to;

  if (/[a-zA-Z]/.test(word[0])) {
    // 英译为中
    from = 'en';
    to = 'zh';
  } else {
    // 中译为英
    from = 'zh';
    to = 'en';
  }
  // 构造查询参数
  const postData = querystring.stringify(
    {
      q: word,
      from,
      to,
      appid: appId,
      salt,
      sign,
    });

  const options = {
    hostname: 'api.fanyi.baidu.com',
    port: 80,
    path: '/api/trans/vip/translate?' + postData,
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const request = http.request(options, (response) => {
    let chunks = [];

    // response.setEncoding('utf8');

    response.on('data', (chunk) => {
      chunks.push(chunk);
    });

    response.on('end', () => {
      const string = Buffer.concat(chunks).toString();
      type BaiduResult = {
        error_code?: string;
        error_msg?: string;
        from: string;
        to: string;
        trans_result: { src: string; dst: string; }[]
      }
      const object: BaiduResult = JSON.parse(string);
      if (object.error_code) {
        console.error(errorMap[object.error_code] || object.error_msg);
        process.exit(2);
      } else {
        // 遍历查到的英文
        object.trans_result.map(obj => {
          console.log(obj.dst);
        });
        process.exit(0);
      }
    });
  });

  request.on('error', (e) => {
    console.error(`请求遇到问题: ${e.message}`);
  });

// 将数据写入请求主体。
  request.write(postData);
  request.end();
};