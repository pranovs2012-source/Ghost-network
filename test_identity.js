// test_identity.js - Automated Cryptographic Identity & Keypair Persistence Test
const { webcrypto } = require('crypto');
// Ensure crypto.subtle is available in Node runtime
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
}

const {
    generateIdentityKeypair,
    derivePhoneNumberFromPublicKey,
    exportKeyToJwk,
    importKeyFromJwk,
    bufferToHex
} = require('./crypto-engine.js');

(async () => {
    console.log("=== CRYPTOGRAPHIC IDENTITY & KEYPAIR PERSISTENCE TEST ===");

    // 1. Generate standard ECDSA P-256 keypair
    console.log("\n1. Generating ECDSA P-256 asymmetric keypair via crypto.subtle...");
    const keyPair = await generateIdentityKeypair();
    if (!keyPair || !keyPair.publicKey || !keyPair.privateKey) {
        throw new Error("Keypair generation failed!");
    }
    console.log("   ✅ Keypair generated successfully.");

    // 2. Export public key to SPKI & derive network identity (phone number)
    console.log("\n2. Exporting Public Key (SPKI) & deriving SHA-256 fingerprint...");
    const spkiBuffer = await globalThis.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const identity = await derivePhoneNumberFromPublicKey(spkiBuffer);

    console.log(`   Derived Phone Number (6-digit): ${identity.phone}`);
    console.log(`   Formatted Phone Number:         ${identity.fullPhone}`);
    console.log(`   Public Key SHA-256 Fingerprint: ${identity.fingerprint}`);

    if (!identity.phone || identity.phone.length !== 6 || isNaN(identity.phone)) {
        throw new Error("Invalid 6-digit phone number derived!");
    }
    if (!identity.fingerprint || identity.fingerprint.length !== 64) {
        throw new Error("Invalid SHA-256 fingerprint derived!");
    }
    console.log("   ✅ Identity phone number & fingerprint verified.");

    // 3. Test Determinism (same public key MUST always produce identical phone number & fingerprint)
    console.log("\n3. Testing Determinism...");
    const identity2 = await derivePhoneNumberFromPublicKey(spkiBuffer);
    if (identity.phone !== identity2.phone || identity.fingerprint !== identity2.fingerprint) {
        throw new Error("Determinism test failed: Same key produced different phone numbers!");
    }
    console.log("   ✅ Determinism test PASSED: Identical keys produce exact same phone number & fingerprint.");

    // 4. Test JWK serialization round-trip for IndexedDB persistence
    console.log("\n4. Testing JWK serialization round-trip...");
    const pubJwk = await exportKeyToJwk(keyPair.publicKey);
    const privJwk = await exportKeyToJwk(keyPair.privateKey);

    const restoredPubKey = await importKeyFromJwk(pubJwk, { name: "ECDSA", namedCurve: "P-256" }, ["verify"]);
    const restoredPrivKey = await importKeyFromJwk(privJwk, { name: "ECDSA", namedCurve: "P-256" }, ["sign"]);

    const restoredSpki = await globalThis.crypto.subtle.exportKey("spki", restoredPubKey);
    const restoredIdentity = await derivePhoneNumberFromPublicKey(restoredSpki);

    if (restoredIdentity.fingerprint !== identity.fingerprint) {
        throw new Error("JWK import/export round-trip corrupted the public key identity!");
    }
    console.log("   ✅ JWK serialization round-trip PASSED.");

    console.log("\n=======================================================");
    console.log("🎉 PERMANENT CRYPTOGRAPHIC KEYPAIR TEST: SUCCESS!");
    console.log("=======================================================\n");
})();
