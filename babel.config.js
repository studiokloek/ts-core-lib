// get babel runtime version
const package = require('./package.json');
const runtimeVersion = package.peerDependencies['@babel/runtime-corejs3'].replace('^', '');

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
    ['@babel/proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-object-rest-spread'],
    [
      '@babel/plugin-transform-runtime',
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
