// Run after `npm run build` to copy static extension files into dist/
import { cpSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "public");
const dst = resolve(__dirname, "dist");

// Copy individual files
const files = ["manifest.json", "background.js", "content.js", "blocked.html"];
mkdirSync(dst, { recursive: true });
for (const file of files) {
  cpSync(resolve(src, file), resolve(dst, file));
  console.log(`✅  Copied ${file} → dist/`);
}

// Copy icons folder
cpSync(resolve(src, "icons"), resolve(dst, "icons"), { recursive: true });
console.log(`✅  Copied icons/ → dist/icons/`);

console.log("\n🎉  Extension files ready in dist/ — load it in chrome://extensions");
