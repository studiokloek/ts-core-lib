/// <reference types="lodash" />
import { Parser } from 'bowser';
export declare const browserInfoParser: Parser.Parser;
export declare const browserSatisfies: (info: Parser.checkTree) => boolean;
export declare const isMobile: () => boolean;
export declare const deviceNeedsMediaTrigger: (() => boolean) & import("lodash").MemoizedFunction;
export declare const isObsoleteBrowser: () => boolean;
