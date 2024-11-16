/**
 * assert - Antithesis SDK
 * @module antithesis-sdk/assert
 */
import type { JSONObject } from '../internal'
import * as internal from '../internal'
import type { LocationInfo } from './location'
import { Tracker } from './tracker'

export type AssertType = 'always' | 'sometimes' | 'reachability'

export const LOCATION_TRACKER: Tracker<string, LocationInfo> = new Tracker()

export function registerAssertion({
    id,
    message,
    location,
    assertType,
    mustHit,
    displayType = defaultDisplayType(assertType, mustHit),
}: {
    id: string
    message: string
    location: LocationInfo
    assertType: AssertType
    mustHit: boolean
    displayType?: string
}) {
    LOCATION_TRACKER.set(id, location)
    internal.output({
        antithesis_assert: {
            id,
            message,
            location: {
                class: location.classname,
                function: location.function,
                file: location.filename,
                begin_line: location.line,
                begin_column: location.column,
            },
            assert_type: assertType,
            must_hit: mustHit,
            display_type: displayType,
            hit: false,
            condition: false,
            details: null,
        },
    })
}

const ASSERTION_TRACKER: Tracker<string, { pass: number; fail: number }> =
    new Tracker()

export function hitAssertion({
    id,
    message,
    location = LOCATION_TRACKER.getOr(id, () => ({
        classname: '',
        function: '',
        filename: '',
        line: 0,
        column: 0,
    })),
    assertType,
    mustHit,
    displayType = defaultDisplayType(assertType, mustHit),
    condition,
    details = {},
}: {
    id: string
    message: string
    location: LocationInfo
    assertType: AssertType
    mustHit: boolean
    displayType?: string
    condition: boolean
    details?: JSONObject
}) {
    const entry = ASSERTION_TRACKER.getOr(id, () => ({ pass: 0, fail: 0 }))
    let emitting: boolean
    if (condition) {
        entry.pass += 1
        emitting = entry.pass === 1
    } else {
        entry.fail += 1
        emitting = entry.fail === 1
    }

    if (emitting) {
        internal.output({
            antithesis_assert: {
                id,
                assert_type: assertType,
                must_hit: mustHit,
                display_type: displayType,
                message,
                location: {
                    class: location.classname,
                    function: location.function,
                    file: location.filename,
                    begin_line: location.line,
                    begin_column: location.column,
                },
                hit: true,
                condition,
                details,
            },
        })
    }
}

function defaultDisplayType(assertType: AssertType, mustHit: boolean): string {
    switch (assertType) {
        case 'always':
            return mustHit ? 'Always' : 'AlwaysOrUnreachable'
        case 'sometimes':
            return 'Sometimes'
        case 'reachability':
            return mustHit ? 'Reachable' : 'Unreachable'
    }
}
