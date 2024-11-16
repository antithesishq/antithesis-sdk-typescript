import { expect, test, vi } from 'vitest'
import { sendEvent, setupComplete } from './lifecycle'

vi.mock(import('../internal/handler'), () => import('../internal/handler.mock'))
import { HANDLER } from '../internal/handler'
const outputSpy = vi.spyOn(HANDLER, 'outputJsonString')

test('', () => {
    setupComplete()
    sendEvent('tag', false)
    sendEvent('tag', [1, 'str', true, {}])

    const events = outputSpy.mock.calls.map(([data]) => JSON.parse(data))
    expect(events).toEqual([
        { antithesis_setup: 'complete' },
        { tag: false },
        { tag: [1, 'str', true, {}] },
    ])
})
