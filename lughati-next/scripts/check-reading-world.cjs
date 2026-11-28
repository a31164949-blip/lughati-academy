const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const page = read("app/reading-world/page.tsx");
const journey = read("app/journey/page.tsx");
for (const [name, source] of [["reading-world", page], ["journey", journey]]) {
  assert.equal(ts.createSourceFile(name + ".tsx", source, ts.ScriptTarget.Latest, true).parseDiagnostics.length, 0, name);
}
const jsx = (tag, props) => ({ tag, props });
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(page, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports: exportsObject, require(name) {
  if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
  if (name === "next/link") return { default: "link" };
  if (name === "next/image") return { default: "image" };
  if (name.endsWith(".module.css")) return { default: {} };
  throw Error("Unexpected dependency in the static reading hub: " + name);
}});
const nodes = [];
function visit(value) {
  if (Array.isArray(value)) return value.forEach(visit);
  if (value && typeof value === "object") { nodes.push(value); visit(value.props.children); }
}
visit(exportsObject.default());
const expected = ["/journey", "/curriculum-reading", "/reading-journey", "/reading-journey/fluency-levels"];
assert.deepEqual(nodes.filter(n => n.tag === "link").map(n => n.props.href), expected);
assert(nodes.filter(n => n.tag === "link").every(n => n.props.prefetch === false));
const image = nodes.find(n => n.tag === "image");
assert.match(image.props.alt, /طفل يقرأ/);
assert.match(read("public" + image.props.src), /^<svg/);
assert.match(journey, /title: "عالم القراءة",[\s\S]*?href: "\/reading-world"/);
assert.equal(journey.match(/href: "\/reading-world"/g)?.length, 1);
const entries = journey.split("const journeyCards = [")[1].split("const dailyTasks")[0];
assert.doesNotMatch(entries, /href: "\/(reading-journey|curriculum-reading)"/);
assert.match(journey, /href="\/reading-journey\/fluency-levels"/);
for (const route of expected) assert(fs.existsSync(path.join(root, "app", route, "page.tsx")));
console.log("READING_WORLD_LINKS_AND_ART=PASS");
