/// <reference types="lodash" />
export interface GPUInfo {
    isWebGLSupported: boolean;
    useLegacyWebGL: boolean;
    preserveDrawingBuffer: boolean;
    vendor: string;
    renderer: string;
}
export declare const getGPUInfo: (() => GPUInfo) & import("lodash").MemoizedFunction;
