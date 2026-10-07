// test_secure_transfer.js - AES-256-GCM encrypted P2P file tunnel test
const { webcrypto } = require('crypto');
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
}

const {
    generateIdentityKeypair,
    generateNonce,
    signChallenge,
    verifyChallenge,
    bufferToBase64,
    base64ToBuffer,
    generateSessionKeyPair,
    buildHandshakeTranscript,
    deriveSessionKey,
    encryptSessionPacket,
    decryptSessionPacket
} = require('./crypto-engine.js');

async function makePeer() {
    const kp = await generateIdentityKeypair();
    const pubJwk = await globalThis.crypto.subtle.exportKey("jwk", kp.publicKey);
    return { ...kp, pubJwk };
}

async function expectThrow(promise, label) {
    try {
        await promise;
    } catch (e) {
        console.log(`   ✅ ${label}: rejected (${e.message})`);
        return;
    }
    throw new Error(`${label} was incorrectly accepted!`);
}

async function runTests() {
    console.log("=================================================");
    console.log("⚡ TEST: AES-256-GCM ENCRYPTED FILE TUNNEL");
    console.log("=================================================\n");

    const A = await makePeer(); // initiator
    const B = await makePeer(); // responder

    // 1. Handshake, exactly as index.html performs it
    console.log("1. Running signed ECDH handshake...");
    const nonceA = generateNonce();
    const ephA = await generateSessionKeyPair();
    // -> CRYPTO_HELLO { nonce: nonceA, ephPub: ephA.pubB64 }

    const nonceB = generateNonce();
    const ephB = await generateSessionKeyPair();
    const sigB = await signChallenge(buildHandshakeTranscript(nonceA, ephB.pubB64, ephA.pubB64), B.privateKey);
    // -> CRYPTO_HELLO_REPLY { signature: sigB, nonce: nonceB, ephPub: ephB.pubB64 }

    if (!await verifyChallenge(buildHandshakeTranscript(nonceA, ephB.pubB64, ephA.pubB64), sigB, B.pubJwk)) {
        throw new Error("Initiator failed to verify responder signature");
    }
    const keyA = await deriveSessionKey(ephA.privateKey, ephB.pubB64, `${nonceA}|${nonceB}`);
    const sigA = await signChallenge(buildHandshakeTranscript(nonceB, ephA.pubB64, ephB.pubB64), A.privateKey);
    // -> CRYPTO_ACK { signature: sigA }

    if (!await verifyChallenge(buildHandshakeTranscript(nonceB, ephA.pubB64, ephB.pubB64), sigA, A.pubJwk)) {
        throw new Error("Responder failed to verify initiator signature");
    }
    const keyB = await deriveSessionKey(ephB.privateKey, ephA.pubB64, `${nonceA}|${nonceB}`);
    console.log("   ✅ Both peers verified and derived a session key");

    // 2. Encrypted file round trip
    console.log("\n2. Streaming a 100KB binary file through the tunnel...");
    const original = new Uint8Array(100 * 1024);
    globalThis.crypto.getRandomValues(original.subarray(0, 65536));
    globalThis.crypto.getRandomValues(original.subarray(65536));
    const chunkSize = 32 * 1024;
    const totalChunks = Math.ceil(original.length / chunkSize);
    const fileName = "top-secret-plans.pdf";

    const frames = [await encryptSessionPacket(keyA, { type: 'FILE_HEADER', fileId: 'f1', fileName, totalChunks })];
    for (let i = 0; i < totalChunks; i++) {
        const slice = original.slice(i * chunkSize, (i + 1) * chunkSize);
        frames.push(await encryptSessionPacket(keyA, { type: 'FILE_CHUNK', fileId: 'f1', chunkIndex: i, totalChunks, payload: bufferToBase64(slice) }));
    }

    // What travels over the wire must reveal nothing about the file
    const wire = frames.map(f => JSON.stringify(f)).join('');
    if (wire.includes(fileName) || wire.includes('FILE_HEADER') || wire.includes('FILE_CHUNK')) {
        throw new Error("Plaintext metadata leaked onto the wire!");
    }
    const ivs = new Set(frames.map(f => f.iv));
    if (ivs.size !== frames.length) throw new Error("IV reused across frames!");
    console.log(`   ✅ ${frames.length} frames on the wire: only {type:'SECURE_FRAME', iv, data}, unique IVs, no file name`);

    const received = [];
    let header = null;
    for (const f of frames) {
        const p = await decryptSessionPacket(keyB, f);
        if (p.type === 'FILE_HEADER') header = p;
        else received[p.chunkIndex] = new Uint8Array(base64ToBuffer(p.payload));
    }
    const rebuilt = Buffer.concat(received.map(u => Buffer.from(u)));
    if (header.fileName !== fileName || !rebuilt.equals(Buffer.from(original))) {
        throw new Error("Decrypted file does not match original!");
    }
    console.log("   ✅ Receiver decrypted file byte-for-byte identical");

    // 3. Tamper detection
    console.log("\n3. Tamper & interception tests...");
    const ct = new Uint8Array(base64ToBuffer(frames[1].data));
    ct[10] ^= 0x01;
    await expectThrow(decryptSessionPacket(keyB, { ...frames[1], data: bufferToBase64(ct) }), "Flipped ciphertext bit");

    const eve = await generateSessionKeyPair();
    const eveKey = await deriveSessionKey(eve.privateKey, ephA.pubB64, `${nonceA}|${nonceB}`);
    await expectThrow(decryptSessionPacket(eveKey, frames[1]), "Eavesdropper with own ECDH key");

    // 4. Man-in-the-middle swapping the ephemeral key must break the signature
    const mitmOk = await verifyChallenge(buildHandshakeTranscript(nonceA, eve.pubB64, ephA.pubB64), sigB, B.pubJwk);
    if (mitmOk) throw new Error("MITM ephemeral key substitution was accepted!");
    console.log("   ✅ MITM ephemeral key substitution: signature rejected");

    console.log("\n=================================================");
    console.log("🎉 ALL ENCRYPTED FILE TUNNEL TESTS PASSED!");
    console.log("=================================================");
}

runTests().catch(err => {
    console.error("❌ SECURE TRANSFER TEST FAILED:", err);
    process.exit(1);
});
