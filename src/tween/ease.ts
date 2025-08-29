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
