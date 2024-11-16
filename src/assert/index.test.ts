import { expect, test, vi } from 'vitest'
import * as assert from '.'

vi.mock(import('../internal/handler'), () => import('../internal/handler.mock'))
import * as internal from '../internal'
const outputSpy = vi.spyOn(internal, 'output')

const locationMatcher = {
    class: '',
    function: '',
    file: expect.stringMatching(/.*index\.test\.ts/),
    begin_line: expect.any(Number),
    begin_column: expect.any(Number),
}

const assertion = (
    type: 'always' | 'sometimes',
    message: string,
    condition: boolean,
    details: internal.JSONObject
) => ({
    antithesis_assert: {
        id: message,
        message,
        assert_type: type,
        display_type: type === 'always' ? 'Always' : 'Sometimes',
        must_hit: true,
        location: locationMatcher,
        hit: true,
        details,
        condition,
    },
})

const guidance = (
    type: 'numeric' | 'boolean',
    maximize: boolean,
    message: string,
    data: internal.JSONObject
) => ({
    antithesis_guidance: {
        guidance_type: type,
        hit: true,
        id: message,
        message,
        location: locationMatcher,
        maximize,
        guidance_data: data,
    },
})

test('basic assertions', () => {
    outputSpy.mockClear()

    for (let i = 0; i < 10; i += 1) {
        const n = (i % 2 === 0 ? 1 : -1) * i
        assert.always(n > 5, 'basic 1', { n })
        assert.sometimes(n > 5, 'basic 2', { n })
    }

    const events = outputSpy.mock.calls.map(([data]) => data)
    expect(events).toEqual([
        assertion('always', 'basic 1', false, { n: 0 }),
        assertion('sometimes', 'basic 2', false, { n: 0 }),
        assertion('always', 'basic 1', true, { n: 6 }),
        assertion('sometimes', 'basic 2', true, { n: 6 }),
    ])
})

test('rich assertions', () => {
    outputSpy.mockClear()

    for (let i = 0; i < 10; i += 1) {
        const n = (i % 2 === 0 ? 1 : -1) * i
        assert.alwaysGreaterThan(n, 5, 'rich 1', { n })
        assert.sometimesGreaterThan(n, 5, 'rich 2', { n })
    }

    const events = outputSpy.mock.calls.map(([data]) => data)
    const assertionEvents = events.filter(
        (event) => event.antithesis_assert !== undefined
    )
    const guidanceEvents = events.filter(
        (event) => event.antithesis_guidance !== undefined
    )

    expect(assertionEvents).toEqual([
        assertion('always', 'rich 1', false, { n: 0, left: 0, right: 5 }),
        assertion('sometimes', 'rich 2', false, { n: 0, left: 0, right: 5 }),
        assertion('always', 'rich 1', true, { n: 6, left: 6, right: 5 }),
        assertion('sometimes', 'rich 2', true, { n: 6, left: 6, right: 5 }),
    ])

    expect(guidanceEvents).toEqual([
        guidance('numeric', false, 'rich 1', { left: 0, right: 5 }),
        guidance('numeric', true, 'rich 2', { left: 0, right: 5 }),
        guidance('numeric', false, 'rich 1', { left: -1, right: 5 }),
        guidance('numeric', true, 'rich 2', { left: 2, right: 5 }),
        guidance('numeric', false, 'rich 1', { left: -3, right: 5 }),
        guidance('numeric', true, 'rich 2', { left: 4, right: 5 }),
        guidance('numeric', false, 'rich 1', { left: -5, right: 5 }),
        guidance('numeric', true, 'rich 2', { left: 6, right: 5 }),
        guidance('numeric', false, 'rich 1', { left: -7, right: 5 }),
        guidance('numeric', true, 'rich 2', { left: 8, right: 5 }),
        guidance('numeric', false, 'rich 1', { left: -9, right: 5 }),
    ])
})
