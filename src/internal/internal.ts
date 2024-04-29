import koffi from 'koffi'

import { env, hrtime } from 'node:process'
import { fsyncSync, openSync, writeSync } from 'node:fs'

const defaultNativeLibraryPath = '/usr/lib/libvoidstar.so'
export const LocalOutputEnvVar = 'ANTITHESIS_SDK_LOCAL_OUTPUT'

type MaybeError = Error | undefined

export type JSONValue =
    | string
    | number
    | boolean
    | null
    | { [x: string]: JSONValue }
    | Array<JSONValue>

export type LocalLogInfo = {
    ticks: number
    time: string
    source: string
    stream: string
    // output_text: string
}

// --------------------------------------------------------------------------------
// Base SDK Handler
//
// Defines the methods common to VoidstarSDKHandler and LocalSDKHandler
// --------------------------------------------------------------------------------
const Base_Constructor_key = Symbol('base_key')
abstract class BaseSDKHandler {
    constructor(k: symbol) {
        if (k !== Base_Constructor_key) {
            throw new Error(
                'Can not constuct a BaseSDKHandler instance this way'
            )
        }
    }
    abstract No_emit(): boolean
    abstract Json_data(name: string, obj: JSONValue): void
    abstract Flush(): void
    abstract Get_random(): number
    abstract Set_source_name(name: string): void
}

// --------------------------------------------------------------------------------
// Local SDK Handler
// --------------------------------------------------------------------------------
const Local_Constructor_key = Symbol('local_key')
class LocalSDKHandler extends BaseSDKHandler {
    #out_fd: number
    #can_be_opened: boolean
    #start_time: bigint
    #source_name: string

    constructor(k: symbol) {
        if (k !== Local_Constructor_key) {
            throw new Error(
                'Can not construct a LocalSDKHandler instance this way'
            )
        }
        super(Base_Constructor_key)
        this.#out_fd = 0
        this.#can_be_opened = true
        this.#start_time = hrtime.bigint()
        this.#source_name = ''
    }

    No_emit() {
        if (!this.#can_be_opened) {
            return true
        }
        if (this.#out_fd === 0) {
            const maybe_path = (env[LocalOutputEnvVar] ?? '').trim()
            if (maybe_path.length === 0) {
                this.#can_be_opened = false
                return true
            }
            const err = this.#can_open_to_write(maybe_path)
            if (err) {
                console.error('ANTILOG_OUTPUT error', err.message)
                this.#can_be_opened = false
                return true
            }
        }
        return false
    }

    Flush() {
        // intentionally NOP
    }

    Get_random() {
        const largest_int = Number.MAX_SAFE_INTEGER
        return Math.floor(Math.random() * largest_int)
    }

    Set_source_name(name: string) {
        return (this.#source_name = name)
    }

    // Golang format's ticks as "%ld" int64
    // Here we use the Javascript string when representing as JSON
    #get_ticks() {
        const now_big = hrtime.bigint()
        const big_ticks = now_big - this.#start_time
        if (big_ticks <= Number.MAX_SAFE_INTEGER) {
            return Number(big_ticks)
        }
        return Number.MAX_SAFE_INTEGER
    }

    // Golang format: 2021-12-12 09:10:00 +0000 UTC
    // Here we use the Javascript simplified ISO 8601
    #get_time() {
        return new Date().toISOString()
    }

    #get_source_name() {
        return this.#source_name
    }

    #can_open_to_write(filepath: string): MaybeError {
        const trimmed_path = filepath.trim()
        if (trimmed_path.length === 0) {
            return new Error('No filepath provided')
        }
        try {
            this.#out_fd = openSync(filepath, 'w')
        } catch (err) {
            if (err instanceof Error) {
                return err
            }
            return new Error(`Unable to open: '${filepath}'`)
        }
        return
    }

    #log_info(name: string, obj: JSONValue) {
        const log_info: LocalLogInfo = {
            ticks: this.#get_ticks(),
            time: this.#get_time(),
            source: this.#get_source_name(),
            stream: 'sdk',
            [name]: obj,
        }
        return log_info
    }

    Json_data(name: string, obj: JSONValue) {
        if (this.No_emit()) {
            return
        }
        try {
            const log_obj = this.#log_info(name, obj)
            const payload = JSON.stringify(log_obj)
            writeSync(this.#out_fd, payload + '\n')
            fsyncSync(this.#out_fd)
        } catch (err) {
            console.log(err)
        }
        return
    }

    static _instance = new LocalSDKHandler(Local_Constructor_key)
}

const local_handler = LocalSDKHandler._instance

// --------------------------------------------------------------------------------
// Voidstar SDK Handler
// --------------------------------------------------------------------------------
const Voidstar_Constructor_key = Symbol('voidstar_key')
class VoidstarSDKHandler extends BaseSDKHandler {
    #libvoidstar?: koffi.IKoffiLib = void 0
    #fuzz_json_data?: koffi.KoffiFunction = void 0
    #fuzz_get_random?: koffi.KoffiFunction = void 0
    #fuzz_flush?: koffi.KoffiFunction = void 0
    #fuzz_set_source_name?: koffi.KoffiFunction = void 0

    constructor(k: symbol) {
        if (k !== Voidstar_Constructor_key) {
            throw new Error(
                'Can not constuct a VoidstarSDKHandler instance this way'
            )
        }
        super(Base_Constructor_key)
        try {
            this.#libvoidstar = koffi.load(defaultNativeLibraryPath)
            this.#fuzz_json_data = this.#libvoidstar.func(
                'void fuzz_json_data(const char *data, size_t size)'
            )
            this.#fuzz_get_random = this.#libvoidstar.func(
                'uint64_t fuzz_get_random()'
            )
            this.#fuzz_flush = this.#libvoidstar.func('void fuzz_flush()')
            this.#fuzz_set_source_name = this.#libvoidstar.func(
                'void fuzz_set_source_name(const char *name)'
            )
        } catch (erx) {
            if (this.#libvoidstar) {
                this.#libvoidstar.unload()
            }
            this.#libvoidstar = void 0
            this.#fuzz_json_data = void 0
            this.#fuzz_get_random = void 0
            this.#fuzz_flush = void 0
            this.#fuzz_set_source_name = void 0
            console.log(`Unable to access ${defaultNativeLibraryPath}'`)
        }
    }

    No_emit() {
        return !this.#libvoidstar
    }

    Json_data(name: string, obj: JSONValue) {
        if (this.#fuzz_json_data) {
            const log_obj = { [name]: obj }
            const payload = JSON.stringify(log_obj)
            this.#fuzz_json_data(payload, payload.length)
            this.Flush()
        }
    }

    Get_random() {
        if (this.#fuzz_get_random) {
            return this.#fuzz_get_random()
        }
        return 0
    }

    Set_source_name(name: string) {
        if (this.#fuzz_set_source_name) {
            this.#fuzz_set_source_name(name)
        }
    }

    Flush() {
        if (this.#fuzz_flush) {
            this.#fuzz_flush()
        }
    }

    static _instance = new VoidstarSDKHandler(Voidstar_Constructor_key)
} // class VoidstarSDKHandler

const voidstar_handler = VoidstarSDKHandler._instance

// --------------------------------------------------------------------------------
//  libvstar - exported for SDK use
// --------------------------------------------------------------------------------
export const libvstar = voidstar_handler.No_emit()
    ? local_handler
    : voidstar_handler
