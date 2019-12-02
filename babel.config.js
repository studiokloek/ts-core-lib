// get babel runtime version
const pkg = require('./package.json');
const runtimeVersion = pkg.dependencies['@babel/runtime'].replace('^', '');

module.exports = {
  presets: [
    [
      '@babel/env',
      {
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
        corejs: false,
        helpers: true,
        useESModules: true,
      },
    ],
  ],
  ignore: ['src/@types', /[\/\\]core-js/, /@babel[\/\\]runtime/],
};
