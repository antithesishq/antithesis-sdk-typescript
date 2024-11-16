import crypto from 'node:crypto'
import type { LibHandler } from './handler'

class MockHandler implements LibHandler {
    outputJsonString(_data: string): void {
        return
    }

    randomU64(): bigint {
        return crypto.getRandomValues(new BigUint64Array(1))[0]
    }
}

export const HANDLER = new MockHandler()
