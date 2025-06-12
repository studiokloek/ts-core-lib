import { memoize } from 'lodash';
import { CoreLibraryOptions } from '..';
import { CoreDebug } from '../debug';
import { getPixelRatio, isMobile, isObsoleteBrowser, isPlatform, Platform } from '../device';
import { getLogger } from '../logger';
import { ResolutionBreakpoint, ResolutionMode } from './constants';
import { getScreenSize } from './viewport';

const Logger = getLogger('device > resolution');

export const determineResolution = memoize((): { screen: ResolutionMode; texture: ResolutionMode } => {
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

  const breakpoints: ResolutionBreakpoint = CoreLibraryOptions.RESOLUTION_BREAKPOINTS ?? { ios: 1024, android: 1280, desktop: 1280 };

  if (!breakpoints || Object.keys(breakpoints).length !== 3) {
    Logger.error('Resolution breakpoints not valid', breakpoints);
    return {
      screen: 1,
      texture: 1,
    };
  }

  if (isMobile()) {
    if (isPlatform(Platform.IOS) && viewportSize > breakpoints.ios) {
      // ios retina
      screenResolution = textureResolution = ResolutionMode.RETINA;
    } else if (pixelRatio >= 1.5 && viewportSize > breakpoints.android) {
      // android retina ea
      screenResolution = textureResolution = ResolutionMode.RETINA;
    } else if (pixelRatio > 1.2 && viewportSize > breakpoints.android) {
      // alleen hogere kwaliteit textures
      textureResolution = ResolutionMode.RETINA;
    }
  } else {
    // desktop, maar geen oude browser en een grote viewport?
    if (!isObsoleteBrowser() && viewportSize >= breakpoints.desktop) {
      // dan high res textures
      textureResolution = ResolutionMode.RETINA;

      // is er retina scherm ook?
      if (pixelRatio >= 2) {
        screenResolution = ResolutionMode.RETINA;
      }
    }
  }

  Logger.debug(`pixelRatio[${pixelRatio}] viewportSize[${viewportSize}] screenResolution[${screenResolution}] textureResolution[${textureResolution}]`);

  return {
    screen: screenResolution,
    texture: textureResolution,
  };
});
