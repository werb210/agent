const { execSync } = require('node:child_process');

const patterns = [
  { name: 'app.listen', regex: /\bapp\.listen\b/ },
  { name: '/health route', regex: /(["'`])\/health\1/ },
  { name: 'express', regex: /\bexpress\b/ },
  { name: 'fastify', regex: /\bfastify\b/ },
  { name: 'PORT=', regex: /PORT=/ },
  { name: 'http://localhost', regex: /http:\/\/localhost/ }
];

const files = execSync('rg --files src tests test package.json', { encoding: 'utf8' })
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const violations = [];
for (const file of files) {
  const content = require('node:fs').readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        violations.push(`${file}:${index + 1}: ${pattern.name}: ${line.trim()}`);
      }
    }
  });
}

if (violations.length > 0) {
  console.error('Found HTTP regressions:\n' + violations.join('\n'));
  process.exit(1);
}

console.log('No HTTP regressions found.');
