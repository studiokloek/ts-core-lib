// get babel runtime version
const package = require('./package.json'),
  runtimeVersion = package.dependencies['@babel/runtime-corejs3'].replace('^', '');

module.exports = {
  overrides: [
    {
      test: ['./src'],
      presets: [
        [
          '@babel/env',
          {
            modules: false,
            bugfixes: true,
          },
        ],
        [
          '@babel/typescript',
          {
            onlyRemoveTypeImports: false,
            allowDeclareFields: true,
          },
        ],
      ],
      plugins: [
        ['@babel/proposal-decorators', { legacy: true }],
        ['@babel/proposal-class-properties', { loose: true }],
        ['@babel/proposal-object-rest-spread'],
        ['@babel/proposal-nullish-coalescing-operator'],
        ['@babel/proposal-optional-chaining'],
        [
          '@babel/transform-runtime',
          {
            version: runtimeVersion,
            proposals: true,
          },
        ],
      ],
    },
    {
      test: ['./src', './node_modules/@babel/runtime', './node_modules/@babel/runtime-corejs3'],
      plugins: [
        [
          'polyfill-corejs3',
          {
            method: 'usage-pure',
          },
        ],
      ],
    },
  ],

  // ignore: ['src/@types', /[/\\]core-js/, /@babel[/\\]runtime/],
};
