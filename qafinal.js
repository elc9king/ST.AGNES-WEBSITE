/* Temporary QA — FINAL pass across all pages: status, console, overflow, dark headings, a11y basics */
const { spawn } = require("child_process");
const http = require("http");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9900 + Math.floor(Math.random() * 80);
const BASE = "http://localhost:3000";
const PAGES = ["/", "/about.html", "/academics.html", "/life.html", "/rules.html", "/visit.html", "/privacy.html", "/terms.html"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJSON(p) {
    return new Promise((res, rej) => {
        http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
            let d = "";
            r.on("data", (c) => (d += c));
            r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
        }).on("error", rej);
    });
}

async function main() {
    const chrome = spawn(CHROME, [
        "--headless=new", "--disable-gpu", "--no-sandbox",
        `--remote-debugging-port=${PORT}`,
        "--user-data-dir=" + require("os").tmpdir() + "\\qafinal-" + Date.now(),
        "about:blank",
    ], { stdio: "ignore" });

    let t = null;
    for (let i = 0; i < 25; i++) { await sleep(400); try { t = await getJSON("/json/list"); break; } catch { } }
    const page = t.find((x) => x.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r, { once: true }));

    let id = 0;
    const pend = new Map();
    const listeners = { console: [], errors: [], failed: [], responses: [] };
    ws.addEventListener("message", (e) => {
        const m = JSON.parse(e.data);
        if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); return; }
        if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") listeners.console.push(m.params.args.map((a) => a.value || a.description || "").join(" "));
        if (m.method === "Runtime.exceptionThrown") listeners.errors.push(m.params.exceptionDetails.text || "exception");
        if (m.method === "Network.loadingFailed" && !m.params.canceled) listeners.failed.push(m.params.type + " err=" + m.params.errorText);
        if (m.method === "Network.responseReceived" && m.params.type === "Document") listeners.responses.push({ url: m.params.response.url, status: m.params.response.status });
    });
    const send = (m, p = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
    const evalJS = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result.value;

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");

    let fail = 0;
    const check = (name, ok, extra) => {
        if (!ok) fail++;
        console.log(`  [${ok ? "OK" : "FAIL"}] ${name}${extra ? " — " + extra : ""}`);
    };

    for (const p of PAGES) {
        console.log("\n== " + BASE + p + " ==");
        listeners.console.length = listeners.errors.length = listeners.failed.length = listeners.responses.length = 0;

        // ---- mobile 390 ----
        await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        await send("Page.navigate", { url: BASE + p });
        await sleep(2600);
        const wantUrl = BASE + p;
        const doc = listeners.responses.find((r) => r.url === wantUrl || r.url === wantUrl.replace(/\.html$/, "/") || (p === "/" && (r.url === BASE + "/" || r.url === BASE)));
        check("HTTP 200", !!doc && doc.status === 200, doc ? "status=" + doc.status : "no document response");
        const m390 = await evalJS(`(() => ({
            scrollW: document.documentElement.scrollWidth,
            clientW: document.documentElement.clientWidth,
            skip: !!document.querySelector(".skip-link") && !!document.getElementById("main-content"),
            nav: !!document.getElementById("mainNav"),
            current: document.querySelector("[aria-current=page]") ? document.querySelector("[aria-current=page]").textContent.trim() : null,
            toggle: (() => { const el = document.getElementById("mobileMenuToggle"); if (!el) return "MISSING"; const r = el.getBoundingClientRect(); return (getComputedStyle(el).display !== "none" && r.left >= 0 && r.right <= innerWidth) ? "visible" : getComputedStyle(el).display; })()
        }))()`);
        check("no h-overflow @390", m390.scrollW <= m390.clientW + 2, `scroll=${m390.scrollW} client=${m390.clientW}`);
        check("skip link + #main-content", m390.skip);
        check("#mainNav + aria-current", m390.nav && !!m390.current, "current=" + m390.current);
        check("hamburger visible @390", m390.toggle === "visible", "state=" + m390.toggle);

        // ---- desktop 1440 + dark heading probe ----
        await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
        await sleep(400);
        const m1440 = await evalJS(`({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth })`);
        check("no h-overflow @1440", m1440.scrollW <= m1440.clientW + 2, `scroll=${m1440.scrollW} client=${m1440.clientW}`);

        // ensure full load (stylesheets/scripts) before interaction tests
        for (let i = 0; i < 20; i++) {
            const rs = await evalJS(`document.readyState`);
            if (rs === "complete") break;
            await sleep(300);
        }
        await sleep(500);

        const themeBefore = await evalJS(`document.documentElement.getAttribute("data-theme")`);
        const clickInfo = await evalJS(`(() => { const b = document.getElementById("themeToggle"); if (!b) return { btn: false }; b.click(); return { btn: true }; })()`);
        let dark = null;
        for (let i = 0; i < 8; i++) {
            await sleep(300);
            dark = await evalJS(`(() => {
                const bad = [];
                document.querySelectorAll("h1, h2, h3, h4").forEach((el) => {
                    const c = getComputedStyle(el).color;
                    const m = c.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
                    if (m && Number(m[1]) < 200) bad.push(el.tagName + " '" + el.textContent.trim().slice(0, 24) + "' " + c);
                });
                return { theme: document.documentElement.getAttribute("data-theme"), bad: bad, total: document.querySelectorAll("h1,h2,h3,h4").length };
            })()`);
            if (dark.theme === "dark") break;
            if (i === 2 && clickInfo && clickInfo.btn) await evalJS(`document.getElementById("themeToggle").click(); true`);
        }
        if (!clickInfo || !clickInfo.btn) console.log("  [diag] themeToggle button missing");
        check("theme toggles to dark", dark.theme === "dark", "theme=" + dark.theme);
        check("all h1-h4 light in dark mode", dark.bad.length === 0, dark.bad.length ? dark.bad.join(" | ") : "checked=" + dark.total);
        await evalJS(`document.getElementById("themeToggle").click(); true`);
        await sleep(600);
        const themeBack = await evalJS(`document.documentElement.getAttribute("data-theme")`);
        check("theme restored to light", themeBack === themeBefore, `now=${themeBack} before=${themeBefore}`);

        check("no console errors", listeners.console.length === 0, listeners.console.join(" ; ").slice(0, 200));
        check("no page exceptions", listeners.errors.length === 0, listeners.errors.join(" ; ").slice(0, 200));
        check("no failed requests", listeners.failed.length === 0, listeners.failed.slice(0, 5).join(" ; "));
    }

    console.log("\n" + (fail === 0 ? "FINAL PASS: ALL CHECKS PASSED" : "FINAL PASS: " + fail + " FAILURES"));
    ws.close();
    chrome.kill();
    process.exit(fail === 0 ? 0 : 1);
}

main();