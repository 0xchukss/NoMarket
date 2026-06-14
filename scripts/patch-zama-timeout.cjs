const fs = require("fs");
const path = require("path");

const sdkDist = path.join(__dirname, "..", "node_modules", "@zama-fhe", "sdk", "dist", "esm");
const timeoutMs = "120000";

if (!fs.existsSync(sdkDist)) {
  process.exit(0);
}

for (const file of fs.readdirSync(sdkDist)) {
  if (!file.startsWith("memory-storage-") || !file.endsWith(".js")) continue;
  const fullPath = path.join(sdkDist, file);
  const source = fs.readFileSync(fullPath, "utf8");
  const patched = source.replace("const r=3e4;", `const r=${timeoutMs};`);
  if (patched !== source) {
    fs.writeFileSync(fullPath, patched);
    console.log(`Patched Zama worker timeout in ${file} to ${timeoutMs}ms`);
  }
}
