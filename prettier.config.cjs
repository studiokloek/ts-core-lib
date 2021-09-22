// Some settings automatically inherited from .editorconfig

module.exports = {
  // Trailing commas help with git merging and conflict resolution
  trailingComma: 'all',

  singleQuote: true,
  printWidth: 160,
  overrides: [
    {
      files: '.editorconfig',
      options: { parser: 'yaml' },
    },
    {
      files: 'LICENSE',
      options: { parser: 'markdown' },
    },
  ],
};
