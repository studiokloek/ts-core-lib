import { memoize } from 'lodash-es';
import { CoreDebug } from '../debug';
import { getPixelRatio, isMobile, isObsoleteBrowser, isPlatform, Platform } from '../device';
import { getLogger } from '../logger';
import { ResolutionMode } from './constants';
import { getScreenSize } from './viewport';

const Logger = getLogger('device > resolution');

export const determineResolution = memoize((): { screen: number; texture: number } => {
  const pixelRatio = getPixelRatio(),
    viewportSize = Math.floor(getScreenSize() * pixelRatio);

  if (CoreDebug.forceLowResolution()) {
    return {
      screen: 1,
      texture: 1,
    };
  }

  let screenResolution = ResolutionMode.NORMAL,
    textureResolution = ResolutionMode.NORMAL;

  if (isMobile()) {
    if (isPlatform(Platform.IOS) && viewportSize > 1024) {
      // ios retina
      screenResolution = textureResolution = ResolutionMode.RETINA;
    } else if (viewportSize > 1280) {
      if (pixelRatio >= 1.5) {
        // android retina ea
        screenResolution = textureResolution = ResolutionMode.RETINA;
      } else if (pixelRatio > 1.2) {
        textureResolution = ResolutionMode.RETINA;
      }
    }
    // dekstop, maar geen oude browser?
  } else if (!isObsoleteBrowser()) {
    // is er retina?
    if (pixelRatio >= 2) {
      screenResolution = ResolutionMode.RETINA;
    }

    // grote viewport?
    if (viewportSize >= 1280) {
      // dan high res textures
      textureResolution = ResolutionMode.RETINA;
    }
  }

  Logger.info(`pixelRatio[${pixelRatio}] viewportSize[${viewportSize}] screenResolution[${screenResolution}] textureResolution[${textureResolution}]`);

  // Logger.info(screenResolution, textureResolution);

  return {
    screen: screenResolution,
    texture: textureResolution,
  };
});
