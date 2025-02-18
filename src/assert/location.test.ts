import { expect, test } from 'vitest'
import { locationAtCallStack, locationToJSON } from './location'

test('location extraction through call stack', () => {
    const locMatcher = {
        file: expect.stringMatching(/.*location\.test\.ts/),
        begin_line: expect.any(Number),
        begin_column: expect.any(Number),
    }

    const location = locationAtCallStack()
    expect.soft(locationToJSON(location)).toEqual({
        class: '',
        function: '',
        ...locMatcher,
    })

    class A {
        f() {
            const location1 = locationAtCallStack()
            expect.soft(locationToJSON(location1)).toEqual({
                class: 'A',
                function: 'f',
                ...locMatcher,
            })

            const location2 = locationAtCallStack(1)
            expect.soft(locationToJSON(location2)).toEqual({
                class: '',
                function: '',
                ...locMatcher,
            })
        }
    }

    new A().f()
})
