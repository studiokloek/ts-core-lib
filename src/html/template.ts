import { Logger } from './../logger';

export function getElementFromTemplate(_id: string): HTMLElement | undefined {
  const template = document.querySelector(_id) as HTMLElement;

  if (!template || !template.firstChild) {
    Logger.error('HTMLInfoOverlay template not found...');
    return;
  }

  // get template contents
  const contents = document.createElement('div');
  contents.innerHTML = template.innerHTML;

  return contents.firstChild as HTMLElement;
}
