# Ghost-network

Cryptographic P2P mesh: WebRTC DataChannels, ECDSA P-256 identities, and encrypted shard storage.

## Encrypted file transfer

Files sent with **Stream File to Mesh RAM** never travel in plaintext:

- When two peers connect they run a signed handshake. Each side signs a nonce together with a fresh
  ephemeral ECDH P-256 public key, so a man-in-the-middle cannot substitute keys.
- Both sides derive a per-connection **AES-256-GCM** key via ECDH + HKDF-SHA-256. It is never transmitted.
- File name, header and every 32 KB chunk are sent as `SECURE_FRAME` envelopes (`{ iv, data }`) with a
  fresh random 96-bit IV, so the wire carries only random-looking noise.
- GCM authentication rejects any tampered frame, and plaintext file packets are refused.

Run `node test_secure_transfer.js` to verify the tunnel (round trip, tamper and MITM checks).
