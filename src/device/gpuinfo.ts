import { includes, memoize, some } from 'lodash-es';

export interface GPUInfo {
  isWebGLSupported: boolean;
  useLegacyWebGL: boolean;
  preserveDrawingBuffer: boolean;
  vendor: string;
  renderer: string;
}

export const getGPUInfo = memoize(
  (): GPUInfo => {
    const info: GPUInfo = {
        isWebGLSupported: false,
        useLegacyWebGL: false,
        preserveDrawingBuffer: false,
        vendor: 'unknown',
        renderer: 'unknown',
      },
      contextOptions = { stencil: true, failIfMajorPerformanceCaveat: true };

    try {
      if (!('WebGLRenderingContext' in window)) {
        return info;
      }

      const canvas = document.createElement('canvas');

      let gl = (canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions)) as WebGLRenderingContext | null;

      if (!gl) {
        return info;
      }

      let isWebGLSupported = true;

      const attributes = gl.getContextAttributes();
      if (!attributes || !attributes.stencil) {
        isWebGLSupported = false;
      }

      // double check some devices
      if (isWebGLSupported) {
        const renderInfo = gl.getExtension('WEBGL_debug_renderer_info');

        if (renderInfo) {
          info.renderer = gl.getParameter(renderInfo.UNMASKED_RENDERER_WEBGL);
          info.vendor = gl.getParameter(renderInfo.UNMASKED_VENDOR_WEBGL);

          // legacy modus? voor bepaalde chipsets
          const blacklistedGPU = some(['mali-400', 'mali-450', 'mali-470'], element => includes(info.renderer.toLowerCase(), element)),
            disabledGPU = some(['ati mobility radeon hd 4'], element => includes(info.renderer.toLowerCase(), element));

          if (disabledGPU) {
            isWebGLSupported = false;
          } else if (blacklistedGPU) {
            info.useLegacyWebGL = true;
            info.preserveDrawingBuffer = true;
          }
        }
      }

      info.isWebGLSupported = isWebGLSupported;

      if (gl) {
        const loseContext = gl.getExtension('WEBGL_lose_context');

        if (loseContext) {
          loseContext.loseContext();
        }
      }

      gl = null;
    } catch (error) {
      // error
    }

    return info;
  },
);
