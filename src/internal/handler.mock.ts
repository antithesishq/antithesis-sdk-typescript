import crypto from 'node:crypto'
import type { CoverageModule, LibHandler } from './handler'

class MockHandler implements LibHandler {
    outputJsonString(_data: string): void {
        return
    }

    randomU64(): bigint {
        return crypto.getRandomValues(new BigUint64Array(1))[0]
    }

    initCoverageModule(
        _edgeCount: number,
        _symbolFileName: string
    ): CoverageModule {
        return { notify(_edge) {} }
    }
}

export const HANDLER = new MockHandler()
