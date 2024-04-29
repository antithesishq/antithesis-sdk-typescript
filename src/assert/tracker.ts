import { type LocationInfo } from './location'
import { libvstar, JSONValue } from '../internal'

export type AssertType = 'every' | 'some' | 'none'

export type AssertInfo = {
    hit: boolean
    must_hit: boolean
    assert_type: AssertType
    expecting: boolean
    category: string
    message: string
    condition: boolean
    id: string
    location: LocationInfo
    details: JSONValue // Map<string, JSONValue>
}

type TrackerInfo = {
    pass_count: number
    fail_count: number
}

type MaybeTrackerInfo = TrackerInfo | undefined

const assert_info_tag = 'antithesis_assert'

// assert_tracker (global) keeps track of the unique asserts evaluated
export const assert_tracker: Map<string, TrackerInfo> = new Map()

export const get_tracker_entry = (message_key: string): MaybeTrackerInfo => {
    if (!(assert_tracker instanceof Map)) {
        return undefined
    }
    let tracker_entry: MaybeTrackerInfo = assert_tracker.get(message_key)
    if (!tracker_entry) {
        tracker_entry = {
            pass_count: 0,
            fail_count: 0,
        }
        assert_tracker.set(message_key, tracker_entry)
    }
    return tracker_entry
}

export const emit_assertion = (ti: TrackerInfo, ai: AssertInfo) => {
    const cond = ai.condition
    if (cond) {
        if (ti.pass_count === 0) {
            do_emit(ai)
        }
        ti.pass_count++
        return
    }
    if (ti.fail_count === 0) {
        do_emit(ai)
    }
    ti.fail_count++
    return
}

const do_emit = (ai: AssertInfo) => {
    libvstar.Json_data(assert_info_tag, { ...ai })
}
