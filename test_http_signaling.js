// test_http_signaling.js - Built-in HTTP signaling (api/signaling.js) routing & auth test
const http = require('http');
const handler = require('./api/signaling');

async function runTests() {
    console.log("=================================================");
    console.log("⚡ TEST: BUILT-IN HTTP SIGNALING (/api/signaling)");
    console.log("=================================================\n");

    const server = http.createServer(handler);
    await new Promise(r => server.listen(0, r));
    const base = `http://127.0.0.1:${server.address().port}/api/signaling`;
    const call = async (action, { method = 'GET', params = {}, body } = {}) => {
        const qs = new URLSearchParams({ action, ...params });
        const res = await fetch(`${base}?${qs}`, {
            method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body)
        });
        return { status: res.status, data: await res.json() };
    };

    try {
        const a = (await call('init', { method: 'POST', body: { phone: '111111' } })).data;
        const b = (await call('init', { method: 'POST', body: { phone: '222222' } })).data;
        if (a.type !== 'INIT' || !a.token || a.yourPhone !== '111111') throw new Error('Bad INIT packet');
        if (!b.phoneBook.some(e => e.phone === '111111' && e.id === a.yourId)) throw new Error('Phone book missing peer A');
        console.log("   ✅ init issues ids, tokens and a shared phone book");

        const bad = await call('poll', { params: { id: a.yourId, token: 'wrong' } });
        if (bad.status !== 401) throw new Error('Bad token was accepted');
        console.log("   ✅ wrong session token rejected (401)");

        // A dials B by phone number; sender field is forced to the authenticated id
        const sent = await call('send', { method: 'POST', body: { id: a.yourId, token: a.token,
            packets: [{ type: 'SEARCH_PHONE', targetPhone: '222222', sender: 'spoofed', callerPhone: '111111' }] } });
        if (!sent.data.messages.some(m => m.type === 'ROUTED' && m.routedTo === b.yourId)) throw new Error('SEARCH_PHONE not routed');
        const polled = await call('poll', { params: { id: b.yourId, token: b.token } });
        const got = polled.data.messages.find(m => m.type === 'SEARCH_PHONE');
        if (!got || got.sender !== a.yourId) throw new Error('B did not receive the dial with authenticated sender');
        console.log("   ✅ phone dial routed to the right peer with a non-spoofable sender");

        // Targeted SDP relay B -> A
        await call('send', { method: 'POST', body: { id: b.yourId, token: b.token, packets: [{ target: a.yourId, sdp: { type: 'offer', sdp: 'x' } }] } });
        const aPoll = await call('poll', { params: { id: a.yourId, token: a.token, book: '1' } });
        if (!aPoll.data.messages.some(m => m.sdp && m.sender === b.yourId)) throw new Error('SDP not relayed');
        if (!Array.isArray(aPoll.data.phoneBook)) throw new Error('Phone book not returned on book=1');
        console.log("   ✅ targeted SDP relayed; phone book refresh works");

        const unknown = await call('send', { method: 'POST', body: { id: a.yourId, token: a.token, packets: [{ type: 'SEARCH_PHONE', targetPhone: '999999' }] } });
        if (!unknown.data.messages.some(m => m.reason === 'UNREACHABLE')) throw new Error('Unknown number not reported');
        console.log("   ✅ unknown number reported UNREACHABLE");

        await call('leave', { method: 'POST', body: { id: b.yourId, token: b.token } });
        if ((await call('poll', { params: { id: b.yourId, token: b.token } })).status !== 401) throw new Error('Session survived leave');
        console.log("   ✅ leave ends the session");

        const ice = (await call('ice')).data;
        if (!Array.isArray(ice.iceServers) || !ice.iceServers.length) throw new Error('No ICE servers');
        console.log("   ✅ ICE server list served");

        console.log("\n🎉 ALL HTTP SIGNALING TESTS PASSED!");
    } finally {
        server.close();
    }
}

runTests().catch(err => {
    console.error("❌ HTTP SIGNALING TEST FAILED:", err);
    process.exit(1);
});
