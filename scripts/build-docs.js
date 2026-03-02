const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const srcDir = path.join(projectRoot, "src");
const docsDir = path.join(projectRoot, "docs");

if (!fs.existsSync(srcDir)) {
  console.error("src directory does not exist.");
  process.exit(1);
}

fs.rmSync(docsDir, { recursive: true, force: true });
fs.cpSync(srcDir, docsDir, { recursive: true });

console.log("docs generated from src.");
