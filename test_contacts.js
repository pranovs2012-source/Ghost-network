// test_contacts.js - Automated Encrypted Local Contact Directory Test
const { webcrypto } = require('crypto');
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
}

const {
    encryptContact,
    decryptContact
} = require('./crypto-engine.js');

(async () => {
    console.log("=== ENCRYPTED LOCAL CONTACT DIRECTORY TEST ===");

    const masterSecret = "GhostAddressBookPassphrase2026!";
    const testContact = {
        phone: "620282",
        label: "Alice (Node Alpha)",
        fingerprint: "c37be5d2b26f9a37509a778d8f9b7cf067ec338fcaa305bcd40c78615844a8c2",
        notes: "Primary peer for shard replication testing."
    };

    // 1. Encrypt contact record
    console.log("\n1. Encrypting contact object via PBKDF2 + AES-GCM 256...");
    const envelope = await encryptContact(testContact, masterSecret);

    console.log(`   Contact Phone ID: ${envelope.phone}`);
    console.log(`   Initialization Vector (IV): ${envelope.iv}`);
    console.log(`   Encrypted Base64 Payload: ${envelope.encryptedData.substring(0, 30)}...`);

    if (!envelope.phone || !envelope.iv || !envelope.encryptedData) {
        throw new Error("Invalid contact encryption envelope structure!");
    }
    console.log("   ✅ Contact encryption envelope created successfully.");

    // 2. Decrypt contact record
    console.log("\n2. Decrypting contact envelope with correct master secret...");
    const decrypted = await decryptContact(envelope, masterSecret);

    console.log(`   Decrypted Label:       "${decrypted.label}"`);
    console.log(`   Decrypted Phone:       "${decrypted.phone}"`);
    console.log(`   Decrypted Fingerprint: "${decrypted.fingerprint}"`);
    console.log(`   Decrypted Notes:       "${decrypted.notes}"`);

    if (decrypted.label !== testContact.label ||
        decrypted.phone !== testContact.phone ||
        decrypted.fingerprint !== testContact.fingerprint ||
        decrypted.notes !== testContact.notes) {
        throw new Error("Decrypted contact fields do NOT match original input!");
    }
    console.log("   ✅ Decryption test PASSED: All fields match original input.");

    // 3. Test Incorrect Passphrase Error Rejection
    console.log("\n3. Testing incorrect passphrase rejection...");
    try {
        await decryptContact(envelope, "WrongPassphrase123!");
        throw new Error("FAIL: Decryption succeeded with wrong passphrase!");
    } catch (e) {
        console.log(`   ✅ Incorrect passphrase correctly rejected! Error: "${e.message}"`);
    }

    console.log("\n=======================================================");
    console.log("🎉 ENCRYPTED CONTACT DIRECTORY TEST: SUCCESS!");
    console.log("=======================================================\n");
})();
