import { Random, MersenneTwister19937 } from 'random-js';

export type Random = typeof Random;

export const KloekRandom = new Random(MersenneTwister19937.autoSeed());

export function createRandomizer(_seed: number): Random {
  return new Random(MersenneTwister19937.seed(_seed));
}
