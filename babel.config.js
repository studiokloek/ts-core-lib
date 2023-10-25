// get babel runtime version
const package = require('./package.json');
const runtimeVersion = package.dependencies['@babel/runtime-corejs3'].replace('^', '');

module.exports = {
  presets: [
    [
      '@babel/env',
      {
        modules: false,
        useBuiltIns: 'usage',
        corejs: 3,
      },
    ],
    '@babel/typescript',
  ],
  plugins: [
    ['@babel/proposal-decorators', { legacy: true }],
    ['@babel/transform-class-properties', { loose: true }],
    ['@babel/transform-private-property-in-object', { loose: true }],
    ['@babel/transform-private-methods', { loose: true }],
    ['@babel/transform-object-rest-spread'],
    ['@babel/transform-nullish-coalescing-operator'],
    ['@babel/transform-optional-chaining'],
    [
      '@babel/transform-runtime',
      {
        version: runtimeVersion,
        corejs: 3,
        proposals: true,
        helpers: true,
        useESModules: true,
      },
    ],
  ],
  ignore: ['src/@types', /[/\\]core-js/, /@babel[/\\]runtime/],
};
