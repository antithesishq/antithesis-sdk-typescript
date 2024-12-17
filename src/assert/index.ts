import { JSONObject } from '../internal'
import { AssertType, LOCATION_TRACKER, hitAssertion } from './assert'
import { type GuidanceData, type GuidanceType, hitGuidance } from './guidance'
import { locationAtCallStack } from './location'

export { JSONObject, AssertType, hitAssertion }
export { registerAssertion } from './assert'
export { registerGuidance } from './guidance'

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

/**
 * <code>alwaysGreaterThan(x, y, ...)</code> is mostly equivalent to
 * <code>always(x > y, ...)</code>. Additionally Antithesis has more visibility
 * to the value of <code>x</code> and <code>y</code>, and the assertion details
 * would be merged with <code>{"left": x, "right": y}</code>.
 *
 * @param {number} left - The left-hand-side of the comparison.
 *
 * @param {number} right - The right-hand-side of the comparison.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 *
 * @see always
 */
export function alwaysGreaterThan(
    left: number,
    right: number,
    message: string,
    details?: JSONObject
) {
    assertImpl({
        message,
        assertType: 'always',
        mustHit: true,
        condition: left > right,
        details: { left, right, ...details },
    })
    guidanceImpl({
        message,
        guidanceType: 'numeric',
        maximize: false,
        data: { left, right },
    })
}

/**
 * <code>alwaysGreaterThanOrEqualTo(x, y, ...)</code> is mostly equivalent to
 * <code>always(x >= y, ...)</code>. Additionally Antithesis has more visibility
 * to the value of <code>x</code> and <code>y</code>, and the assertion details
 * would be merged with <code>{"left": x, "right": y}</code>.
 *
 * @param {number} left - The left-hand-side of the comparison.
 *
 * @param {number} right - The right-hand-side of the comparison.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 *
 * @see always
 */
export function alwaysGreaterThanOrEqualTo(
    left: number,
    right: number,
    message: string,
    details?: JSONObject
) {
    assertImpl({
        message,
        assertType: 'always',
        mustHit: true,
        condition: left >= right,
        details: { left, right, ...details },
    })
    guidanceImpl({
        message,
        guidanceType: 'numeric',
        maximize: false,
        data: { left, right },
    })
}

/**
 * <code>alwaysLessThan(x, y, ...)</code> is mostly equivalent to <code>always(x
 * < y, ...)</code>. Additionally Antithesis has more visibility to the value of
 * <code>x</code> and <code>y</code>, and the assertion details would be merged
 * with <code>{"left": x, "right": y}</code>.
 *
 * @param {number} left - The left-hand-side of the comparison.
 *
 * @param {number} right - The right-hand-side of the comparison.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 *
 * @see always
 */
export function alwaysLessThan(
    left: number,
    right: number,
    message: string,
    details?: JSONObject
) {
    assertImpl({
        message,
        assertType: 'always',
        mustHit: true,
        condition: left < right,
        details: { left, right, ...details },
    })
    guidanceImpl({
        message,
        guidanceType: 'numeric',
        maximize: true,
        data: { left, right },
    })
}

/**
 * <code>alwaysLessThanOrEqualTo(x, y, ...)</code> is mostly equivalent to
 * <code>always(x <= y, ...)</code>. Additionally Antithesis has more visibility
 * to the value of <code>x</code> and <code>y</code>, and the assertion details
 * would be merged with <code>{"left": x, "right": y}</code>.
 *
 * @param {number} left - The left-hand-side of the comparison.
 *
 * @param {number} right - The right-hand-side of the comparison.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 *
 * @see always
 */
export function alwaysLessThanOrEqualTo(
    left: number,
    right: number,
    message: string,
    details?: JSONObject
) {
    assertImpl({
        message,
        assertType: 'always',
        mustHit: true,
        condition: left <= right,
        details: { left, right, ...details },
    })
    guidanceImpl({
        message,
        guidanceType: 'numeric',
        maximize: true,
        data: { left, right },
    })
}

/**
 * <code>sometimesGreaterThan(x, y, ...)</code> is mostly equivalent to
 * <code>sometimes(x > y, ...)</code>. Additionally Antithesis has more
 * visibility to the value of <code>x</code> and <code>y</code>, and the
 * assertion details would be merged with <code>{"left": x, "right": y}</code>.
 *
 * @param {number} left - The left-hand-side of the comparison.
 *
 * @param {number} right - The right-hand-side of the comparison.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 *
 * @see sometimes
 */
export function sometimesGreaterThan(
    left: number,
    right: number,
    message: string,
    details?: JSONObject
) {
    assertImpl({
        message,
        assertType: 'sometimes',
        mustHit: true,
        condition: left > right,
        details: { left, right, ...details },
    })
    guidanceImpl({
        message,
        guidanceType: 'numeric',
        maximize: true,
        data: { left, right },
    })
}

/**
 * <code>sometimesGreaterThanOrEqualTo(x, y, ...)</code> is mostly equivalent
 * to <code>sometimes(x >= y, ...)</code>. Additionally Antithesis has more
 * visibility to the value of <code>x</code> and <code>y</code>, and the
 * assertion details would be merged with <code>{"left": x, "right": y}</code>.
 *
 * @param {number} left - The left-hand-side of the comparison.
 *
 * @param {number} right - The right-hand-side of the comparison.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 *
 * @see sometimes
 */
export function sometimesGreaterThanOrEqualTo(
    left: number,
    right: number,
    message: string,
    details?: JSONObject
) {
    assertImpl({
        message,
        assertType: 'sometimes',
        mustHit: true,
        condition: left >= right,
        details: { left, right, ...details },
    })
    guidanceImpl({
        message,
        guidanceType: 'numeric',
        maximize: true,
        data: { left, right },
    })
}

/**
 * <code>sometimesLessThan(x, y, ...)</code> is mostly equivalent to <code>sometimes(x < y, ...)</code>.
 * Additionally Antithesis has more visibility to the value of <code>x</code> and <code>y</code>,
 * and the assertion details would be merged with <code>{"left": x, "right": y}</code>.
 *
 * @param {number} left - The left-hand-side of the comparison.
 *
 * @param {number} right - The right-hand-side of the comparison.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 *
 * @see sometimes
 */
export function sometimesLessThan(
    left: number,
    right: number,
    message: string,
    details?: JSONObject
) {
    assertImpl({
        message,
        assertType: 'sometimes',
        mustHit: true,
        condition: left < right,
        details: { left, right, ...details },
    })
    guidanceImpl({
        message,
        guidanceType: 'numeric',
        maximize: false,
        data: { left, right },
    })
}

/**
 * <code>sometimesLessThanOrEqualTo(x, y, ...)</code> is mostly equivalent to <code>sometimes(x <= y, ...)</code>.
 * Additionally Antithesis has more visibility to the value of <code>x</code> and <code>y</code>,
 * and the assertion details would be merged with <code>{"left": x, "right": y}</code>.
 *
 * @param {number} left - The left-hand-side of the comparison.
 *
 * @param {number} right - The right-hand-side of the comparison.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 *
 * @see sometimes
 */
export function sometimesLessThanOrEqualTo(
    left: number,
    right: number,
    message: string,
    details?: JSONObject
) {
    assertImpl({
        message,
        assertType: 'sometimes',
        mustHit: true,
        condition: left <= right,
        details: { left, right, ...details },
    })
    guidanceImpl({
        message,
        guidanceType: 'numeric',
        maximize: false,
        data: { left, right },
    })
}

/**
 * <code> alwaysSome({a: x, b: y, ...}, ...)</code> is similar to <code>always(x
 * || y || ..., ...)</code>. Additionally:
 * <ul>
 *   <li>Antithesis has more visibility to the individual propositions.</li>
 *   <li>There is no short-circuiting, so all of <code>x</code>, <code>y</code>, ... would be evaluated.</li>
 *   <li>The assertion details would be merged with <code>{"a": x, "b": y, ...}</code>.</li>
 * </ul>
 *
 * @param {Object.<string, boolean>} conditions - The collection of conditions
 * to-be disjuncted, represented as a map of booleans indexed by strings.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be
 * human-readable. Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context
 * for assertion success/failure. Evaluated at runtime.
 *
 * @see always
 */
export function alwaysSome(
    conditions: { [key: string]: boolean },
    message: string,
    details?: JSONObject
) {
    const condition = Object.values(conditions).some((c) => c)
    assertImpl({
        message,
        assertType: 'always',
        mustHit: true,
        condition,
        details: { ...conditions, ...details },
    })
    guidanceImpl({
        message,
        guidanceType: 'boolean',
        maximize: false,
        data: conditions,
    })
}

/**
 * <code>sometimesAll({a: x, b: y, ...}, ...)</code> is similar to
 * <code>sometimes(x && y && ..., ...)</code>. Additionally:
 * <ul>
 *   <li>Antithesis has more visibility to the individual propositions.</li>
 *   <li>There is no short-circuiting, so all of <code>x</code>, <code>y</code>, ... would be evaluated.</li>
 *   <li>The assertion details would be merged with <code>{"a": x, "b": y, ...}</code>.</li>
 * </ul>
 *
 * @param {Object.<string, boolean>} conditions - The collection of conditions to-be disjuncted,
 * represented as a map of booleans indexed by strings.
 *
 * @param {string} message - A unique string identifier of the assertion.
 * Provides context for assertion success/failure and is intended to be human-readable.
 * Must be provided as a string literal.
 *
 * @param {JSONObject} details - Additional details that provide greater context for assertion success/failure.
 * Evaluated at runtime.
 *
 * @see sometimes
 */
export function sometimesAll(
    conditions: { [key: string]: boolean },
    message: string,
    details?: JSONObject
) {
    const condition = Object.values(conditions).every((c) => c)
    assertImpl({
        message,
        assertType: 'sometimes',
        mustHit: true,
        condition,
        details: { ...conditions, ...details },
    })
    guidanceImpl({
        message,
        guidanceType: 'boolean',
        maximize: true,
        data: conditions,
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

function guidanceImpl<T extends GuidanceType>(
    args: T extends unknown
        ? {
              message: string
              guidanceType: T
              maximize: boolean
              data: GuidanceData[T]
          }
        : never
) {
    const id = args.message
    const location = LOCATION_TRACKER.getOr(id, () => locationAtCallStack(4))
    hitGuidance({ id, location, ...args })
}
