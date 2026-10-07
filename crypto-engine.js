// cryptoEngine.js - Shattering, Blinding, Masking & Index Mapping Engine

// Helper to convert an ArrayBuffer to a Hex String (for the Blind Indexes)
export function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Helper to convert ArrayBuffer to Base64 String for JSON transport
export function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Helper to convert Base64 String back to Uint8Array/ArrayBuffer
export function base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Shatters and blinds a file into anonymous encrypted noise shards.
 * @param {File} file - The raw file from the HTML input
 * @param {number} totalShards - Number of pieces to shatter into (e.g., 30)
 * @param {string} masterSecret - The user's private key/passphrase for the file
 * @param {string} identityPlate - The sender's alpha-numeric plate (e.g., "MH02AA")
 */
export async function shatterAndBlindFile(file, totalShards, masterSecret, identityPlate) {
    const fileBuffer = await file.arrayBuffer();
    const fileSize = fileBuffer.byteLength;
    const chunkSize = Math.ceil(fileSize / totalShards);
    
    // Generate a cryptographic key from the master secret string
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw", enc.encode(masterSecret), { name: "PBKDF2" }, false, ["deriveKey"]
    );
    const aesKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode("GhostSalt"), iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
    );

    const ghostShards = [];

    for (let i = 0; i < totalShards; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, fileSize);
        const chunkData = fileBuffer.slice(start, end);

        // 1. Encrypt the data shard into raw static noise
        const iv = crypto.getRandomValues(new Uint8Array(12)); // Unique Initialization Vector
        const encryptedPayload = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            chunkData
        );

        // 2. Generate the Blind Index (SHA-256 of Shard Number + Secret)
        const indexMaterial = enc.encode(`shard-${i}-${masterSecret}`);
        const blindIndexBuffer = await crypto.subtle.digest("SHA-256", indexMaterial);
        const blindIndex = bufferToHex(blindIndexBuffer);

        // 3. Mask the Identity Plate
        const maskedPlateMaterial = enc.encode(`${identityPlate}-${blindIndex}`);
        const maskedPlateBuffer = await crypto.subtle.digest("SHA-256", maskedPlateMaterial);
        const maskedRoutingPlate = bufferToHex(maskedPlateBuffer).substring(0, 16).toUpperCase();

        // 4. Cryptographic Shard Integrity Hash (SHA-256 of encrypted noise payload)
        const shardHashBuffer = await crypto.subtle.digest("SHA-256", encryptedPayload);
        const shardHash = bufferToHex(shardHashBuffer);

        const payloadBase64 = bufferToBase64(encryptedPayload);

        ghostShards.push({
            blindIndex: blindIndex,
            routingPlate: maskedRoutingPlate,
            iv: bufferToHex(iv),
            payload: payloadBase64,
            shardIndex: i,
            totalShards: totalShards,
            shardHash: shardHash
        });
    }

    return ghostShards;
}

/**
 * Cryptographic Integrity Verification Engine (Phase 4).
 * Re-hashes a fetched ghost shard payload using SHA-256 to confirm integrity before passing to reassembly.
 * @param {Object} ghostShard - The ghost shard object { payload, shardHash, ... }
 * @param {string} [expectedHash] - Optional expected SHA-256 hex hash (from Index Map or shard object)
 * @returns {Promise<{ isValid: boolean, computedHash: string, expectedHash: string, error?: string }>}
 */
export async function verifyShardIntegrity(ghostShard, expectedHash = null) {
    if (!ghostShard || !ghostShard.payload) {
        return { isValid: false, computedHash: '', expectedHash: expectedHash || '', error: 'Missing ghost shard payload' };
    }

    try {
        const payloadBuffer = typeof ghostShard.payload === 'string'
            ? base64ToBuffer(ghostShard.payload)
            : ghostShard.payload;

        const hashBuffer = await crypto.subtle.digest("SHA-256", payloadBuffer);
        const computedHash = bufferToHex(hashBuffer);

        const targetHash = expectedHash || ghostShard.shardHash;

        if (targetHash && computedHash.toLowerCase() !== targetHash.toLowerCase()) {
            return {
                isValid: false,
                computedHash: computedHash,
                expectedHash: targetHash,
                error: `Hash mismatch: Computed ${computedHash} does not match expected ${targetHash}`
            };
        }

        return {
            isValid: true,
            computedHash: computedHash,
            expectedHash: targetHash || computedHash
        };
    } catch (e) {
        return { isValid: false, computedHash: '', expectedHash: expectedHash || '', error: e.message };
    }
}

/**
 * Shard Anonymity Verification Engine.
 * Verifies that a node storing a shard sees ONLY random encrypted noise and a blindIndex,
 * with ZERO visibility into file name, file type, file size, or owner identity.
 */
export function verifyShardAnonymity(ghostShard) {
    if (!ghostShard || typeof ghostShard !== 'object') {
        return { isAnonymous: false, checkedFields: [], violations: ["Invalid shard payload object"] };
    }

    const forbiddenKeys = [
        "fileName", "filename", "name",
        "fileType", "filetype", "type", "mimeType", "mimetype",
        "owner", "ownerId", "senderId", "senderPhone",
        "masterSecret", "secret", "passphrase", "key",
        "filepath", "path", "originalName", "metadata"
    ];

    const violations = [];
    const keys = Object.keys(ghostShard);

    keys.forEach(k => {
        if (forbiddenKeys.includes(k)) {
            violations.push(`Metadata leak detected: forbidden field '${k}' present in shard.`);
        }
    });

    if (!ghostShard.blindIndex || typeof ghostShard.blindIndex !== 'string' || ghostShard.blindIndex.length < 16) {
        violations.push("Missing or invalid blindIndex hash.");
    }

    if (!ghostShard.routingPlate || typeof ghostShard.routingPlate !== 'string') {
        violations.push("Missing or invalid routingPlate.");
    }

    if (!ghostShard.iv || typeof ghostShard.iv !== 'string') {
        violations.push("Missing or invalid IV.");
    }

    if (!ghostShard.payload) {
        violations.push("Missing encrypted static noise payload.");
    }

    const isAnonymous = violations.length === 0;

    return {
        isAnonymous: isAnonymous,
        checkedFields: keys,
        violations: violations,
        auditTimestamp: new Date().toISOString()
    };
}

// --- PHASE 3: THE INDEX MAP & RETRIEVAL ENGINE ---

/**
 * Generates an unencrypted Index Map listing all blindIndex addresses in sequence.
 */
export function generateIndexMap(file, ghostShards) {
    const sequence = ghostShards.map(s => ({
        index: s.shardIndex,
        blindIndex: s.blindIndex,
        iv: s.iv,
        routingPlate: s.routingPlate,
        shardHash: s.shardHash
    }));

    return {
        fileId: `ghost-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        totalShards: ghostShards.length,
        shardSequence: sequence,
        createdAt: new Date().toISOString()
    };
}

/**
 * Encrypts an Index Map with the user's master passphrase.
 */
export async function encryptIndexMap(indexMap, masterSecret) {
    const enc = new TextEncoder();
    const mapJson = JSON.stringify(indexMap);

    const keyMaterial = await crypto.subtle.importKey(
        "raw", enc.encode(masterSecret), { name: "PBKDF2" }, false, ["deriveKey"]
    );
    const aesKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode("GhostMapSalt"), iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        enc.encode(mapJson)
    );

    const mapIdBuffer = await crypto.subtle.digest("SHA-256", enc.encode(`map-${indexMap.fileId}-${masterSecret}`));
    const mapId = bufferToHex(mapIdBuffer).substring(0, 16);

    return {
        mapId: mapId,
        fileId: indexMap.fileId,
        iv: bufferToHex(iv),
        encryptedData: bufferToBase64(encryptedBuffer),
        totalShards: indexMap.totalShards,
        createdAt: indexMap.createdAt
    };
}

/**
 * Decrypts an Encrypted Index Map Envelope using the user's master passphrase.
 */
export async function decryptIndexMap(encryptedEnvelope, masterSecret) {
    if (!encryptedEnvelope || !encryptedEnvelope.encryptedData || !encryptedEnvelope.iv) {
        throw new Error("Invalid Encrypted Index Map Envelope structure.");
    }

    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const keyMaterial = await crypto.subtle.importKey(
        "raw", enc.encode(masterSecret), { name: "PBKDF2" }, false, ["deriveKey"]
    );
    const aesKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode("GhostMapSalt"), iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );

    const ivBuffer = new Uint8Array(
        encryptedEnvelope.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );
    const encryptedBuffer = base64ToBuffer(encryptedEnvelope.encryptedData);

    try {
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivBuffer },
            aesKey,
            encryptedBuffer
        );

        const mapJson = dec.decode(decryptedBuffer);
        return JSON.parse(mapJson);
    } catch (e) {
        throw new Error("Decryption failed: Incorrect master passphrase or corrupted Index Map.");
    }
}

/**
 * Decrypts an individual ghost shard payload into raw chunk bytes.
 */
export async function decryptAndReconstructShard(ghostShard, masterSecret) {
    if (!ghostShard || !ghostShard.payload || !ghostShard.iv) {
        throw new Error("Invalid ghost shard structure for decryption.");
    }

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw", enc.encode(masterSecret), { name: "PBKDF2" }, false, ["deriveKey"]
    );
    const aesKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode("GhostSalt"), iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );

    const ivBuffer = new Uint8Array(
        ghostShard.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );

    const payloadBuffer = typeof ghostShard.payload === 'string'
        ? base64ToBuffer(ghostShard.payload)
        : ghostShard.payload;

    try {
        const chunkData = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivBuffer },
            aesKey,
            payloadBuffer
        );
        return new Uint8Array(chunkData);
    } catch (e) {
        throw new Error(`Failed to decrypt shard payload for blind index ${ghostShard.blindIndex.substring(0, 8)}...`);
    }
}

/**
 * Generates an asymmetric cryptographic keypair using Web Crypto API (crypto.subtle).
 * Defaults to ECDSA P-256 for compact, secure digital signature & identity generation.
 */
export async function generateIdentityKeypair(algorithm = { name: "ECDSA", namedCurve: "P-256" }) {
    const subtle = globalThis.crypto?.subtle || (typeof window !== 'undefined' ? window.crypto.subtle : null);
    if (!subtle) {
        throw new Error("Web Crypto API (crypto.subtle) is unavailable in this environment.");
    }
    const usages = algorithm.name === "ECDSA" || algorithm.name.includes("RSA") ? ["sign", "verify"] : ["deriveKey", "deriveBits"];
    return await subtle.generateKey(algorithm, true, usages);
}

/**
 * Derives a deterministic, unchangeable 6-digit phone number, formatted phone number,
 * and 64-character SHA-256 fingerprint from an exported public key SPKI buffer.
 */
export async function derivePhoneNumberFromPublicKey(spkiBuffer) {
    const subtle = globalThis.crypto?.subtle || (typeof window !== 'undefined' ? window.crypto.subtle : null);
    if (!subtle) {
        throw new Error("Web Crypto API (crypto.subtle) is unavailable.");
    }
    const digestBuffer = await subtle.digest("SHA-256", spkiBuffer);
    const fingerprint = bufferToHex(digestBuffer);

    // Derive deterministic 6-digit number (100000 - 999999) from first 8 hex characters
    const numericSeed = parseInt(fingerprint.substring(0, 8), 16);
    const phone6 = (100000 + (numericSeed % 900000)).toString();

    // Derive deterministic 10-digit number for formatted identity
    const seed2 = parseInt(fingerprint.substring(8, 16), 16);
    const n1 = (100 + (numericSeed % 900)).toString();
    const n2 = (100 + (seed2 % 900)).toString();
    const n3 = (1000 + (numericSeed % 9000)).toString();
    const fullPhone = `+1-${n1}-${n2}-${n3}`;

    return {
        phone: phone6,
        fullPhone: fullPhone,
        fingerprint: fingerprint
    };
}

/**
 * Exports a Web Crypto CryptoKey to JWK (JSON Web Key) object for persistence/storage.
 */
export async function exportKeyToJwk(key) {
    const subtle = globalThis.crypto?.subtle || (typeof window !== 'undefined' ? window.crypto.subtle : null);
    return await subtle.exportKey("jwk", key);
}

/**
 * Imports a JWK object back into a Web Crypto CryptoKey.
 */
export async function importKeyFromJwk(jwk, algorithm = { name: "ECDSA", namedCurve: "P-256" }, keyUsages = ["sign", "verify"]) {
    const subtle = globalThis.crypto?.subtle || (typeof window !== 'undefined' ? window.crypto.subtle : null);
    return await subtle.importKey("jwk", jwk, algorithm, true, keyUsages);
}

/**
 * Encrypts a contact object (label, phone, fingerprint, notes) into an AES-GCM envelope.
 * @param {Object} contactObj - { phone, label, fingerprint, notes }
 * @param {string} masterSecret - User's master passphrase for local address book encryption
 */
export async function encryptContact(contactObj, masterSecret = "ghost-address-book-key") {
    if (!contactObj || !contactObj.phone) {
        throw new Error("Contact object must contain at least a valid phone number.");
    }

    const subtle = globalThis.crypto?.subtle || (typeof window !== 'undefined' ? window.crypto.subtle : null);
    if (!subtle) throw new Error("Web Crypto API is unavailable.");

    const enc = new TextEncoder();
    const jsonStr = JSON.stringify({
        phone: contactObj.phone,
        label: contactObj.label || "",
        fingerprint: contactObj.fingerprint || "",
        notes: contactObj.notes || "",
        createdAt: contactObj.createdAt || Date.now(),
        updatedAt: Date.now()
    });

    const keyMaterial = await subtle.importKey(
        "raw", enc.encode(masterSecret), { name: "PBKDF2" }, false, ["deriveKey"]
    );
    const aesKey = await subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode("GhostContactSalt"), iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
    );

    const iv = (globalThis.crypto || window.crypto).getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        enc.encode(jsonStr)
    );

    return {
        phone: contactObj.phone,
        iv: bufferToHex(iv),
        encryptedData: bufferToBase64(encryptedBuffer),
        createdAt: contactObj.createdAt || Date.now(),
        updatedAt: Date.now()
    };
}

/**
 * Decrypts an encrypted contact envelope back to plain contact JSON object.
 * @param {Object} envelope - { phone, iv, encryptedData }
 * @param {string} masterSecret - User's master passphrase for address book decryption
 */
export async function decryptContact(envelope, masterSecret = "ghost-address-book-key") {
    if (!envelope || !envelope.encryptedData || !envelope.iv) {
        throw new Error("Invalid contact envelope structure.");
    }

    const subtle = globalThis.crypto?.subtle || (typeof window !== 'undefined' ? window.crypto.subtle : null);
    if (!subtle) throw new Error("Web Crypto API is unavailable.");

    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const keyMaterial = await subtle.importKey(
        "raw", enc.encode(masterSecret), { name: "PBKDF2" }, false, ["deriveKey"]
    );
    const aesKey = await subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode("GhostContactSalt"), iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );

    const ivBuffer = new Uint8Array(
        envelope.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );
    const encryptedBuffer = base64ToBuffer(envelope.encryptedData);

    try {
        const decryptedBuffer = await subtle.decrypt(
            { name: "AES-GCM", iv: ivBuffer },
            aesKey,
            encryptedBuffer
        );
        const jsonStr = dec.decode(decryptedBuffer);
        return JSON.parse(jsonStr);
    } catch (e) {
        throw new Error("Failed to decrypt contact: Incorrect master secret or corrupted envelope.");
    }
}

// ─── CRYPTOGRAPHIC HANDSHAKE HELPERS ────────────────────────────────────────

/**
 * Generates a cryptographically random 256-bit nonce as a hex string.
 */
export function generateNonce() {
    const buf = new Uint8Array(32);
    (globalThis.crypto || window.crypto).getRandomValues(buf);
    return bufferToHex(buf);
}

/**
 * Signs a nonce (hex string) using an ECDSA P-256 private CryptoKey.
 * Returns the signature as a base64 string suitable for JSON transport.
 * @param {string} nonce - 64-char hex nonce
 * @param {CryptoKey} privateKey - ECDSA P-256 private key (extractable or non-extractable)
 */
export async function signChallenge(nonce, privateKey) {
    const subtle = globalThis.crypto?.subtle || (typeof window !== 'undefined' ? window.crypto.subtle : null);
    if (!subtle) throw new Error("Web Crypto API unavailable.");

    const enc = new TextEncoder();
    const nonceBytes = enc.encode(nonce);
    const signatureBuffer = await subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        privateKey,
        nonceBytes
    );
    return bufferToBase64(signatureBuffer);
}

/**
 * Verifies an ECDSA P-256 signature against a nonce using a JWK public key.
 * Returns true if the signature is valid, false otherwise.
 * @param {string} nonce - 64-char hex nonce that was signed
 * @param {string} signatureBase64 - base64-encoded DER signature
 * @param {Object} pubJwk - JWK representation of the peer's public key
 */
export async function verifyChallenge(nonce, signatureBase64, pubJwk) {
    const subtle = globalThis.crypto?.subtle || (typeof window !== 'undefined' ? window.crypto.subtle : null);
    if (!subtle) throw new Error("Web Crypto API unavailable.");

    try {
        const pubKey = await subtle.importKey(
            "jwk",
            pubJwk,
            { name: "ECDSA", namedCurve: "P-256" },
            false,
            ["verify"]
        );
        const enc = new TextEncoder();
        const nonceBytes = enc.encode(nonce);
        const sigBuffer = base64ToBuffer(signatureBase64);
        return await subtle.verify(
            { name: "ECDSA", hash: "SHA-256" },
            pubKey,
            sigBuffer,
            nonceBytes
        );
    } catch (e) {
        return false;
    }
}

// ─── ENCRYPTED P2P FILE TRANSFER (AES-256-GCM SESSION TUNNEL) ───────────────
// Each verified peer link gets its own AES-256-GCM key, derived from an ephemeral
// ECDH P-256 exchange that is bound to both identity keys by the signed handshake.
// Every file header and chunk then travels as authenticated ciphertext (random noise
// to anyone without the key), with a fresh 96-bit IV per packet.

function getSubtle() {
    const subtle = globalThis.crypto?.subtle || (typeof window !== 'undefined' ? window.crypto.subtle : null);
    if (!subtle) throw new Error("Web Crypto API unavailable.");
    return subtle;
}

/**
 * Generates a single-use ECDH P-256 keypair for one peer session.
 * Returns { privateKey, publicKey, pubB64 } where pubB64 is the raw public point in base64.
 */
export async function generateSessionKeyPair() {
    const subtle = getSubtle();
    const keyPair = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
    const rawPub = await subtle.exportKey("raw", keyPair.publicKey);
    return { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey, pubB64: bufferToBase64(rawPub) };
}

/**
 * Builds the exact string each side signs during the handshake so the ephemeral ECDH keys
 * are bound to the signer's identity (prevents a man-in-the-middle swapping them).
 */
export function buildHandshakeTranscript(nonce, signerEphPubB64, otherEphPubB64) {
    return `ghost-session-v1|${nonce}|${signerEphPubB64}|${otherEphPubB64}`;
}

/**
 * Derives the shared AES-256-GCM session key from our ephemeral private key and the peer's
 * ephemeral public key using ECDH + HKDF-SHA-256. Both peers must pass the same salt string.
 */
export async function deriveSessionKey(myPrivateKey, theirPubB64, salt) {
    const subtle = getSubtle();
    const enc = new TextEncoder();
    const theirPub = await subtle.importKey(
        "raw", base64ToBuffer(theirPubB64), { name: "ECDH", namedCurve: "P-256" }, false, []
    );
    const sharedBits = await subtle.deriveBits({ name: "ECDH", public: theirPub }, myPrivateKey, 256);
    const hkdfKey = await subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
    return await subtle.deriveKey(
        { name: "HKDF", hash: "SHA-256", salt: enc.encode(salt), info: enc.encode("ghost-mesh-file-tunnel") },
        hkdfKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
}

/**
 * Encrypts a JSON-serialisable packet into an AES-GCM envelope { type: 'SECURE_FRAME', iv, data }.
 */
export async function encryptSessionPacket(sessionKey, packet) {
    const subtle = getSubtle();
    const iv = (globalThis.crypto || window.crypto).getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(packet));
    const ciphertext = await subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: new TextEncoder().encode("SECURE_FRAME") },
        sessionKey, plaintext
    );
    return { type: 'SECURE_FRAME', iv: bufferToBase64(iv), data: bufferToBase64(ciphertext) };
}

/**
 * Decrypts and authenticates a SECURE_FRAME envelope back into the original packet.
 * Throws if the frame was tampered with or encrypted under a different key.
 */
export async function decryptSessionPacket(sessionKey, envelope) {
    if (!envelope || !envelope.iv || !envelope.data) {
        throw new Error("Invalid SECURE_FRAME envelope.");
    }
    const subtle = getSubtle();
    try {
        const plaintext = await subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(base64ToBuffer(envelope.iv)), additionalData: new TextEncoder().encode("SECURE_FRAME") },
            sessionKey, base64ToBuffer(envelope.data)
        );
        return JSON.parse(new TextDecoder().decode(plaintext));
    } catch (e) {
        throw new Error("SECURE_FRAME authentication failed: tampered data or wrong session key.");
    }
}
