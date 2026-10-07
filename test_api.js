const http = require('http');
const { generateRsaKeyPair } = require('./secure_share');

function postJson(path, obj) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(obj);
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    const req = http.request({ hostname: 'localhost', port, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  const { publicKey: senderPub, privateKey: senderPriv } = generateRsaKeyPair();
  const { publicKey: receiverPub, privateKey: receiverPriv } = generateRsaKeyPair();

  const payload = 'This is a smoke-test payload.';
  const upload = await postJson('/api/upload', {
    filename: 'smoke.txt',
    dataBase64: Buffer.from(payload).toString('base64'),
    receiverPubPem: receiverPub,
    senderPrivPem: senderPriv,
    chunkSize: 16
  });
  console.log('UPLOAD RESPONSE:', upload);

  const id = upload.id;
  const reconstruct = await postJson('/api/reconstruct', {
    id,
    receiverPrivPem: receiverPriv,
    senderPubPem: senderPub
  });
  console.log('RECONSTRUCT RESPONSE:', reconstruct);

  const recData = Buffer.from(reconstruct.dataBase64, 'base64').toString('utf8');
  console.log('RECONSTRUCTED MATCH:', recData === payload);
})();
