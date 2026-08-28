import { expect, test, vi } from 'vitest'
import { sendEvent, setupComplete } from './lifecycle'

vi.mock(import('../internal/handler'), () => import('../internal/handler.mock'))
import { HANDLER } from '../internal/handler'
const outputSpy = vi.spyOn(HANDLER, 'outputJsonString')

test('', () => {
    setupComplete()
    setupComplete({ version: '1.2.3', big: 9007199254740993n })
    sendEvent('tag', false)
    sendEvent('tag', [1, 'str', true, {}])

    // The bigint detail (2^53 + 1) must reach the wire digit-exact, which
    // JSON.parse here would round away — so compare that call as text.
    expect(outputSpy.mock.calls[1][0]).toBe(
        '{"antithesis_setup":{"status":"complete","details":{"version":"1.2.3","big":9007199254740993}}}',
    )

    const events = outputSpy.mock.calls.map(([data]) => JSON.parse(data))
    expect(events).toEqual([
        { antithesis_setup: { status: 'complete', details: {} } },
        expect.anything(),
        { tag: false },
        { tag: [1, 'str', true, {}] },
    ])
})
