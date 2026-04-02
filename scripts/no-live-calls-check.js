const fs = require("fs");
const path = require("path");

const banned = ["http://localhost", "https://", "fetch("];

function scan(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {
      scan(full);
    } else {
      const content = fs.readFileSync(full, "utf8");

      if (full.includes("__tests__")) {
        banned.forEach((term) => {
          if (content.includes(term) && !content.includes("vi.fn")) {
            console.error(`LIVE CALL FOUND: ${term} in ${full}`);
            process.exit(1);
          }
        });
      }
    }
  }
}

scan(path.join(__dirname, "../src"));
