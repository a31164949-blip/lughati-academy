#!/usr/bin/env node
// Fail closed: do not deploy a Next.js application as an unadapted Worker.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const pkg = require(path.join(root, "package.json"));
const lock = require(path.join(root, "package-lock.json"));
const required = ["@opennextjs/cloudflare", "wrangler"];
const errors = [];
for (const name of required) {
  if (!(pkg.dependencies?.[name] || pkg.devDependencies?.[name])) errors.push(name + " missing from package.json");
  if (!lock.packages?.["node_modules/" + name]) errors.push(name + " missing from package-lock.json");
}
for (const file of ["wrangler.jsonc", "open-next.config.ts"]) {
  if (!fs.existsSync(path.join(root, file))) errors.push(file + " missing");
}
if (pkg.scripts?.build?.includes("deploy-temporary-access-rules")) {
  errors.push("build script mutates live Firebase rules");
}
if (errors.length) {
  console.error("Cloudflare preflight blocked:\n- " + errors.join("\n- "));
  process.exitCode = 1;
} else {
  console.log("Static Cloudflare preflight passed. Runtime, secrets, Firebase Admin and deployment still require testing.");
}
