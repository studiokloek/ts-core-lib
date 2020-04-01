import { escapeRegExp } from 'lodash-es';
import { default as orgSlugify } from 'slugify';

export const replaceAll = (string: string, pattern: string, replacement: string): string => {
  return string.replace(new RegExp(escapeRegExp(pattern), 'g'), replacement);
};

export const slugify = (string: string, lowercase = false): string => {
  return orgSlugify(string, {
    lower: lowercase,
    strict: true,
  });
};
