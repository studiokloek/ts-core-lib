import { memoize } from 'lodash-es';
// import { getLogger } from '../logger';
import { ResolutionMode } from './constants';
import { getViewportSize } from './viewport';
import { getPixelRatio, isMobile, isPlatform, Platform, isObsoleteBrowser } from '../device';
import { CoreDebug } from '../core-debug';

// import { getLogger } from '@studiokloek/ts-core-lib';
// const Logger = getLogger('core > resolution');

console.log(1);
export const determineResolution = memoize((): { screen: number; texture: number } => {
  const pixelRatio = getPixelRatio(),
    viewportSize = Math.floor(getViewportSize() * pixelRatio);

  if (CoreDebug.forceLowResolution()) {
    return {
      screen: 1,
      texture: 1,
    };
  }

  let screenResolution = ResolutionMode.NORMAL,
    textureResolution = ResolutionMode.NORMAL;

  // Logger.info('pixelRatio', pixelRatio);
  // Logger.info('viewportSize', viewportSize);
  // Logger.info('isMobile()', isMobile());
  // Logger.info('isObsoleteBrowser()', isObsoleteBrowser());
  // Logger.info('isPlatform(Platform.IOS)', isPlatform(Platform.IOS));

  if (isMobile()) {
    if (isPlatform(Platform.IOS) && viewportSize > 1024) {
      // ios retina
      screenResolution = textureResolution = ResolutionMode.RETINA;
    } else if (viewportSize > 1280 && pixelRatio > 1.5) {
      // android retina ea
      screenResolution = textureResolution = ResolutionMode.RETINA;
    } else if (viewportSize > 1280) {
      textureResolution = ResolutionMode.RETINA;
    }
    // grote viewport en geen oude browser?
  } else if (viewportSize > 1024 && !isObsoleteBrowser()) {
    if (pixelRatio >= 2) {
      // is er retina scherm aanwezig?
      screenResolution = textureResolution = ResolutionMode.RETINA;
    } else {
      // nee, maar wel hoge textures
      textureResolution = ResolutionMode.RETINA;
    }
  }

  // Logger.info(screenResolution, textureResolution);

  return {
    screen: screenResolution,
    texture: textureResolution,
  };
});
