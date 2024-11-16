import { JSONObject } from '../internal'
import { AssertType, LOCATION_TRACKER, hitAssertion } from './assert'
import { locationAtCallStack } from './location'

export { JSONObject, AssertType, hitAssertion }
export { registerAssertion } from './assert'

/**
 * Assert that condition is true every time this function is called, AND that
 * it is called at least once. This test property will be viewable in the
 * "Antithesis SDK: Always" group of the triage report.
 *
 * @param {boolean} condition - The condition being asserted. Evaluated at runtime.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 */
export function always(
    condition: boolean,
    message: string,
    details?: JSONObject
) {
    assertImpl({
        message,
        assertType: 'always',
        mustHit: true,
        condition,
        details,
    })
}

/**
 * Assert that condition is true every time this function is called.
 * Unlike the <code>always</code> function, the test property spawned by
 * <code>alwaysOrUnreachable</code> will not be marked as failing if the
 * function is never invoked. This test property will be viewable in the
 * "Antithesis SDK: Always" group of the triage report.
 *
 * @param {boolean} condition - The condition being asserted. Evaluated at runtime.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 */
export function alwaysOrUnreachable(
    condition: boolean,
    message: string,
    details?: JSONObject
) {
    assertImpl({
        message,
        assertType: 'always',
        mustHit: false,
        condition,
        details,
    })
}

/**
 * Assert that condition is true at least one time that this function was
 * called. The test property spawned by <code>sometimes</code> will be marked as
 * failing if this function is never called, or if condition is false every time
 * that it is called. This test property will be viewable in the "Antithesis
 * SDK: Sometimes" group of the triage report.
 *
 * @param {boolean} condition - The condition being asserted. Evaluated at runtime.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 */
export function sometimes(
    condition: boolean,
    message: string,
    details?: JSONObject
) {
    assertImpl({
        message,
        assertType: 'sometimes',
        mustHit: true,
        condition,
        details,
    })
}

/**
 * Assert that a line of code is never reached. The test property spawned
 * by <code>unreachable</code> will be marked as failing if this function is
 * ever called. This test property will be viewable in the "Antithesis SDK:
 * Reachablity assertions" group of the triage report.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 */
export function unreachable(message: string, details?: JSONObject) {
    assertImpl({
        message,
        assertType: 'reachability',
        mustHit: false,
        condition: true,
        details,
    })
}

/**
 * Assert that a line of code is reached at least once. The test property
 * spawned by <code>reachable</code> will be marked as failing if this function
 * is never called. This test property will be viewable in the "Antithesis SDK:
 * Reachablity assertions" group of the triage report.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 */
export function reachable(message: string, details?: JSONObject) {
    assertImpl({
        message,
        assertType: 'reachability',
        mustHit: true,
        condition: true,
        details,
    })
}

function assertImpl(args: {
    message: string
    assertType: AssertType
    mustHit: boolean
    condition: boolean
    details?: JSONObject
}) {
    const id = args.message
    const location = LOCATION_TRACKER.getOr(id, () => locationAtCallStack(4))
    hitAssertion({ id, location, ...args })
}
