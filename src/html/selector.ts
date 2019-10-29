export function getElement(_target: HTMLElement | string): HTMLElement | null {
  // target vinden
  if (typeof _target === 'string') {
    return document.querySelector(_target as string);
  } else if (_target instanceof HTMLElement) {
    return _target as HTMLElement;
  }

  return null;
}
