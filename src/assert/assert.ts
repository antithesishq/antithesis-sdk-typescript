/**
 * assert - Antithesis SDK
 * @module antithesis-sdk/assert
 */
import { type JSONValue } from '../internal'
export { type JSONValue }
import {
    type LocationInfo,
    offsetAPICaller,
    newLocationInfo,
    columnUnknown,
} from './location'
import { get_tracker_entry, emit_assertion } from './tracker'
import { type AssertType, AssertInfo } from './tracker'

const was_hit = true
const must_be_hit = true
const optionally_hit = false
const expecting_true = true

const universal_test = 'every'
const existential_test = 'some'
const reachability_test = 'none'

/**
 * Assert that condition is true every time this function is called,
 * AND that it is called at least once. This test property will be
 * viewable in the "Antithesis SDK: Always" group of the triage report.
 *
 * @param {string} message will be used as a display name in reporting
 * and should therefore be useful to a broad audience.
 *
 * @param {boolean} condition to be tested.
 *
 * @param {Object} values is used to supply context useful
 * for understanding the reason that condition had the value it did.
 * For instance, in an asertion that x > 5, it could be helpful to send
 * the value of x so failing cases can be better understood.
 */
export const Always = (
    message: string,
    condition: boolean,
    values: JSONValue
) => {
    const location_info = newLocationInfo(offsetAPICaller)
    assertImpl(
        message,
        condition,
        values,
        location_info,
        was_hit,
        must_be_hit,
        expecting_true,
        universal_test
    )
}

/**
 * Assert that condition is true every time this function is called.
 * Unlike the Always function, the test property spawned by AlwaysOrUnreachable
 * will not be marked as failing if the function is never invoked.
 * This test property will be viewable in the "Antithesis SDK: Always"
 * group of the triage report.
 *
 * @param {string} message will be used as a display name in reporting
 * and should therefore be useful to a broad audience.
 *
 * @param {boolean} condition to be tested.
 *
 * @param {Object} values is used to supply context useful
 * for understanding the reason that condition had the value it did.
 * For instance, in an asertion that x > 5, it could be helpful to send
 * the value of x so failing cases can be better understood.
 */
export const AlwaysOrUnreachable = (
    message: string,
    condition: boolean,
    values: JSONValue
) => {
    const location_info = newLocationInfo(offsetAPICaller)
    assertImpl(
        message,
        condition,
        values,
        location_info,
        was_hit,
        optionally_hit,
        expecting_true,
        universal_test
    )
}

/**
 * Assert that condition is true at least one time that this function was called.
 * The test property spawned by Sometimes will be marked as failing if this
 * function is never called, or if condition is false every time that it is called.
 * This test property will be viewable in the "Antithesis SDK: Sometimes" group
 * of the triage report.
 *
 * @param {string} message will be used as a display name in reporting
 * and should therefore be useful to a broad audience.
 *
 * @param {boolean} condition to be tested.
 *
 * @param {Object} values is used to supply context useful
 * for understanding the reason that condition had the value it did.
 * For instance, in an asertion that x > 5, it could be helpful to send
 * the value of x so failing cases can be better understood.
 */
export const Sometimes = (
    message: string,
    condition: boolean,
    values: JSONValue
) => {
    const location_info = newLocationInfo(offsetAPICaller)
    assertImpl(
        message,
        condition,
        values,
        location_info,
        was_hit,
        must_be_hit,
        expecting_true,
        existential_test
    )
}

/**
 * Assert that a line of code is never reached.
 * The test property spawned by Unreachable will be marked as failing if this
 * function is ever called. This test property will be viewable in the
 * "Antithesis SDK: Reachablity assertions" group of the triage report.
 *
 * @param {string} message will be used as a display name in reporting
 * and should therefore be useful to a broad audience.
 *
 * @param {Object} values is used to supply context useful
 * for understanding the reason that condition had the value it did.
 * For instance, in an asertion that x > 5, it could be helpful to send
 * the value of x so failing cases can be better understood.
 */
export const Unreachable = (message: string, values: JSONValue) => {
    const location_info = newLocationInfo(offsetAPICaller)
    assertImpl(
        message,
        true,
        values,
        location_info,
        was_hit,
        optionally_hit,
        expecting_true,
        reachability_test
    )
}

/**
 * Assert that a line of code is reached at least once.
 * The test property spawned by Reachable will be marked as failing if
 * this function is never called. This test property will be viewable
 * in the "Antithesis SDK: Reachablity assertions" group of the
 * triage report.
 *
 * @param {string} message will be used as a display name in reporting
 * and should therefore be useful to a broad audience.
 *
 * @param {Object} values is used to supply context useful
 * for understanding the reason that condition had the value it did.
 * For instance, in an asertion that x > 5, it could be helpful to send
 * the value of x so failing cases can be better understood.
 */
export const Reachable = (message: string, values: JSONValue) => {
    const location_info = newLocationInfo(offsetAPICaller)
    assertImpl(
        message,
        true,
        values,
        location_info,
        was_hit,
        must_be_hit,
        expecting_true,
        reachability_test
    )
}
/** Unwrapped raw assertion access for custom tooling. Not to be called directly.
 */
export const AssertRaw = (
    message: string,
    cond: boolean,
    values: JSONValue,
    classname: string,
    funcname: string,
    filename: string,
    line: number,
    hit: boolean,
    must_hit: boolean,
    expecting: boolean,
    assert_type: AssertType
) => {
    const loc_info = {
        classname,
        ['function']: funcname,
        filename,
        line,
        column: columnUnknown,
    }
    assertImpl(
        message,
        cond,
        values,
        loc_info,
        hit,
        must_hit,
        expecting,
        assert_type
    )
}

const assertImpl = (
    message: string,
    cond: boolean,
    values: JSONValue,
    loc: LocationInfo,
    hit: boolean,
    must_hit: boolean,
    expecting: boolean,
    assert_type: AssertType
) => {
    const message_key = makeKey(loc)
    const tracker_entry = get_tracker_entry(message_key)

    if (tracker_entry) {
        const aI: AssertInfo = {
            hit,
            must_hit,
            assert_type,
            expecting,
            category: '',
            message,
            condition: cond,
            id: message_key,
            location: loc,
            details: values,
        }

        emit_assertion(tracker_entry, aI)
    }
}

const makeKey = (loc: LocationInfo) => {
    return `${loc.filename}|${loc.line}|${loc.column}`
}
