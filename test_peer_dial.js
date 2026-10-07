// test_peer_dial.js - Automated Test for Peer Dialing & Direct Connection (No Barriers)
const http = require('http');
const { spawn } = require('child_process');
const { WebSocket } = require('ws');
const { generateIdentityKeypair, derivePhoneNumberFromPublicKey, generateNonce, signChallenge, verifyChallenge } = require('./crypto-engine');

const TEST_PORT = 8899;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log("=================================================");
    console.log("⚡ TEST: PEER DIALING & DIRECT P2P CONNECTION");
    console.log("=================================================\n");

    console.log(`1. Spawning signaling-server.js on test port ${TEST_PORT}...`);
    const serverProc = spawn('node', ['signaling-server.js'], {
        env: { ...process.env, PORT: TEST_PORT.toString() },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    await sleep(1500);

    try {
        console.log("\n2. Generating cryptographic identity keypairs for Peer A and Peer B...");
        const keypairA = await generateIdentityKeypair();
        const keypairB = await generateIdentityKeypair();

        const spkiA = await globalThis.crypto.subtle.exportKey("spki", keypairA.publicKey);
        const jwkA = await globalThis.crypto.subtle.exportKey("jwk", keypairA.publicKey);
        const derivedA = await derivePhoneNumberFromPublicKey(spkiA);
        const idA = { ...keypairA, pubJwk: jwkA, ...derivedA };

        const spkiB = await globalThis.crypto.subtle.exportKey("spki", keypairB.publicKey);
        const jwkB = await globalThis.crypto.subtle.exportKey("jwk", keypairB.publicKey);
        const derivedB = await derivePhoneNumberFromPublicKey(spkiB);
        const idB = { ...keypairB, pubJwk: jwkB, ...derivedB };

        const phoneA = idA.phone;
        const phoneB = idB.phone;

        console.log(`   Peer A Phone: ${phoneA} | Fingerprint: ${idA.fingerprint.substring(0, 16)}...`);
        console.log(`   Peer B Phone: ${phoneB} | Fingerprint: ${idB.fingerprint.substring(0, 16)}...`);

        console.log("\n3. Connecting Peer A & Peer B WebSockets to signaling server...");
        const wsA = new WebSocket(`ws://localhost:${TEST_PORT}`);
        const wsB = new WebSocket(`ws://localhost:${TEST_PORT}`);

        let peerA_ID = null;
        let peerB_ID = null;

        await Promise.all([
            new Promise(resolve => {
                wsA.on('message', raw => {
                    const packet = JSON.parse(raw);
                    if (packet.type === 'INIT') {
                        peerA_ID = packet.yourId;
                        wsA.send(JSON.stringify({ type: 'REGISTER_PHONE', phone: phoneA, sender: peerA_ID }));
                        resolve();
                    }
                });
            }),
            new Promise(resolve => {
                wsB.on('message', raw => {
                    const packet = JSON.parse(raw);
                    if (packet.type === 'INIT') {
                        peerB_ID = packet.yourId;
                        wsB.send(JSON.stringify({ type: 'REGISTER_PHONE', phone: phoneB, sender: peerB_ID }));
                        resolve();
                    }
                });
            })
        ]);

        console.log(`   Peer A Client ID: [${peerA_ID}]`);
        console.log(`   Peer B Client ID: [${peerB_ID}]`);

        console.log("\n4. Simulating Peer A dialing Peer B by phone number...");
        // Peer A sends CALL_REQUEST to Peer B
        let callRequestReceived = false;
        let callAcceptReceived = false;

        const callPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Call negotiation timed out')), 5000);

            // Peer B receives CALL_REQUEST & auto-accepts
            wsB.on('message', raw => {
                const packet = JSON.parse(raw);
                if (packet.type === 'CALL_REQUEST' && packet.sender === peerA_ID) {
                    callRequestReceived = true;
                    console.log(`   Peer B received direct CALL_REQUEST from Peer A [${peerA_ID}]. Auto-accepting...`);
                    // Peer B sends CALL_ACCEPT
                    wsB.send(JSON.stringify({
                        type: 'CALL_ACCEPT',
                        target: peerA_ID,
                        sender: peerB_ID,
                        phone: phoneB
                    }));
                }
            });

            // Peer A receives CALL_ACCEPT
            wsA.on('message', raw => {
                const packet = JSON.parse(raw);
                if (packet.type === 'CALL_ACCEPT' && packet.sender === peerB_ID) {
                    callAcceptReceived = true;
                    console.log(`   Peer A received CALL_ACCEPT from Peer B [${peerB_ID}]. Negotiation successful!`);
                    clearTimeout(timeout);
                    resolve();
                }
            });

            // Peer A initiates dial
            wsA.send(JSON.stringify({
                type: 'CALL_REQUEST',
                target: peerB_ID,
                sender: peerA_ID,
                callerPhone: phoneA
            }));
        });

        await callPromise;

        if (!callRequestReceived || !callAcceptReceived) {
            throw new Error("Call negotiation failed between Peer A and Peer B!");
        }
        console.log("   ✅ Peer dial signal exchange PASSED!");

        console.log("\n5. Testing Cryptographic Handshake Signature Verification...");
        const nonceA = generateNonce();
        const sigB = await signChallenge(nonceA, idB.privateKey);
        const validB = await verifyChallenge(nonceA, sigB, idB.pubJwk);

        if (!validB) throw new Error("Peer B signature verification failed!");
        console.log("   ✅ Peer B cryptographic signature verified by Peer A.");

        const nonceB = generateNonce();
        const sigA = await signChallenge(nonceB, idA.privateKey);
        const validA = await verifyChallenge(nonceB, sigA, idA.pubJwk);

        if (!validA) throw new Error("Peer A signature verification failed!");
        console.log("   ✅ Peer A cryptographic signature verified by Peer B.");

        wsA.close();
        wsB.close();

        console.log("\n=================================================");
        console.log("🎉 ALL PEER DIALING & CONNECTION TESTS PASSED!");
        console.log("=================================================");
    } finally {
        serverProc.kill();
    }
}

runTest().catch(err => {
    console.error("\n❌ TEST FAILED:", err.message);
    process.exit(1);
});
