import * as internal from '../internal'

/**
 * Returns an unsigned 64-bit integer value chosen by Antithesis. 
 * 
 * You should use this value immediately rather than using it later. If you 
 * delay, then it is possible for the simulation to branch in between receiving 
 * the random data and using it. These branches will have the same random value, 
 * which defeats the purpose of branching.
 * 
 * Similarly, do not use the value to seed a pseudo-random number generator. 
 * The PRNG will produce a deterministic sequence of pseudo-random values based 
 * on the seed, so if the simulation branches, the PRNG will use the same sequence
 * of values in all branches.
 */
export function randomU64() {
    return internal.randomU64()
}

/**
 * Returns a number between 0 and 1 chosen by Antithesis. 
 * 
 * You should use this value immediately rather than using it later. If you 
 * delay, then it is possible for the simulation to branch in between receiving 
 * the random data and using it. These branches will have the same random value, 
 * which defeats the purpose of branching.
 * 
 * Similarly, do not use the value to seed a pseudo-random number generator. 
 * The PRNG will produce a deterministic sequence of pseudo-random values based 
 * on the seed, so if the simulation branches, the PRNG will use the same sequence
 * of values in all branches.
 * 
 * Similar to <code>Math.random()</code>, but driven by Antithesis.
 */
export function random() {
    // 64 bit floats can losslessly represents every multiple of 2^(-53) in between 0 to 1.
    // Hence use the low 53 bit of our random u64 to produce random floats in the unit interval with a uniform distribution.
    return Number(BigInt.asUintN(53, internal.randomU64())) / 2 ** 53
}

/**
 * Returns a randomly chosen item from a list of options. 
 * 
 * You should use this value immediately rather than using it later. If you 
 * delay, then it is possible for the simulation to branch in between receiving 
 * the random data and using it. These branches will have the same random value, 
 * which defeats the purpose of branching.
 * 
 * Similarly, do not use the value to seed a pseudo-random number generator. 
 * The PRNG will produce a deterministic sequence of pseudo-random values based 
 * on the seed, so if the simulation branches, the PRNG will use the same sequence
 *  of values in all branches.
 *
 * This function is not purely for convenience. Signaling to the Antithesis
 * platform that you intend to use a random value in a structured way enables it
 * to provide more interesting choices over time.
 */
export function randomChoice(things: unknown[]) {
    const num_things = things.length
    if (num_things < 1) {
        return undefined
    }

    const index = Math.floor(random() * num_things)
    return things[index]
}
