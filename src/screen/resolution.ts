import { memoize } from 'lodash-es';
import { CoreDebug } from '../debug';
import { getPixelRatio, isMobile, isObsoleteBrowser, isPlatform, Platform } from '../device';
import { getLogger } from '../logger';
import { ResolutionMode } from './constants';
import { getViewportSize } from './viewport';

const Logger = getLogger('device > resolution');

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

  if (isMobile()) {
    if (isPlatform(Platform.IOS) && viewportSize > 1024) {
      // ios retina
      screenResolution = textureResolution = ResolutionMode.RETINA;
    } else if (viewportSize > 1280 && pixelRatio > 1.5) {
      // android retina ea
      screenResolution = textureResolution = ResolutionMode.RETINA;
    } else if (pixelRatio > 1.2 && viewportSize > 1280) {
      textureResolution = ResolutionMode.RETINA;
    }
    // grote viewport en geen oude browser?
  } else if (viewportSize > 1280 && !isObsoleteBrowser()) {
    if (pixelRatio >= 2) {
      // is er retina scherm aanwezig?
      screenResolution = textureResolution = ResolutionMode.RETINA;
    } else {
      // nee, maar wel hoge textures
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
