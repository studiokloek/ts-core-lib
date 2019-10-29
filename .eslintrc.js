module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },
  plugins: [
    '@typescript-eslint',
    'eslint-comments',
    'promise',
    // "prettier",
    'unicorn',
  ],
  extends: [
    // "airbnb-typescript",
    'plugin:@typescript-eslint/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:promise/recommended',
    'plugin:import/recommended',
    'plugin:unicorn/recommended',
    // "prettier",
    'plugin:prettier/recommended',
    'prettier/@typescript-eslint',
  ],
  env: {
    node: true,
    browser: true,
  },
  rules: {
    'prefer-template': 2,

    'no-console': 'error',

    // Too restrictive, writing ugly code to defend against a very unlikely scenario: https://eslint.org/docs/rules/no-prototype-builtins
    'no-prototype-builtins': 'off',

    // https://basarat.gitbooks.io/typescript/docs/tips/defaultIsBad.html
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'error',

    // Use function hoisting to improve code readability
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],

    // Makes no sense to allow type inferrence for expression parameters, but require typing the response
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true, allowTypedFunctionExpressions: true }],
    '@typescript-eslint/no-use-before-define': ['error', { functions: false, classes: true, variables: true, typedefs: true }],

    // Common abbreviations are known and readable
    // "unicorn/prevent-abbreviations": "off",
    'unicorn/number-literal-case': 'off',

    'prettier/prettier': 'error',
  },

  settings: {
    'import/resolver': {
      node: {
        paths: ['src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      typescript: {},
    },
  },
};
