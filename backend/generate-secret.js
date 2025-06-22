// generate-secret.js
const crypto = require('crypto');

// 生成64字节的随机密钥
const secret = crypto.randomBytes(64).toString('hex');
console.log('Generated JWT Secret:');
console.log(secret);

// 生成适合用于.env文件的格式
console.log('\n复制以下内容到.env文件：');
console.log(`JWT_SECRET="${secret}"`);