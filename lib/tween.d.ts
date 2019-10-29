import * as gsap from 'gsap';
export declare const Back: typeof gsap.Back;
export declare const Bounce: typeof gsap.Bounce;
export declare const Circ: typeof gsap.Circ;
export declare const Elastic: typeof gsap.Elastic;
export declare const Expo: typeof gsap.Expo;
export declare const Linear: typeof gsap.Linear;
export declare const Sine: typeof gsap.Sine;
export declare const SlowMo: typeof gsap.SlowMo;
export declare const Power0: typeof gsap.Linear;
export declare const Power1: typeof gsap.Quad;
export declare const Power2: typeof gsap.Cubic;
export declare const Power3: typeof gsap.Quart;
export declare const Power4: typeof gsap.Quint;
export declare const Tween: {
    to: (target: {}, duration: number | undefined, properties: gsap.TweenConfig, settings?: gsap.TweenConfig | undefined) => Promise<gsap.TweenMax>;
    from: (target: {}, duration: number | undefined, properties: gsap.TweenConfig, settings?: gsap.TweenConfig | undefined) => Promise<gsap.TweenMax>;
    set: (target: {}, properties: gsap.TweenConfig) => gsap.TweenMax;
    killTweensOf(_target: {}): void;
};
export declare class TweenMixin {
    private __tweens;
    private __getTweenSettings;
    private __registerTween;
    protected tweenFrom(targetOrDuration: {} | number, durationOrProperties: number | gsap.TweenConfig, propertiesOrSettings?: gsap.TweenConfig, settings?: gsap.TweenConfig): gsap.TweenMax;
    protected tween(targetOrDuration: {} | number, durationOrProperties: number | gsap.TweenConfig, propertiesOrSettings?: gsap.TweenConfig, settings?: gsap.TweenConfig): gsap.TweenMax;
    protected killTweens(): void;
    protected pauseTweens(): void;
    protected resumeTweens(): void;
    protected killTweenOf(target?: {}): void;
}
