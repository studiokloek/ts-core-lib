export function openUrl(url: string, target = '_blank'): void {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('target', target);
  link.dispatchEvent(new MouseEvent('click'));
}
