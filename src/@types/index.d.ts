import { gsap } from 'gsap';

declare module 'gsap/gsap-core' {
  export class Tween extends gsap.core.Tween {}
}
