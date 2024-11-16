/**
 * assert - Antithesis SDK
 * @module antithesis-sdk/assert
 */
import type { JSONObject } from '../internal'
import * as internal from '../internal'
import { type LocationInfo, locationToJSON } from './location'
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
            location: locationToJSON(location),
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
    location = LOCATION_TRACKER.getOr(id, () => ({})),
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
                message,
                location: locationToJSON(location),
                assert_type: assertType,
                must_hit: mustHit,
                display_type: displayType,
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
