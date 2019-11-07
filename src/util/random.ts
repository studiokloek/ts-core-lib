import { Random as RandomJS, MersenneTwister19937 } from 'random-js';

export type Random = RandomJS;

export const KloekRandom = new RandomJS(MersenneTwister19937.autoSeed());

export function createRandomizer(_seed: number): Random {
  return new RandomJS(MersenneTwister19937.seed(_seed));
}
