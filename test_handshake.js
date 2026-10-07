// test_handshake.js - Automated Cryptographic Handshake Signature Verification Test
const { webcrypto } = require('crypto');
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
}

const {
    generateIdentityKeypair,
    derivePhoneNumberFromPublicKey,
    generateNonce,
    signChallenge,
    verifyChallenge
} = require('./crypto-engine.js');


async function runTests() {
    console.log("=================================================");
    console.log("⚡ TEST: CRYPTOGRAPHIC HANDSHAKE SIGNATURE AUTH");
    console.log("=================================================\n");

    // 1. Generate identity keypairs for Peer A and Peer B
    console.log("1. Generating identity keypairs for Peer A and Peer B...");
    const keypairA = await generateIdentityKeypair();
    const keypairB = await generateIdentityKeypair();

    const spkiA = await globalThis.crypto.subtle.exportKey("spki", keypairA.publicKey);
    const jwkA = await globalThis.crypto.subtle.exportKey("jwk", keypairA.publicKey);
    const idA = await derivePhoneNumberFromPublicKey(spkiA);

    const spkiB = await globalThis.crypto.subtle.exportKey("spki", keypairB.publicKey);
    const jwkB = await globalThis.crypto.subtle.exportKey("jwk", keypairB.publicKey);
    const idB = await derivePhoneNumberFromPublicKey(spkiB);

    const peerA = { ...keypairA, pubJwk: jwkA, ...idA };
    const peerB = { ...keypairB, pubJwk: jwkB, ...idB };

    console.log(`   Peer A Phone: ${peerA.phone} | Fingerprint: ${peerA.fingerprint.substring(0, 16)}...`);
    console.log(`   Peer B Phone: ${peerB.phone} | Fingerprint: ${peerB.fingerprint.substring(0, 16)}...`);


    // 2. Peer A generates challenge nonce for Peer B
    console.log("\n2. Peer A generates 256-bit challenge nonce...");
    const nonceA = generateNonce();
    console.log(`   Nonce A: ${nonceA}`);

    // 3. Peer B signs Peer A's nonce using Peer B's private key
    console.log("\n3. Peer B signs Nonce A using ECDSA P-256 private key...");
    const sigB = await signChallenge(nonceA, peerB.privateKey);
    console.log(`   Signature B (base64): ${sigB.substring(0, 32)}...`);

    // 4. Peer A verifies Peer B's signature using Peer B's public key JWK
    console.log("\n4. Peer A verifies Peer B's signature using Peer B's JWK public key...");
    const isValidB = await verifyChallenge(nonceA, sigB, peerB.pubJwk);
    console.log(`   Verification result: ${isValidB ? "✅ VALID SIGNATURE" : "❌ INVALID SIGNATURE"}`);
    if (!isValidB) throw new Error("Peer B signature verification failed!");

    // 5. Anti-Tamper Test: Tamper with nonce string
    console.log("\n5. Tamper Detection Test 1: Tampered Nonce...");
    const tamperedNonce = nonceA.replace(nonceA[0], nonceA[0] === 'a' ? 'b' : 'a');
    const isValidTamperedNonce = await verifyChallenge(tamperedNonce, sigB, peerB.pubJwk);
    console.log(`   Tampered nonce verification result: ${isValidTamperedNonce ? "❌ INCORRECT ACCEPT" : "✅ REJECTED (Expected)"}`);
    if (isValidTamperedNonce) throw new Error("Tampered nonce was incorrectly accepted!");

    // 6. Anti-Tamper Test: Impersonation with wrong public key (Peer A's JWK instead of Peer B's JWK)
    console.log("\n6. Tamper Detection Test 2: Public Key Impersonation Attack...");
    const isValidImpersonator = await verifyChallenge(nonceA, sigB, peerA.pubJwk);
    console.log(`   Impersonation verification result: ${isValidImpersonator ? "❌ INCORRECT ACCEPT" : "✅ REJECTED (Expected)"}`);
    if (isValidImpersonator) throw new Error("Impersonation signature was incorrectly accepted!");

    console.log("\n=================================================");
    console.log("🎉 ALL HANDSHAKE CRYPTOGRAPHIC TESTS PASSED!");
    console.log("=================================================");
}

runTests().catch(err => {
    console.error("❌ HANDSHAKE TEST FAILED:", err);
    process.exit(1);
});
