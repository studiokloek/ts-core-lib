import { AppData } from '../app';

export function sayHello(): void {
  const { meta, info } = AppData;

  const banner =
    '%c....................................................................\n' +
    '\n' +
    `%cStudio Kloek presenteert in samenwerking met ${info.client}: \n` +
    `%c${meta.title}  \n` +
    `%c${meta.description}  \n` +
    '\n' +
    '%cConcept, ontwerp & ontwikkeling: \n%cStudio Kloek (https://studiokloek.nl)\n' +
    '\n' +
    `%cVersie: \n%cv${info.version} uitgebracht in ${info.year}\n\n` +
    '%cStudio Kloek %c❤ %cPixiJS, GSAP & howler.js\n' +
    '%c....................................................................\n';

  window.console.log(
    banner,
    'color:#e21e02;font-weight:bold;',
    'color:#00b5eb;font-weight:bold;',
    'color:#00b5eb;font-style:italic;',
    'color:#00b5eb;font-style:italic;',

    'color:#00b5eb;font-weight:bold;',
    'color:#00b5eb;font-style:italic',
    'color:#00b5eb;font-weight:bold;',
    'color:#00b5eb;font-style:italic',

    'color:#00b5eb;font-style:italic',
    'color:#e21e02;font-weight:bold;',
    'color:#00b5eb;font-style:italic',

    'color:#e21e02;font-weight:bold;',
  );
}
