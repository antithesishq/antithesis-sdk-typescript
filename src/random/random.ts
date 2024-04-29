/**
 * random - Antithesis SDK
 * @module antithesis-sdk/random
 */
import { libvstar } from '../internal'

/**
 * Returns an integer value chosen by Antithesis.
 * You should not store this value or use it to seed a PRNG,
 * but should use it immediately.
 */
export const GetRandom = () => {
    return libvstar.Get_random()
}

/**
 * Returns a randomly chosen item from a list of options.
 * You should not store this value, but should use it immediately.
 *
 * This function is not purely for convenience. Signaling to the
 * Antithesis platform that you intend to use a random value in
 * a structured way enables it to provide more interesting choices
 * over time.
 */
export const RandomChoice = (things: unknown[]) => {
    const num_things = things.length
    if (num_things < 1) {
        return undefined
    }

    const uval = GetRandom()
    const index = uval % num_things
    return things[index]
}
