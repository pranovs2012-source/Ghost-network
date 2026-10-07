// test_phase4.js - Automated End-to-End Cryptographic Integrity & Reassembly Test
const {
    shatterAndBlindFile,
    verifyShardIntegrity,
    generateIndexMap,
    encryptIndexMap,
    decryptIndexMap,
    decryptAndReconstructShard
} = require('./crypto-engine.js');

class MockFile {
    constructor(buffer, name, type) {
        this._buffer = buffer;
        this.name = name;
        this.size = buffer.byteLength;
        this.type = type || 'text/plain';
    }

    async arrayBuffer() {
        return this._buffer;
    }
}

(async () => {
    console.log("=== PHASE 4: CRYPTOGRAPHIC INTEGRITY & REASSEMBLY TEST ===");

    // 1. Prepare original input file
    const originalText = "GHOST STATE NETWORK - Phase 4 Cryptographic Verification & Reassembly Test Secret Payload Data 1234567890!";
    const originalBuffer = new TextEncoder().encode(originalText).buffer;
    const testFile = new MockFile(originalBuffer, "confidential_spec.txt", "text/plain");
    const masterSecret = "TopSecretMasterPassphrase2026!";
    const totalShards = 5;

    console.log(`\n1. Original File: "${testFile.name}" (${testFile.size} bytes)`);
    console.log(`   Master Passphrase: "${masterSecret}"`);

    // 2. Shatter and blind file into anonymous shards
    console.log(`\n2. Shattering file into ${totalShards} anonymous shards...`);
    const ghostShards = await shatterAndBlindFile(testFile, totalShards, masterSecret, "MH02GHOST");
    console.log(`   Generated ${ghostShards.length} ghost shards.`);

    // Assert each shard has valid shardHash and blindIndex
    ghostShards.forEach((s, idx) => {
        if (!s.shardHash || s.shardHash.length !== 64) {
            throw new Error(`Shard #${idx} missing valid 64-char SHA-256 shardHash!`);
        }
        if (!s.blindIndex || s.blindIndex.length !== 64) {
            throw new Error(`Shard #${idx} missing valid 64-char blindIndex!`);
        }
    });
    console.log("   ✅ Shard generation verified: All shards contain valid 256-bit SHA-256 integrity hashes.");

    // 3. Test Cryptographic Hash Verification on valid shards
    console.log("\n3. Testing Hash Verification on fetched shards...");
    for (const shard of ghostShards) {
        const hashResult = await verifyShardIntegrity(shard);
        if (!hashResult.isValid) {
            throw new Error(`Hash verification failed for shard ${shard.blindIndex.substring(0, 8)}: ${hashResult.error}`);
        }
    }
    console.log("   ✅ Hash verification PASSED for all clean shards.");

    // 4. Test Tampering Detection (Corrupting a shard payload)
    console.log("\n4. Testing Tamper Detection (corrupting shard #2 payload)...");
    const tamperedShard = JSON.parse(JSON.stringify(ghostShards[2]));
    // Flip bytes in base64 payload
    const payloadBytes = new Uint8Array(Buffer.from(tamperedShard.payload, 'base64'));
    payloadBytes[0] ^= 0xFF; // Tamper with first byte
    tamperedShard.payload = Buffer.from(payloadBytes).toString('base64');

    const tamperResult = await verifyShardIntegrity(tamperedShard);
    if (tamperResult.isValid) {
        throw new Error("FAIL: Tampered shard passed hash verification! Integrity check is broken.");
    }
    console.log(`   ✅ Tamper detection PASSED: Corrupted shard correctly rejected! Error: "${tamperResult.error}"`);

    // 5. Generate and encrypt Index Map
    console.log("\n5. Generating and Encrypting Index Map Vault Envelope...");
    const plainMap = generateIndexMap(testFile, ghostShards);
    const encryptedEnvelope = await encryptIndexMap(plainMap, masterSecret);
    console.log(`   Map ID: ${encryptedEnvelope.mapId} (Total Shards: ${encryptedEnvelope.totalShards})`);

    // 6. Decrypt Index Map
    console.log("\n6. Decrypting Index Map Envelope with Master Passphrase...");
    const decryptedMap = await decryptIndexMap(encryptedEnvelope, masterSecret);
    if (decryptedMap.fileName !== testFile.name || decryptedMap.shardSequence.length !== totalShards) {
        throw new Error("Index Map decryption structure mismatch!");
    }
    console.log("   ✅ Index Map decrypted successfully.");

    // 7. Full-Cycle Decryption and Reassembly
    console.log("\n7. Full-Cycle Reassembly: Decrypting shards & rebuilding exact original file...");
    const decryptedChunks = [];
    for (let i = 0; i < decryptedMap.shardSequence.length; i++) {
        const entry = decryptedMap.shardSequence[i];
        const shard = ghostShards.find(s => s.blindIndex === entry.blindIndex);

        // Verify integrity before passing to decryption
        const integrity = await verifyShardIntegrity(shard, entry.shardHash);
        if (!integrity.isValid) {
            throw new Error(`Integrity check failed during reassembly for shard index ${i}`);
        }

        const chunkBytes = await decryptAndReconstructShard(shard, masterSecret);
        decryptedChunks.push(chunkBytes);
    }

    // Concatenate chunks
    const totalBytes = decryptedChunks.reduce((acc, c) => acc + c.length, 0);
    const reassembledBuffer = new Uint8Array(totalBytes);
    let offset = 0;
    decryptedChunks.forEach(chunk => {
        reassembledBuffer.set(chunk, offset);
        offset += chunk.length;
    });

    const reassembledText = new TextDecoder().decode(reassembledBuffer);
    console.log(`   Reassembled Output: "${reassembledText}" (${reassembledBuffer.byteLength} bytes)`);

    // 8. Assert exact match with original
    const match = (originalText === reassembledText) && (originalBuffer.byteLength === reassembledBuffer.byteLength);
    if (!match) {
        console.error("❌ FAILURE: Reassembled text does NOT match original!");
        process.exit(1);
    }

    console.log("\n=======================================================");
    console.log("🎉 PHASE 4 FULL-CYCLE REASSEMBLY & INTEGRITY TEST: SUCCESS!");
    console.log("=======================================================\n");
})();
