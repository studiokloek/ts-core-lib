/**
 * Opent een URL programmatisch door een klik te simuleren op een dynamisch aangemaakt ankerelement.
 * Opent standaard in een nieuw tabblad (`target = '_blank'`).
 */
export function openUrl(url: string, target = '_blank'): void {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('target', target);
  link.dispatchEvent(new MouseEvent('click'));
}
