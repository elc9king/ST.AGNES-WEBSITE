/* Temporary validation script — checks structure, links, ids, CSS balance */
const fs = require("fs");
const path = require("path");

const root = __dirname;
const pages = fs.readdirSync(root).filter((f) => f.endsWith(".html"));

let issues = 0;

function fail(page, msg) {
    issues++;
    console.log(`  [FAIL] ${page}: ${msg}`);
}

function ok(page, msg) {
    console.log(`  [ OK ] ${page}: ${msg}`);
}

const files = new Set(fs.readdirSync(root));

for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), "utf8");

    if (!/^<!DOCTYPE html>/i.test(html)) fail(page, "missing doctype");
    if (!/<html lang="en">/.test(html)) fail(page, "missing lang on html");
    if (!/<meta name="viewport"/.test(html)) fail(page, "missing viewport");

    /* stray </script> right after </head> */
    if (/<\/head>\s*<\/script>/.test(html)) fail(page, "stray </script> after </head>");

    /* nested anchors */
    if (/<a\b[^>]*>\s*<a\b/.test(html)) fail(page, "nested <a> elements");

    /* required landmarks */
    if ((html.match(/<main\b/g) || []).length !== 1) fail(page, "main count != 1");
    if (!/<main id="main-content">/.test(html)) fail(page, "main missing id");
    if (!/class="skip-link"/.test(html)) fail(page, "missing skip link");
    if ((html.match(/id="mainNav"/g) || []).length !== 1) fail(page, "mainNav id missing/duplicated");
    if ((html.match(/id="themeToggle"/g) || []).length !== 1) fail(page, "themeToggle id missing/duplicated");
    if ((html.match(/id="mobileMenuToggle"/g) || []).length !== 1) fail(page, "mobileMenuToggle id missing/duplicated");
    if ((html.match(/<script src="script.js">/g) || []).length !== 1) fail(page, "script.js tag missing/duplicated");

    /* footer legal links on every page */
    if (!/class="footer-nav"/.test(html)) fail(page, "missing footer-nav");
    if (!/href="privacy\.html"/.test(html)) fail(page, "missing privacy link");
    if (!/href="terms\.html"/.test(html)) fail(page, "missing terms link");

    /* duplicate ids */
    const idMatches = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const dupes = idMatches.filter((id, i) => idMatches.indexOf(id) !== i);
    if (dupes.length) fail(page, `duplicate ids: ${[...new Set(dupes)].join(", ")}`);

    /* every local .html/.css/.js href/src must exist */
    const refs = [...html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)]
        .map((m) => m[1])
        .filter((u) => !/^(https?:|tel:|mailto:|#|data:)/.test(u))
        .map((u) => u.split("#")[0].split("?")[0]);
    const missing = refs.filter((u) => !files.has(u) && u !== "images/hero.jpg"); /* hero.jpg is an intentional placeholder with onerror fallback */
    if (missing.length) fail(page, `broken local refs: ${[...new Set(missing)].join(", ")}`);

    /* images must have alt */
    const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    imgs.forEach((tag) => {
        if (!/\salt="/.test(tag)) fail(page, "img without alt attribute");
    });

    /* tag balance for key elements */
    for (const tag of ["div", "section", "nav", "header", "footer", "main", "ul", "li", "p"]) {
        const open = (html.match(new RegExp(`<${tag}\\b`, "g")) || []).length;
        const close = (html.match(new RegExp(`</${tag}>`, "g")) || []).length;
        if (open !== close) fail(page, `<${tag}> unbalanced: ${open} open vs ${close} close`);
    }

    ok(page, "structural checks complete");
}

/* CSS brace balance */
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const open = (css.match(/{/g) || []).length;
const close = (css.match(/}/g) || []).length;
if (open !== close) fail("style.css", `braces unbalanced: ${open} open vs ${close} close`);
else ok("style.css", `braces balanced (${open})`);

/* JS syntax check */
try {
    new Function(fs.readFileSync(path.join(root, "script.js"), "utf8"));
    ok("script.js", "parses without syntax errors");
} catch (e) {
    fail("script.js", e.message);
}

/* content guardrails */
for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), "utf8").toLowerCase();
    const banned = ["testimonial", "100% pass", "guaranteed results", "best school in", "number one school", "most trusted"];
    banned.forEach((b) => {
        if (html.includes(b)) fail(page, `forbidden claim found: "${b}"`);
    });
}

console.log("");
console.log(issues === 0 ? "ALL CHECKS PASSED" : `${issues} ISSUE(S) FOUND`);
process.exit(issues === 0 ? 0 : 1);
