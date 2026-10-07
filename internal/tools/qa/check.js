// Template QA harness.
// Usage: node check.js <template-folder> [--shots]
// - html-validate on index.html + preview.html
// - Chromium at 375px and 1440px: console errors, page errors, failed requests,
//   horizontal overflow on every reachable screen
// - Screen navigation: BFS over [data-goto] buttons; every target screen must become active
// - axe-core accessibility audit on every screen (serious/critical = fail)
// - Screenshots of every screen at both widths into <scratch>/shots/<folder-name>/
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('/opt/node-tools/node_modules/playwright');

const dir = path.resolve(process.argv[2]);
const takeShots = process.argv.includes('--shots');
const name = path.basename(dir);
const shotDir = path.join(process.env.SHOTS_DIR || path.join(require('os').tmpdir(), 'template-shots'), name);
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const problems = [];
const notes = [];

function validateHtml() {
    for (const f of ['index.html', 'preview.html']) {
        const p = path.join(dir, f);
        if (!fs.existsSync(p)) { problems.push(`missing ${f}`); continue; }
        try {
            execFileSync(path.join(__dirname, 'node_modules/.bin/html-validate'),
                ['--config', path.join(__dirname, 'htmlvalidate.json'), p], { stdio: 'pipe' });
        } catch (e) {
            problems.push(`html-validate ${f}:\n${(e.stdout || '').toString().trim()}`);
        }
    }
    for (const f of ['style.css', 'script.js', 'README.md', 'LICENSE.txt']) {
        if (!fs.existsSync(path.join(dir, f))) problems.push(`missing ${f}`);
    }
    const css = fs.existsSync(path.join(dir, 'style.css')) ? fs.readFileSync(path.join(dir, 'style.css'), 'utf8') : '';
    if (!/^[\s\S]{0,1500}:root\s*{/.test(css)) problems.push('style.css: :root variables not near the top');
    const all = ['index.html', 'style.css', 'script.js'].map(f => { try { return fs.readFileSync(path.join(dir, f), 'utf8'); } catch (e) { return ''; } }).join('\n');
    const ext = all.match(/(?:src|href)=["'](https?:[^"']+)["']|url\(\s*["']?(https?:[^)"']+)/g) || [];
    ext.filter(u => !/fonts\.(googleapis|gstatic)\.com/.test(u)).forEach(u => problems.push(`external asset not allowed: ${u}`));
    if (/\.(png|jpe?g|gif|webp)["')]/i.test(all)) problems.push('raster image reference found');
}

async function activeScreenId(page) {
    return page.evaluate(() => {
        const s = document.querySelector('[data-screen].is-active');
        return s ? s.id : null;
    });
}

async function auditPage(page, label, width) {
    const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        return de.scrollWidth > de.clientWidth + 1 ? `${de.scrollWidth}>${de.clientWidth}` : null;
    });
    if (overflow) problems.push(`[${width}px] horizontal overflow on ${label}: ${overflow}`);
    if (takeShots) {
        fs.mkdirSync(shotDir, { recursive: true });
        await page.screenshot({ path: path.join(shotDir, `${width}-${label}.png`), fullPage: false });
    }
    if (width === 1440) {
        await page.addScriptTag({ content: axeSrc });
        const res = await page.evaluate(async () => {
            const r = await window.axe.run(document, { resultTypes: ['violations'] });
            return r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length,
                targets: v.nodes.slice(0, 3).map(n => n.target.join(' ') + (n.failureSummary ? ' :: ' + n.failureSummary.split('\n').slice(1, 2).join('') : '')) }));
        });
        res.forEach(v => {
            const msg = `[axe ${v.impact}] ${label}: ${v.id} (${v.help}) x${v.n}\n      ${v.targets.join('\n      ')}`;
            if (v.impact === 'serious' || v.impact === 'critical') problems.push(msg); else notes.push(msg);
        });
    }
}

async function run(width) {
    const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
    const page = await browser.newPage({ viewport: { width, height: width < 800 ? 812 : 900 } });
    page.on('console', m => { if (m.type() === 'error') problems.push(`[${width}px] console error: ${m.text()}`); });
    page.on('pageerror', e => problems.push(`[${width}px] page error: ${e.message}`));
    page.on('requestfailed', r => notes.push(`[${width}px] request failed: ${r.url()}`));
    const url = BASE + '/index.html';

    const load = async () => { await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(900); };
    await load();
    const start = await activeScreenId(page);
    if (!start) {
        problems.push(`[${width}px] no [data-screen].is-active on load`);
        await auditPage(page, 'main', width);
        await browser.close();
        return;
    }

    // BFS over screens; replay click paths from a fresh load each time
    const seen = new Map([[start, []]]);
    const queue = [start];
    const edges = [];
    while (queue.length) {
        const sid = queue.shift();
        const route = seen.get(sid);
        await load();
        for (const step of route) { await page.click(step); await page.waitForTimeout(750); }
        await auditPage(page, sid, width);
        const targets = await page.$$eval(`#${sid} [data-goto]`, els => els.map(e => e.getAttribute('data-goto')));
        for (const [i, target] of targets.entries()) {
            const sel = `#${sid} [data-goto="${target}"] >> nth=0`;
            edges.push(`${sid}->${target}`);
            if (!(await page.$(`#${target}`))) { problems.push(`button in #${sid} points to missing #${target}`); continue; }
            if (seen.has(target)) continue;
            await load();
            for (const step of route) { await page.click(step); await page.waitForTimeout(750); }
            await page.click(sel);
            await page.waitForTimeout(750);
            const now = await activeScreenId(page);
            const hidden = await page.$eval(`#${target}`, el => el.hidden || getComputedStyle(el).display === 'none');
            if (now !== target || hidden) problems.push(`[${width}px] clicking ${target} from #${sid} did not show it (active=${now})`);
            else { seen.set(target, [...route, sel]); queue.push(target); }
        }
    }
    const allScreens = await page.$$eval('[data-screen]', els => els.map(e => e.id));
    // Screens reached by form submits etc. must at least open via URL hash (#id)
    for (const s of allScreens.filter(s => !seen.has(s))) {
        await page.goto(url + '#' + s, { waitUntil: 'load' }); await page.waitForTimeout(900);
        if ((await activeScreenId(page)) !== s) { problems.push(`[${width}px] screen #${s} unreachable (buttons or #hash)`); continue; }
        notes.push(`[${width}px] #${s} reached via hash only`);
        await auditPage(page, s, width);
    }
    if (width === 1440) notes.push(`screens: ${[...seen.keys()].join(', ')}`);

    // Keyboard: Tab should land on something with a visible focus indicator
    await load();
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return 'nothing focused';
        const cs = getComputedStyle(el);
        const visible = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
        return visible ? null : `no visible focus style on ${el.tagName}.${el.className}`;
    });
    if (focus) problems.push(`[${width}px] keyboard: ${focus}`);

    // Login templates: functional form flows (shared conventions across the login line)
    if (path.basename(path.dirname(dir)) === 'login') {
        await load();
        await page.click('#login-form [type="submit"]');
        await page.waitForTimeout(400);
        const invalid = await page.$$eval('#login-form [aria-invalid="true"]', els => els.length);
        if (invalid < 2) problems.push(`[${width}px] login: empty submit flagged ${invalid} fields (expected 2)`);
        const errVisible = await page.$$eval('#login-form [aria-invalid="true"]', els => els.every(el => {
            const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/);
            return ids.some(id => { const e = document.getElementById(id); return e && e.textContent.trim() && e.offsetParent !== null; });
        }));
        if (!errVisible) problems.push(`[${width}px] login: error messages not visible/linked via aria-describedby`);
        await page.fill('#login-form input[type="email"]', 'alex@example.com');
        await page.fill('#login-form input[type="password"]', 'CorrectHorse9!');
        await page.click('#login-form [type="submit"]');
        await page.waitForTimeout(2000);
        const toastText = await page.$eval('.toast', el => el.textContent.trim()).catch(() => '');
        if (!toastText) problems.push(`[${width}px] login: no success feedback after valid submit`);
        await page.goto(url + '#forgot'); await page.waitForTimeout(600);
        await page.fill('#forgot-form input[type="email"]', 'alex@example.com');
        await page.click('#forgot-form [type="submit"]');
        await page.waitForTimeout(2000);
        if ((await activeScreenId(page)) !== 'sent') problems.push(`[${width}px] forgot: valid submit did not reach #sent`);
        await page.goto(url + '#signup'); await page.waitForTimeout(600);
        await page.click('#signup-form [type="submit"]');
        await page.waitForTimeout(400);
        const sInvalid = await page.$$eval('#signup-form [aria-invalid="true"]', els => els.length);
        if (sInvalid < 3) problems.push(`[${width}px] signup: empty submit flagged only ${sInvalid} fields`);
    }

    // preview.html must load cleanly too
    const p2 = await browser.newPage({ viewport: { width, height: 900 } });
    p2.on('pageerror', e => problems.push(`[${width}px] preview page error: ${e.message}`));
    p2.on('console', m => { if (m.type() === 'error') problems.push(`[${width}px] preview console error: ${m.text()}`); });
    await p2.goto(BASE + '/preview.html', { waitUntil: 'load' });
    await p2.waitForTimeout(800);
    const ov = await p2.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (ov) problems.push(`[${width}px] preview.html horizontal overflow`);
    if (takeShots) await p2.screenshot({ path: path.join(shotDir, `${width}-zz-preview.png`) });
    await browser.close();
}

let BASE = '';
(async () => {
    const http = require('http');
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
    const srv = http.createServer((req, res) => {
        if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }
        const f = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
        if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
        fs.createReadStream(f).pipe(res);
    });
    await new Promise(r => srv.listen(0, '127.0.0.1', r));
    BASE = 'http://127.0.0.1:' + srv.address().port;
    validateHtml();
    await run(375);
    await run(1440);
    srv.close();
    notes.filter(n => !/fonts\.(googleapis|gstatic)/.test(n)).forEach(n => console.log('note: ' + n));
    if (problems.length) {
        console.log(`\n✗ ${name}: ${problems.length} problem(s)`);
        [...new Set(problems)].forEach(p => console.log(' - ' + p));
        process.exit(1);
    }
    console.log(`\n✓ ${name}: all checks passed`);
})().catch(e => { console.error(e); process.exit(2); });
