import { default as Bowser } from 'bowser';
import type { Parser } from 'bowser';
import { memoize } from 'lodash-es';
import { isApp, isPlatform, Platform } from './device';
import { supportsTouch } from './interaction';

export const browserInfoParser = Bowser.getParser(navigator.userAgent);

export const browserSatisfies = (info: Parser.checkTree): boolean => {
  return browserInfoParser.satisfies(info) === true;
};

const platformInfo = browserInfoParser.getPlatform();
const browserInfo = browserInfoParser.getBrowser();
const osInfo = browserInfoParser.getOS();

// console.log(platformInfo, osInfo, browserInfo);

export const isMobile = (): boolean => {
  // browser user agent check
  if (platformInfo.type === 'mobile' || platformInfo.type === 'tablet') {
    return true;
  }

  // iPadOS moet weer speciaal doen
  if (platformInfo.type == 'desktop' && osInfo.name === 'macOS' && browserInfo.version === undefined && supportsTouch()) {
    return true;
  }

  // app = altijd mobile
  if (isPlatform(Platform.ANDROID) || isPlatform(Platform.IOS)) {
    return true;
  }

  return false;
};

export const deviceNeedsMediaTrigger = memoize((): boolean => {
  // app heeft geen media trigger nodig
  if (isApp()) {
    return false;
  }

  // mobiel altijd
  if (isMobile()) {
    return true;
  }

  // browser op desktop
  // nieuwere browsers verlangen klik van gebruiker
  if (
    browserSatisfies({
      desktop: {
        safari: '>=11',
        chrome: '>=72',
        firefox: '>=66',
        edge: '>=92',
      },
    }) === true
  ) {
    return true;
  }

  return false;
});

export const isObsoleteBrowser = (): boolean => {
  // app is altijd goed!
  if (isApp()) {
    return false;
  }

  // oudere browser?
  const info = {
    dekstop: {
      ie: '<11',
      firefox: '<29',
      chrome: '<33',
      edge: '<29',
      safari: '<10',
      opera: '<26',
    },
    mobile: {
      'android browser': '>=1', // = android browser
      safari: '<10',
      ie: '<11',
      firefox: '<29',
      chrome: '<40',
      opera: '<12',
    },
    tablet: {
      'android browser': '>=1', // = android browser
      safari: '<10',
      ie: '<11',
      firefox: '<29',
      chrome: '<40',
      opera: '<12',
    },
  };

  if (browserSatisfies(info) === true) {
    return true;
  }

  // tv?
  if (browserInfoParser.getPlatformType(true) === 'tv') {
    return true;
  }

  return false;
};

export const isStandaloneBrowser = (): boolean => {
  if (isApp() || !isMobile()) {
    return false;
  }

  if (isPlatform(Platform.IOS)) {
    return 'standalone' in window.navigator && (window.navigator as any)['standalone'];
  }

  let isStandAlone = window.matchMedia('(display-mode: standalone)').matches;

  if (!isStandAlone) {
    isStandAlone = screen.height - document.documentElement.clientHeight < 40;
  }

  return isStandAlone;
};
