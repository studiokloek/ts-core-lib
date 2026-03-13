import {
  Back,
  Bounce,
  Circ,
  Cubic,
  Elastic,
  Expo,
  Linear,
  Sine,
  Power0,
  Power1,
  Power2,
  Power3,
  Power4,
  Quad,
  Quart,
  Quint,
  SteppedEase,
  Strong,
} from 'gsap/gsap-core';

import { SlowMo, RoughEase, ExpoScaleEase } from 'gsap/EasePack';

/**
 * Verzameling van alle GSAP-easingfuncties en -constructors, opnieuw geëxporteerd als één
 * benoemd object voor gemakkelijk gebruik. Bevat standaard GSAP-easings (Back, Bounce, Circ,
 * Cubic, Elastic, Expo, Linear, Power0–4, Quad, Quart, Quint, Sine, SteppedEase, Strong)
 * evenals EasePack-uitbreidingen (SlowMo, RoughEase, ExpoScaleEase).
 */
export const Easing = {
  Back,
  Bounce,
  Circ,
  Cubic,
  Elastic,
  Expo,
  Linear,
  Sine,
  Power0,
  Power1,
  Power2,
  Power3,
  Power4,
  Quad,
  Quart,
  Quint,
  SteppedEase,
  Strong,
  SlowMo,
  RoughEase,
  ExpoScaleEase,
};

/**
 * Aangepaste GSAP-easingfunctie ontworpen voor reduced-motion-verplaatsingen en -rotaties.
 * Produceert een zeer subtiele beweging (5% van het volledige bereik) door een `Power4`-curve
 * symmetrisch toe te passen op beide helften van de tween, waarbij de beweging waarneembaar maar minimaal
 * blijft voor gebruikers die de voorkeur geven aan verminderde animatie.
 */
export const BeamEase: gsap.EaseFunction = (p) => {
	const percentage = 0.05;

	let v:number;

	if (p <= 0.5) {
		v = percentage * Power4.easeIn(p * 2);
	} else {
		v = 1 - percentage + percentage * Power4.easeOut(-1 + p * 2);
	}

	return v;
};
