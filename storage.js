// storage.js - The Ghost State Storage Interface (IndexedDB Persistence Layer)

import {
    generateIdentityKeypair,
    derivePhoneNumberFromPublicKey,
    exportKeyToJwk,
    importKeyFromJwk,
    bufferToBase64,
    encryptContact,
    decryptContact
} from './crypto-engine.js';

const DB_NAME = "GhostStateStoragePool";
const DB_VERSION = 4; // Bumped to 4 to add encrypted contacts (address book) object store
const STORE_NAME = "ghost_shards";
const MAP_STORE_NAME = "index_maps";
const IDENTITY_STORE_NAME = "network_identity";
const CONTACTS_STORE_NAME = "contacts";

/**
 * Initialize IndexedDB for Ghost Shard, Index Map, Network Identity, and Encrypted Address Book persistence.
 */
export function initStorage() {
    return new Promise((resolve, reject) => {
        const idb = globalThis.indexedDB || (typeof window !== 'undefined' ? window.indexedDB : null);
        if (!idb) {
            reject(new Error("IndexedDB is not supported in this browser environment."));
            return;
        }

        const request = idb.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Primary key is the anonymous Blind Index hash
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: "blindIndex" });
                store.createIndex("storedAt", "storedAt", { unique: false });
            }
            // Index Maps store - keyed by mapId
            if (!db.objectStoreNames.contains(MAP_STORE_NAME)) {
                const mapStore = db.createObjectStore(MAP_STORE_NAME, { keyPath: "mapId" });
                mapStore.createIndex("createdAt", "createdAt", { unique: false });
            }
            // Permanent Network Identity store - keyed by id
            if (!db.objectStoreNames.contains(IDENTITY_STORE_NAME)) {
                db.createObjectStore(IDENTITY_STORE_NAME, { keyPath: "id" });
            }
            // Encrypted Contacts Store - keyed by phone number
            if (!db.objectStoreNames.contains(CONTACTS_STORE_NAME)) {
                const contactStore = db.createObjectStore(CONTACTS_STORE_NAME, { keyPath: "phone" });
                contactStore.createIndex("createdAt", "createdAt", { unique: false });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}



/**
 * Save a verified anonymous ghost shard to the local browser pool.
 */
export function saveShard(db, ghostShard) {
    return new Promise((resolve, reject) => {
        if (!db || !ghostShard || !ghostShard.blindIndex) {
            reject(new Error("Invalid DB instance or ghost shard structure."));
            return;
        }

        const record = {
            ...ghostShard,
            storedAt: ghostShard.storedAt || Date.now()
        };

        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(record);

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Retrieve a specific ghost shard by its blind index.
 */
export function getShard(db, blindIndex) {
    return new Promise((resolve, reject) => {
        if (!db || !blindIndex) { resolve(null); return; }

        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(blindIndex);

        request.onsuccess = (event) => resolve(event.target.result || null);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Get all ghost shards stored in local IndexedDB pool.
 */
export function getAllShards(db) {
    return new Promise((resolve, reject) => {
        if (!db) { resolve([]); return; }

        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => resolve(event.target.result || []);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Delete a specific ghost shard from local storage pool.
 */
export function deleteShard(db, blindIndex) {
    return new Promise((resolve, reject) => {
        if (!db || !blindIndex) { resolve(false); return; }

        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(blindIndex);

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Clear all stored shards from local browser storage pool.
 */
export function clearStorage(db) {
    return new Promise((resolve, reject) => {
        if (!db) { resolve(true); return; }

        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Get storage statistics (total shard count and estimated byte size).
 */
export async function getStorageStats(db) {
    const shards = await getAllShards(db);
    let totalBytes = 0;

    shards.forEach(s => {
        if (s.payload) {
            if (typeof s.payload === 'string') totalBytes += s.payload.length;
            else if (s.payload.byteLength) totalBytes += s.payload.byteLength;
        }
        if (s.blindIndex) totalBytes += s.blindIndex.length;
        if (s.routingPlate) totalBytes += s.routingPlate.length;
        if (s.iv) totalBytes += s.iv.length;
    });

    return {
        count: shards.length,
        totalBytes: totalBytes,
        formattedSize: totalBytes > 1024 * 1024
            ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
            : `${(totalBytes / 1024).toFixed(2)} KB`
    };
}

// --- PHASE 3: INDEX MAP PERSISTENCE ---

/**
 * Save an encrypted Index Map envelope to local IndexedDB.
 * @param {IDBDatabase} db
 * @param {Object} mapEnvelope - { mapId, fileId, iv, encryptedData, totalShards, createdAt }
 */
export function saveIndexMap(db, mapEnvelope) {
    return new Promise((resolve, reject) => {
        if (!db || !mapEnvelope || !mapEnvelope.mapId) {
            reject(new Error("Invalid DB instance or map envelope structure."));
            return;
        }

        const record = {
            ...mapEnvelope,
            savedAt: Date.now()
        };

        const transaction = db.transaction([MAP_STORE_NAME], "readwrite");
        const store = transaction.objectStore(MAP_STORE_NAME);
        const request = store.put(record);

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Retrieve a specific encrypted Index Map by its mapId.
 * @param {IDBDatabase} db
 * @param {string} mapId
 */
export function getIndexMap(db, mapId) {
    return new Promise((resolve, reject) => {
        if (!db || !mapId) { resolve(null); return; }

        const transaction = db.transaction([MAP_STORE_NAME], "readonly");
        const store = transaction.objectStore(MAP_STORE_NAME);
        const request = store.get(mapId);

        request.onsuccess = (event) => resolve(event.target.result || null);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Get all stored Index Map envelopes.
 * @param {IDBDatabase} db
 */
export function getAllIndexMaps(db) {
    return new Promise((resolve, reject) => {
        if (!db) { resolve([]); return; }

        const transaction = db.transaction([MAP_STORE_NAME], "readonly");
        const store = transaction.objectStore(MAP_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => resolve(event.target.result || []);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Delete a specific Index Map from local storage.
 * @param {IDBDatabase} db
 * @param {string} mapId
 */
export function deleteIndexMap(db, mapId) {
    return new Promise((resolve, reject) => {
        if (!db || !mapId) { resolve(false); return; }

        const transaction = db.transaction([MAP_STORE_NAME], "readwrite");
        const store = transaction.objectStore(MAP_STORE_NAME);
        const request = store.delete(mapId);

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

// --- PERMANENT NETWORK IDENTITY PERSISTENCE LAYER ---

const IDENTITY_KEY_ID = "permanent_identity";

/**
 * Retrieve the stored network identity record from IndexedDB.
 * @param {IDBDatabase} db
 */
export function getStoredIdentity(db) {
    return new Promise((resolve, reject) => {
        if (!db) { resolve(null); return; }

        const transaction = db.transaction([IDENTITY_STORE_NAME], "readonly");
        const store = transaction.objectStore(IDENTITY_STORE_NAME);
        const request = store.get(IDENTITY_KEY_ID);

        request.onsuccess = (event) => resolve(event.target.result || null);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Save a network identity record to IndexedDB.
 * @param {IDBDatabase} db
 * @param {Object} identityRecord
 */
export function saveStoredIdentity(db, identityRecord) {
    return new Promise((resolve, reject) => {
        if (!db || !identityRecord) {
            reject(new Error("Invalid DB instance or identity record."));
            return;
        }

        const record = {
            id: IDENTITY_KEY_ID,
            ...identityRecord,
            updatedAt: Date.now()
        };

        const transaction = db.transaction([IDENTITY_STORE_NAME], "readwrite");
        const store = transaction.objectStore(IDENTITY_STORE_NAME);
        const request = store.put(record);

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Key Routine: Generates and stores a permanent cryptographic keypair in IndexedDB
 * to serve as the user's unchangeable network identity ("phone number").
 * If an identity already exists in IndexedDB, it is loaded and returned.
 * @param {IDBDatabase} db
 * @param {Object} algorithm - Web Crypto key generation algorithm (default: ECDSA P-256)
 */
export async function getOrCreateIdentityKeypair(db, algorithm = { name: "ECDSA", namedCurve: "P-256" }) {
    if (!db) {
        throw new Error("IDBDatabase instance required to retrieve or create permanent identity.");
    }

    const subtle = globalThis.crypto?.subtle || (typeof window !== 'undefined' ? window.crypto.subtle : null);
    if (!subtle) {
        throw new Error("Web Crypto API (crypto.subtle) is unavailable.");
    }

    // 1. Check if identity already exists in IndexedDB
    const existing = await getStoredIdentity(db);
    if (existing && existing.pubJwk && existing.privJwk) {
        try {
            const usagesPub = ["verify"];
            const usagesPriv = ["sign"];
            const publicKey = await importKeyFromJwk(existing.pubJwk, algorithm, usagesPub);
            const privateKey = await importKeyFromJwk(existing.privJwk, algorithm, usagesPriv);

            return {
                phone: existing.phone,
                fullPhone: existing.fullPhone,
                fingerprint: existing.fingerprint,
                publicKey: publicKey,
                privateKey: privateKey,
                pubJwk: existing.pubJwk,
                spkiBase64: existing.spkiBase64,
                createdAt: existing.createdAt,
                isNew: false
            };
        } catch (e) {
            console.warn("Failed to reconstruct stored identity keys from IndexedDB JWK, regenerating...", e);
        }
    }

    // 2. Generate brand new asymmetric keypair via crypto.subtle
    const keyPair = await generateIdentityKeypair(algorithm);

    // 3. Export public key (SPKI) & derive deterministic SHA-256 fingerprint + phone number
    const spkiBuffer = await subtle.exportKey("spki", keyPair.publicKey);
    const spkiBase64 = bufferToBase64(spkiBuffer);
    const identityDerived = await derivePhoneNumberFromPublicKey(spkiBuffer);

    // 4. Export keys to JWK for clean native IndexedDB storage
    const pubJwk = await exportKeyToJwk(keyPair.publicKey);
    const privJwk = await exportKeyToJwk(keyPair.privateKey);

    const identityRecord = {
        phone: identityDerived.phone,
        fullPhone: identityDerived.fullPhone,
        fingerprint: identityDerived.fingerprint,
        pubJwk: pubJwk,
        privJwk: privJwk,
        spkiBase64: spkiBase64,
        createdAt: Date.now()
    };

    // 5. Store permanently in IndexedDB
    await saveStoredIdentity(db, identityRecord);

    return {
        ...identityRecord,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        isNew: true
    };
}

/**
 * Remove stored identity from IndexedDB (for reset/testing).
 * @param {IDBDatabase} db
 */
export function clearIdentity(db) {
    return new Promise((resolve, reject) => {
        if (!db) { resolve(false); return; }

        const transaction = db.transaction([IDENTITY_STORE_NAME], "readwrite");
        const store = transaction.objectStore(IDENTITY_STORE_NAME);
        const request = store.delete(IDENTITY_KEY_ID);

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

// --- ENCRYPTED LOCAL CONTACT DIRECTORY (ADDRESS BOOK) ---

/**
 * Encrypts and saves a contact to IndexedDB.
 * @param {IDBDatabase} db
 * @param {Object} contactObj - { phone, label, fingerprint, notes }
 * @param {string} masterSecret - Passphrase for AES-GCM encryption
 */
export async function saveContact(db, contactObj, masterSecret = "ghost-address-book-key") {
    if (!db || !contactObj || !contactObj.phone) {
        throw new Error("Invalid DB instance or missing contact phone number.");
    }

    const envelope = await encryptContact(contactObj, masterSecret);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CONTACTS_STORE_NAME], "readwrite");
        const store = transaction.objectStore(CONTACTS_STORE_NAME);
        const request = store.put(envelope);

        request.onsuccess = () => resolve(envelope);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Retrieves and decrypts a contact from IndexedDB by phone number.
 * @param {IDBDatabase} db
 * @param {string} phone
 * @param {string} masterSecret
 */
export function getContact(db, phone, masterSecret = "ghost-address-book-key") {
    return new Promise((resolve, reject) => {
        if (!db || !phone) { resolve(null); return; }

        const transaction = db.transaction([CONTACTS_STORE_NAME], "readonly");
        const store = transaction.objectStore(CONTACTS_STORE_NAME);
        const request = store.get(phone);

        request.onsuccess = async (event) => {
            const envelope = event.target.result;
            if (!envelope) { resolve(null); return; }
            try {
                const decrypted = await decryptContact(envelope, masterSecret);
                resolve(decrypted);
            } catch (e) {
                reject(e);
            }
        };
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Retrieves and decrypts all contacts from IndexedDB.
 * @param {IDBDatabase} db
 * @param {string} masterSecret
 */
export function getAllContacts(db, masterSecret = "ghost-address-book-key") {
    return new Promise((resolve, reject) => {
        if (!db) { resolve([]); return; }

        const transaction = db.transaction([CONTACTS_STORE_NAME], "readonly");
        const store = transaction.objectStore(CONTACTS_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = async (event) => {
            const envelopes = event.target.result || [];
            const decryptedContacts = [];
            for (const env of envelopes) {
                try {
                    const c = await decryptContact(env, masterSecret);
                    decryptedContacts.push(c);
                } catch (e) {
                    console.warn(`Could not decrypt contact for phone ${env.phone}:`, e.message);
                }
            }
            resolve(decryptedContacts);
        };
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Deletes a contact from IndexedDB by phone number.
 * @param {IDBDatabase} db
 * @param {string} phone
 */
export function deleteContact(db, phone) {
    return new Promise((resolve, reject) => {
        if (!db || !phone) { resolve(false); return; }

        const transaction = db.transaction([CONTACTS_STORE_NAME], "readwrite");
        const store = transaction.objectStore(CONTACTS_STORE_NAME);
        const request = store.delete(phone);

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(request.error || event.target.error);
    });
}

/**
 * Searches local contacts by matching query against label, phone, fingerprint, or notes.
 * @param {IDBDatabase} db
 * @param {string} query
 * @param {string} masterSecret
 */
export async function searchContacts(db, query = "", masterSecret = "ghost-address-book-key") {
    const all = await getAllContacts(db, masterSecret);
    if (!query || !query.trim()) return all;

    const q = query.toLowerCase().trim();
    return all.filter(c =>
        (c.label && c.label.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.fingerprint && c.fingerprint.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
    );
}