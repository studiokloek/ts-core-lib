import { Random as RandomJS, MersenneTwister19937 } from 'random-js';

/**
 * Her-export van het `Random` type uit `random-js`, dat een instantie van een willekeuriggetallengenerator met seed vertegenwoordigt.
 */
export type Random = RandomJS;

/**
 * Een globaal gedeelde, automatisch geseede Mersenne Twister willekeuriggetallengenerator-instantie.
 * Gebruik dit voor algemene willekeuriggetallengeneratie door de hele applicatie.
 */
export const KloekRandom = new RandomJS(MersenneTwister19937.autoSeed());

/**
 * Maakt een nieuwe deterministische willekeuriggetallengenerator aan, geseeed met de opgegeven waarde.
 * Gebruik dit wanneer reproduceerbare willekeurige reeksen nodig zijn (bijv. voor testen of replay).
 */
export function createRandomizer(_seed: number): Random {
  return new RandomJS(MersenneTwister19937.seed(_seed));
}
