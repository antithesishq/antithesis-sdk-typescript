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
