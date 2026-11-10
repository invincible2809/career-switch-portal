// Copies the SQLite WebAssembly file into public/ so the SQL sandbox loads it from the
// portal itself (no third-party CDN). Runs on install.
import fs from "node:fs";
import path from "node:path";

const src = path.join("node_modules", "sql.js", "dist", "sql-wasm-browser.wasm");
const destDir = path.join("public", "sql");
if (!fs.existsSync(src)) {
  console.warn("sql.js not installed yet – skipping wasm copy");
  process.exit(0);
}
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, path.join(destDir, "sql-wasm-browser.wasm"));
