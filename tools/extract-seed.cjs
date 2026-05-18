const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const s = fs.readFileSync(path.join(root, "js", "db.js"), "utf8");
const start = s.indexOf("const seedComponents = ");
if (start < 0) throw new Error("seedComponents not found");
const bracket = s.indexOf("[", start);
let depth = 0;
let i = bracket;
for (; i < s.length; i++) {
  const c = s[i];
  if (c === "[") depth++;
  else if (c === "]") {
    depth--;
    if (depth === 0) {
      i++;
      break;
    }
  }
}
const jsonLike = s.slice(bracket, i);
const arr = new Function("return " + jsonLike)();
const out = path.join(root, "database", "components.json");
fs.writeFileSync(out, JSON.stringify(arr));
console.log("Wrote", out, "rows:", arr.length);
