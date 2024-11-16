import crypto from 'node:crypto'
import fs from 'node:fs'
import process from 'node:process'
import koffi from 'koffi'

export interface LibHandler {
    // Logging out a message string, assuming it is JSON encoded.
    outputJsonString(data: string): void
    // Randomly generate an unsigned 64-bit integer with uniform distribution.
    randomU64(): bigint
}

class LibVoidstar {
    // `message` should contain a UTF-8 encoded string,
    // and `length` must be the length (in bytes) of `message`.
    json_data: (message: Uint8Array, length: number) => void
    // Returns a 64-bit unsigned integer, using the appropriate numeric type (`koffi` behavior)
    get_random: () => number | bigint
    flush: () => void

    constructor(lib: koffi.IKoffiLib) {
        // NOTE: The `data` parameter is actually typed as `const char *`,
        // but with that `koffi` would expect us passing in a JS string (which is UTF-16)
        // and automatically perform UTF-16 to UTF-8 conversion and append a null byte,
        // which is different from the buffer + length convention `fuzz_json_data` expects.
        // Instead we use the equivalent `const uint8_t *` to allow direct passing of a `Uint8Array`,
        // without extra processing from `koffi`.
        // We then need to perform the UTF-8 conversion ourselves, which is necessary anyway
        // since we also have to calculate the `size` parameter in terms of UTF-8 byte length.
        // NOTE: `size` being `size_t` can be in the range of `bigint`,
        // but since it is an input parameter,
        // and our message should never have a length larger than `Number.MAX_SAFE_INTEGER`,
        // we can safely type it as `number` in JS.
        this.json_data = lib.func(
            'void fuzz_json_data(const uint8_t *data, size_t size)'
        )
        this.get_random = lib.func('uint64_t fuzz_get_random()')
        this.flush = lib.func('void fuzz_flush()')
    }
}

class VoidstarHandler implements LibHandler {
    #lib: LibVoidstar

    constructor(libvoidstar: LibVoidstar) {
        this.#lib = libvoidstar
    }

    outputJsonString(data: string): void {
        // Ensure we are passing in a UTF-8 encoded string.
        const buf = new TextEncoder().encode(data)
        this.#lib.json_data(buf, buf.length)
        this.#lib.flush()
    }

    randomU64(): bigint {
        return BigInt(this.#lib.get_random())
    }

    static load(libPath: string): VoidstarHandler | undefined {
        let lib: koffi.IKoffiLib | undefined
        try {
            lib = koffi.load(libPath)
            return new VoidstarHandler(new LibVoidstar(lib))
        } catch (_e) {
            if (lib !== undefined) lib.unload()
            console.log(
                `Failed to load libvoidstar at ${libPath}, falling back...`
            )
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
        // TODO: We might want to look into the performance of this approach.
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
        // TODO: We might want to look into the performance of this approach.
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