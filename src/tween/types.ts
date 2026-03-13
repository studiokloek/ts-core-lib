
/** Een GSAP tween-instantie zoals gebruikt in de kloek-ts-core tween-API. */
export type KloekTween = gsap.core.Tween;

/** Het eigenschappen-/variabelenobject dat aan een GSAP tween wordt meegegeven. Alias voor `gsap.TweenVars`. */
export type KloekTweenVars = gsap.TweenVars;

/** Geldige tween-doelen die worden geaccepteerd door de kloek tween-API. Alias voor `gsap.TweenTarget`. */
export type KloekTweenTarget = gsap.TweenTarget;

/**
 * Reduced-motion varianteigenschappen voor een tween. Geef een `KloekTweenVars`-object mee om
 * specifieke geanimeerde eigenschappen te overschrijven wanneer de gebruiker verminderde beweging heeft ingeschakeld,
 * `'skip'` om de tween-duur met callbacks maar zonder animatie uit te voeren, of `'ignore'`
 * om de volledige animatie af te spelen ongeacht de reduced-motion-instelling.
 */
export type KloekReducedTweenVars = KloekTweenVars | 'skip' | 'ignore';

