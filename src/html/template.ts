import { Logger } from '../logger';

/**
 * Haalt een element op uit een HTML `<template>` op basis van een CSS-selector.
 * Geeft `undefined` terug en logt een fout als het element niet gevonden wordt.
 */
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
