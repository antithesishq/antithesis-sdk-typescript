// Details behaviour the cross-SDK conformance harness cannot reach: toJSON
// and getter semantics, the rich assertions' merging and diagnostics through
// the high-level API, a `__proto__` event name, and transport failures. The
// wire shape and the diagnostic text for the raw entry points are the
// harness's job, and JSON.stringify's own contract is not ours to test.
import { beforeEach, expect, test, vi } from 'vitest'
import { always, alwaysGreaterThan, alwaysSome } from './assert'
import { sendEvent, setupComplete } from './lifecycle'
import { type JSONObject, resetDiagnostics } from './internal'

vi.mock(import('./internal/handler'), () => import('./internal/handler.mock'))
import { HANDLER } from './internal/handler'
const outputSpy = vi.spyOn(HANDLER, 'outputJsonString')
const records = () => outputSpy.mock.calls.map(([text]) => JSON.parse(text))
const kinds = () => records().map((record) => Object.keys(record)[0])
const object = (value: unknown) => value as JSONObject
beforeEach(() => {
    outputSpy.mockClear()
    resetDiagnostics()
})

test('toJSON determines details shape and runs once per emission', () => {
    const toJSON = vi.fn(() => 3)
    always(true, 'custom scalar', object({ toJSON }))
    always(true, 'custom scalar', object({ toJSON }))
    expect(toJSON).toHaveBeenCalledTimes(1)
    expect(records()[0].antithesis_assert.details).toEqual({ value: 3 })
    setupComplete(object({ toJSON: () => null }))
    sendEvent('custom undefined', object({ toJSON: () => undefined }))
    sendEvent('date', object(new Date('2026-01-01T00:00:00Z')))
    expect(records().slice(1)).toEqual([
        { antithesis_setup: { status: 'complete' } },
        { 'custom undefined': {} },
        { date: { value: '2026-01-01T00:00:00.000Z' } },
    ])
})

test('rich assertions defer reading details and preserve caller objects', () => {
    const read = vi.fn(() => 7)
    const details = {
        get extra() {
            return read()
        },
        left: 100,
    }
    alwaysGreaterThan(2, 1, 'rich details', details)
    alwaysGreaterThan(2, 1, 'rich details', details)
    expect(read).toHaveBeenCalledTimes(1)
    expect(records()[0].antithesis_assert.details).toEqual({
        extra: 7,
        left: 2,
        right: 1,
    })
    expect(details.left).toBe(100)
    expect(details).not.toHaveProperty('right')
})

test('rich assertions emit their generated fields with no caller details', () => {
    // A bag that is absent is not a bag that failed: there is simply nothing
    // to merge over, so the fields the assertion derived from its own
    // operands still reach the wire. Dropping them here would lose the whole
    // point of the rich assertion on its most common call shape.
    alwaysGreaterThan(2, 1, 'rich no details')
    alwaysGreaterThan(4, 3, 'rich explicit null', null)
    alwaysSome({ p: true }, 'rich bool no details')
    alwaysSome({}, 'rich bool empty set')
    const assertions = records()
        .filter((r) => 'antithesis_assert' in r)
        .map((r) => r.antithesis_assert.details)
    expect(assertions).toEqual([
        { left: 2, right: 1 },
        { left: 4, right: 3 },
        { p: true },
        {},
    ])
})

test('rich details failures preserve the assertion and successful guidance', () => {
    alwaysGreaterThan(2, 1, 'rich failure', {
        get extra(): number {
            throw new Error('bad details')
        },
    })
    expect(records()).toHaveLength(3)
    expect(records()[0]).toHaveProperty('antithesis_error')
    expect(records()[1].antithesis_assert).not.toHaveProperty('details')
    expect(records()[2].antithesis_guidance.guidance_data).toEqual({
        left: 2,
        right: 1,
    })
})

test('rich assertions skip non-finite guidance with one warning per process', () => {
    alwaysGreaterThan(NaN, 1, 'non-finite operand')
    alwaysGreaterThan(-Infinity, 1, 'non-finite operand')
    alwaysGreaterThan(2, 1, 'non-finite operand')
    expect(kinds()).toEqual([
        'antithesis_warning',
        'antithesis_assert',
        'antithesis_warning',
        'antithesis_assert',
        'antithesis_guidance',
    ])
    expect(records()[0].antithesis_warning.code).toBe(6002)
    expect(records()[2].antithesis_warning).toMatchObject({
        code: 6004,
        context: 'non-finite operand',
    })
    expect(records()[4].antithesis_guidance.guidance_data).toEqual({
        left: 2,
        right: 1,
    })
})

test('event names are verbatim and details stay reusable', () => {
    const details = Object.freeze({ x: 1 })
    sendEvent('__proto__', details)
    sendEvent('', details)
    expect(records()[0]).toHaveProperty('__proto__', { x: 1 })
    expect(records()[1]).toEqual({ '': { x: 1 } })
})

test('transport failures are not relabeled as serialization errors', () => {
    outputSpy.mockImplementationOnce(() => {
        throw new Error('transport')
    })
    expect(() => sendEvent('transport', {})).toThrow('transport')
    expect(outputSpy).toHaveBeenCalledTimes(1)
})
