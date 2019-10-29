import { Random as RandomJS, MersenneTwister19937 } from 'random-js';

export const Random = new RandomJS(MersenneTwister19937.autoSeed());

export function createRandomizer(_seed: number): RandomJS {
  return new RandomJS(MersenneTwister19937.seed(_seed));
}
