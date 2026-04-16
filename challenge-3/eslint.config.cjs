const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ['lib/**/*.js', 'routes/**/*.js', 'app.js'],
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
