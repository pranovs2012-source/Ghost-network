const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateRsaKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });
}

function shatterAndEncrypt(filePath, outDir, chunkSize, receiverPubPem, senderPrivPem) {
  fs.mkdirSync(outDir, { recursive: true });
  const data = fs.readFileSync(filePath);
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }

  const metadata = { originalName: path.basename(filePath), chunks: [] };

  chunks.forEach((chunk, idx) => {
    const symKey = crypto.randomBytes(32); // AES-256
    const iv = crypto.randomBytes(12); // GCM recommended iv
    const cipher = crypto.createCipheriv('aes-256-gcm', symKey, iv);
    const encrypted = Buffer.concat([cipher.update(chunk), cipher.final()]);
    const tag = cipher.getAuthTag();

    const encryptedKey = crypto.publicEncrypt({
      key: receiverPubPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    }, symKey);

    const chunkFile = path.join(outDir, `chunk_${idx}.bin`);
    fs.writeFileSync(chunkFile, encrypted);

    metadata.chunks.push({
      file: path.basename(chunkFile),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      encryptedKey: encryptedKey.toString('base64'),
      index: idx,
    });
  });

  // Sign the metadata with sender's private key
  const sign = crypto.createSign('sha256');
  sign.update(JSON.stringify(metadata));
  sign.end();
  const signature = sign.sign(senderPrivPem, 'base64');
  metadata.signature = signature;

  fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
  return metadata;
}

function reconstructAndDecrypt(metadataPath, outFilePath, receiverPrivPem, senderPubPem) {
  const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  // Verify signature
  const signature = meta.signature;
  const metaCopy = Object.assign({}, meta);
  delete metaCopy.signature;
  const verify = crypto.createVerify('sha256');
  verify.update(JSON.stringify(metaCopy));
  verify.end();
  const ok = verify.verify(senderPubPem, signature, 'base64');
  if (!ok) throw new Error('Signature verification failed');

  const parts = [];
  const baseDir = path.dirname(metadataPath);
  meta.chunks.sort((a, b) => a.index - b.index);

  meta.chunks.forEach((c) => {
    const encrypted = fs.readFileSync(path.join(baseDir, c.file));
    const symKey = crypto.privateDecrypt({
      key: receiverPrivPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    }, Buffer.from(c.encryptedKey, 'base64'));

    const iv = Buffer.from(c.iv, 'base64');
    const tag = Buffer.from(c.tag, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', symKey, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    parts.push(decrypted);
  });

  fs.writeFileSync(outFilePath, Buffer.concat(parts));
  return true;
}

// Export functions
module.exports = { generateRsaKeyPair, shatterAndEncrypt, reconstructAndDecrypt };

// Self-test when run directly
if (require.main === module) {
  (async () => {
    const tmpDir = path.join(__dirname, 'secure_test');
    fs.mkdirSync(tmpDir, { recursive: true });

    const { publicKey: senderPub, privateKey: senderPriv } = generateRsaKeyPair();
    const { publicKey: receiverPub, privateKey: receiverPriv } = generateRsaKeyPair();

    const testFile = path.join(tmpDir, 'message.txt');
    fs.writeFileSync(testFile, 'Hello secure world! This is a test file to shatter and reconstruct.');

    console.log('Shattering and encrypting...');
    shatterAndEncrypt(testFile, tmpDir, 16, receiverPub, senderPriv);

    console.log('Reconstructing and decrypting...');
    reconstructAndDecrypt(path.join(tmpDir, 'metadata.json'), path.join(tmpDir, 'reconstructed.txt'), receiverPriv, senderPub);

    const orig = fs.readFileSync(testFile, 'utf8');
    const rec = fs.readFileSync(path.join(tmpDir, 'reconstructed.txt'), 'utf8');
    if (orig === rec) console.log('SELF-TEST OK: reconstructed file matches original');
    else console.error('SELF-TEST FAILED: mismatch');
  })();
}
