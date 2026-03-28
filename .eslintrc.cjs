module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  env: {
    es2021: true,
    node: true,
    jest: true
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["dist/", "node_modules/"],
  rules: {
    "no-restricted-globals": ["error", "fetch"],
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "axios",
            message: "Use shared API client only"
          }
        ]
      }
    ]
  },
  overrides: [
    {
      files: ["src/lib/api.ts"],
      rules: {
        "no-restricted-imports": "off"
      }
    }
  ]
};
