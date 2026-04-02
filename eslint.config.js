const tseslint = require("typescript-eslint");

module.exports = [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["**/*.ts", "**/*.js"],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {},
  },
];
