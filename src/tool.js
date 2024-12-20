const emoji = "💾";
const domain = "floppypng.com";
const backup = Deno.env.get("CL_FLP_BACKUP");
const dt = new Date();
const tss = dt.toISOString().replaceAll(":", "").replaceAll("-", "").replaceAll(
  ".",
  "",
);
const site = {};

import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import * as base64 from "byte-base64";
import { fpng } from "fpng"
//const { markedHighlight } = globalThis.markedHighlight;
marked.use(markedHighlight({
  silent: true,
  langPrefix: "hljs language-",
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : "plaintext";
    return hljs.highlight(code, { language }).value;
  },
  mangle: false,
  headerIds: false,
}));
site.home = marked.parse(Deno.readTextFileSync("assets/home.md"));
site.design = marked.parse(Deno.readTextFileSync("assets/design.md"));
site.operations = marked.parse(Deno.readTextFileSync("assets/operations.md"));
site.legal = marked.parse(Deno.readTextFileSync("assets/legal.md"));
site.page = Deno.readTextFileSync("assets/page.html");
site.css = Deno.readTextFileSync("assets/style.css");
Deno.writeTextFileSync('README.md',`# Introduction\n\n${Deno.readTextFileSync('assets/home.md')}\n\n
## Design\n\n${Deno.readTextFileSync('assets/design.md')}\n\n
## Operations\n\n${Deno.readTextFileSync('assets/operations.md')}\n\n
`)


let ver = "";
for await (const j of Deno.readDir("./sigs/")) {
  ver += `# ${j.name}:  \n`;
  for await (const i of Deno.readDir(`./sigs/${j.name}/`)) {
    ver += `[${i.name}](sigs/${j.name}/${i.name})  \n`;
  }
}
function arr_to_hex(u8arr) {
  return `${
    Array.from(u8arr, (i) => i.toString(16).padStart(2, "0")).join("")
  }`;
}
site.verification = marked.parse(ver);
Deno.writeTextFileSync("site.txt", `let site=${JSON.stringify(site)}\n`);
const text = Deno.readTextFileSync("site.txt") +
  Deno.readTextFileSync("dist/app.bundle.js");

const last_hash = Deno.readTextFileSync("data_sha512.txt");
const cur_hash = arr_to_hex(
  new Uint8Array(
    await crypto.subtle.digest("SHA-512", new TextEncoder().encode(text)),
  ),
);
if (last_hash.trim() != cur_hash.trim()) {
  Deno.writeTextFileSync("data_sha512.txt", cur_hash);
  const fp_obj = fpng(` Verify sig at floppypng.com - ${tss}`, text);
  const a32h = arr_to_hex(fp_obj.im.slice(-20, -16));

  console.log(`Generated FloppyPNG Size=${fp_obj.ln}`);

  const priv = Deno.readTextFileSync(Deno.env.get("CL_PRIV")).replace(
    /.*KEY-----(.+?)-----END.*/smg,
    "$1",
  );
  const b_der_str = globalThis.atob(priv);
  const b_der = Uint8Array.from([...b_der_str].map((c) =>
    c.charCodeAt()
  )).buffer;
  const prv = await globalThis.crypto.subtle.importKey(
    "pkcs8",
    b_der,
    {
      name: "RSA-PSS",
      hash: "SHA-256",
    },
    true,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    {
      name: "RSA-PSS",
      hash: "SHA-256",
      saltLength: 32,
    },
    prv,
    fp_obj.im,
  );
  const u8sig = new Uint8Array(sig);
  const page = Deno.readTextFileSync("assets/pageops.html");
  const page_local = Deno.readTextFileSync("assets/pageops.local.html");
  Deno.writeFileSync(`${tss}-${a32h}.png`, fp_obj.im);
  Deno.writeTextFileSync(`${tss}-${a32h}.txt`, base64.bytesToBase64(u8sig));
  Deno.writeFileSync(`${backup}${tss}-${a32h}.png`, fp_obj.im);
  for await (const i of Deno.readDir("./")) {
    if (
      i.name != `${tss}-${a32h}.png` &&
      i.name.match(/^\d{8}T\d{9}Z\-\w{8}.png$/)
    ) {
      console.log(`removing ${i.name}`);
      Deno.remove(i.name);
    }
    if (
      i.name != `${tss}-${a32h}.txt` &&
      i.name.match(/^\d{8}T\d{9}Z\-\w{8}.txt$/)
    ) {
      console.log(`removing ${i.name}`);
      Deno.remove(i.name);
    }
  }
  Deno.writeTextFileSync(
    `${domain}.page.html`,
    page
      .replaceAll("thisisimage", `${tss}-${a32h}`)
      .replaceAll("thisisemoji", emoji)
      .replaceAll("thisislength", fp_obj.ln)
  );
  Deno.writeTextFileSync(
    `${domain}.page.local.html`,
    page_local
      .replaceAll("thisisimage", `${tss}-${a32h}`)
      .replaceAll("thisisemoji", emoji)
      .replaceAll("thisislength", fp_obj.ln),
  );
}
function web_deal(req) {
  if (req.method == "GET") {
    const u = new URL(req.url);
    const page = u.pathname == "/"
      ? `floppypng.com.page.local.html`
      : u.pathname.replace("/", "");
    let npg;
    let response;
    try {
      console.log(page);
      npg = Deno.readFileSync(page);
      const type = page.split(".").slice(-1);
      response = new Response(npg, {
        status: 200,
        headers: {
          "content-type": types[type],
        },
      });
    } catch {
      console.log("error 404");
      response = new Response(npg, {
        status: 404,
        headers: {
          "content-type": "text/plain;charset=utf-8",
        },
      });
    }
    return response;
  }
}
const types = {
  "js": "text/javascript;charset=utf-8",
  "css": "text/css",
  "svg": "image/svg+xml",
  "html": "text/html",
  "map": "application/json",
  "json": "application/json",
  "xz": "application/gzip",
  "png": "image/png",
  "zst": "application/zstd",
  "txt": "text/plain",
  "jpg": "image/jpg",
  "gif": "image/gif",
  "WebM": "video/webm",
  "mp4": "video/mp4",
  "mpg": "video/mp4",
  "webm": "video/webm",
  "ico": "image/x-icon",
};
Deno.serve({
  port: 3052,
  hostname: "0.0.0.0",
  handler: (req) => web_deal(req),
});
