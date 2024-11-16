import crypto from 'node:crypto'
import fs from 'node:fs'
import process from 'node:process'
import koffi from 'koffi'

export interface LibHandler {
    outputJsonString(data: string): void
    randomU64(): bigint
}

class VoidstarHandler implements LibHandler {
    #json_data: (msg: Uint8Array, len: number) => void
    #get_random: () => number | bigint
    #flush: () => void

    constructor(
        json_data: (msg: Uint8Array, len: number) => void,
        get_random: () => number | bigint,
        flush: () => void
    ) {
        this.#json_data = json_data
        this.#get_random = get_random
        this.#flush = flush
    }

    outputJsonString(data: string): void {
        // Ensure we are passing in a UTF-8 encoded string.
        const buf = new TextEncoder().encode(data)
        this.#json_data(buf, buf.length)
        this.#flush()
    }

    randomU64(): bigint {
        return BigInt(this.#get_random())
    }

    static load(libPath: string): VoidstarHandler | undefined {
        let lib: koffi.IKoffiLib | undefined
        try {
            lib = koffi.load(libPath)
            const json_data = lib.func(
                'void fuzz_json_data(const uint8_t *data, size_t size)'
            )
            const get_random = lib.func('uint64_t fuzz_get_random()')
            const flush = lib.func('void fuzz_flush()')
            return new VoidstarHandler(json_data, get_random, flush)
        } catch (_e) {
            if (lib !== undefined) lib.unload()
            console.log(`Failed to load library at ${libPath}`)
            return undefined
        }
    }
}

class LocalHandler implements LibHandler {
    #fd: number

    constructor(fd: number) {
        this.#fd = fd
    }

    outputJsonString(data: string): void {
        fs.writeSync(this.#fd, `${data}\n`)
        fs.fstatSync(this.#fd)
    }

    randomU64(): bigint {
        const array = new BigUint64Array(1)
        crypto.getRandomValues(array)
        return array[0]
    }

    static load(outputPathVar: string): LocalHandler | undefined {
        try {
            const outputPath = process.env[outputPathVar]
            if (outputPath === undefined) return undefined
            const fd = fs.openSync(outputPath, 'w')
            return new LocalHandler(fd)
        } catch (_e) {
            return undefined
        }
    }
}

class NoOpHandler implements LibHandler {
    outputJsonString(_: string): void {}

    randomU64(): bigint {
        const array = new BigUint64Array(1)
        crypto.getRandomValues(array)
        return array[0]
    }
}

const ANTITHESIS_OUTPUT_VAR: string = 'ANTITHESIS_SDK_LOCAL_OUTPUT'
const LIBVOIDSTAR_PATH: string = '/usr/lib/libvoidstar.so'

export const HANDLER: LibHandler =
    VoidstarHandler.load(LIBVOIDSTAR_PATH) ??
    LocalHandler.load(ANTITHESIS_OUTPUT_VAR) ??
    new NoOpHandler()
