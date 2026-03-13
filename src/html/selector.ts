/**
 * Zoekt een HTML-element op basis van een CSS-selectorstring, of geeft het element direct terug als het al meegegeven is.
 * Geeft `null` terug als niets gevonden wordt.
 */
export function getElement(_target: HTMLElement | string): HTMLElement | null {
  // target vinden
  if (typeof _target === 'string') {
    return document.querySelector(_target as string);
  } else if (_target instanceof HTMLElement) {
    return _target as HTMLElement;
  }

  return null;
}
