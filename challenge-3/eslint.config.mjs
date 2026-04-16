import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        console: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "semi": ["error", "always"],
      "eqeqeq": ["error", "always"],
      "no-var": "error",
      "prefer-const": "error"
    }
  },
  {
    ignores: ["node_modules/", "static/", "wireframes/", "public/", "data/", "docs/", "views/"]
  }
];
