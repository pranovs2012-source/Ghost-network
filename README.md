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

## Signaling (how peers find each other)

The page uses the built-in signaling endpoint `/api/signaling` (`api/signaling.js`, a Vercel function).
It only relays WebRTC setup messages and the phone directory; files and AES-GCM keys never touch it.

**Vercel setup (required for reliable connections):** serverless instances don't share memory, so add a
free Redis store: Vercel dashboard → your project → **Storage** → **Create / Connect** → **Upstash for Redis**
→ connect it to the project, then redeploy. This sets `KV_REST_API_URL` / `KV_REST_API_TOKEN`
(or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`), which the function picks up automatically.
Check `https://<your-site>/api/signaling` — it should report `"storage": "redis"`.

**Optional TURN relay** (for mobile data / strict NAT): set `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL`.

**Local:** `npm run dev` serves the page and `/api/signaling` on http://localhost:3000.
