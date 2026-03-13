import { escapeRegExp } from 'lodash';
import { default as orgSlugify } from 'slugify';

/**
 * Vervangt alle voorkomens van `pattern` in `string` door `replacement`.
 * Het patroon wordt behandeld als een letterlijke string, niet als een reguliere expressie.
 */
export const replaceAll = (string: string, pattern: string, replacement: string): string => {
  return string.replace(new RegExp(escapeRegExp(pattern), 'g'), replacement);
};

/**
 * Zet een string om naar een URL-vriendelijke slug door speciale tekens te verwijderen en spaties te vervangen door koppeltekens.
 * Zet het resultaat optioneel om naar kleine letters.
 */
export const slugify = (string: string, lowercase = false): string => {
  return orgSlugify(string, {
    lower: lowercase,
    strict: true,
  });
};

/**
 * Codeert een UTF-8 string naar een Base64-gecodeerde string, waarbij Unicode-tekens correct worden verwerkt.
 */
export function utf8ToB64(value: string): string {
  return window.btoa(unescape(encodeURIComponent(value)));
}

/**
 * Decodeert een Base64-gecodeerde string terug naar een UTF-8 string, waarbij Unicode-tekens correct worden verwerkt.
 */
export function b64ToUtf8(value: string): string {
  return decodeURIComponent(escape(window.atob(value)));
}
