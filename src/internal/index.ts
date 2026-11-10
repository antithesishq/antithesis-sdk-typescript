import process from 'node:process'
import { isNumberObject } from 'node:util/types'

import { type CoverageModule, HANDLER } from './handler'
// Generated from package.json by scripts/write-version.js (a prepare,
// prebuild and pretest hook), so the header carries the package version as
// a literal that survives any bundler.
import { SDK_VERSION } from './version'

export type JSONObject = { [x: string]: JSONValue | undefined }
export type JSONArray = JSONValue[]
export type JSONValue =
    | string
    | number
    | boolean
    | bigint
    | null
    | JSONObject
    | JSONArray

// JSON.stringify throws on bigint, but a bigint's decimal digits are a valid JSON
// integer, so emit those verbatim.
function bigintReplacer(_key: string, value: unknown): unknown {
    return typeof value === 'bigint' ? JSON.rawJSON(value.toString()) : value
}

// Integers beyond this reach the wire exactly, but a consumer that parses
// JSON numbers as doubles rounds them.
const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER)
let warnedNonFinite = false
let warnedUnsafeInteger = false
let warnedNonFiniteGuidance = false

function serializationError(context: string, error: unknown) {
    let reason = 'unknown serialization error'
    try {
        reason = String(error instanceof Error ? error.message : error) || reason
    } catch {
        // Even an exception's string conversion can be user code.
    }
    output({
        antithesis_error: {
            code: 6001,
            // The context (an event name, assertion id, or "setup_complete")
            // is inserted verbatim, like every SDK's message:
            // JSON.stringify would escape control characters in a
            // JSON-string dialect the other SDKs don't use.
            message: `JavaScript SDK failed to serialize details for "${context}": ${reason}`,
            context,
        },
    })
}

function serializationWarning(code: number, message: string, context: string) {
    output({ antithesis_warning: { code, message, context } })
}

export function nonFiniteGuidanceWarning(context: string) {
    if (warnedNonFiniteGuidance) return
    warnedNonFiniteGuidance = true
    serializationWarning(
        6004,
        `JavaScript SDK skipped numeric guidance for "${context}" because an operand was not finite; later occurrences in this process are not reported`,
        context
    )
}

// Tests share one module instance, so they need a way back to a fresh process.
export function resetDiagnostics() {
    warnedNonFinite = warnedUnsafeInteger = warnedNonFiniteGuidance = false
}

export function output(data: JSONObject) {
    HANDLER.outputJsonString(JSON.stringify(data, bigintReplacer))
}

// Event names are arbitrary strings, so the field must be defined rather
// than assigned.
function setField(container: JSONObject, field: string, value: unknown) {
    Object.defineProperty(container, field, {
        value,
        enumerable: true,
        writable: true,
        configurable: true,
    })
}

export function outputWithDetails(
    envelope: JSONObject,
    container: JSONObject,
    field: string,
    details: JSONValue | undefined,
    context: string,
    {
        emptyWhenMissing = false,
        guidanceDetails,
        dropOnError = false,
    }: {
        emptyWhenMissing?: boolean
        guidanceDetails?: JSONObject
        dropOnError?: boolean
    } = {}
) {
    // setField exists so a caller-chosen key such as `__proto__` is never
    // assigned; a property the container already owns with this value needs
    // no such care, and redefining it costs about ten times a plain write.
    if (
        !Object.prototype.hasOwnProperty.call(container, field) ||
        container[field] !== details
    )
        setField(container, field, details)
    // The replacer sees every serialized value exactly once, so it also notes
    // the two lossy kinds of number as it passes them. It looks at the whole
    // envelope rather than only the details subtree: the other fields are
    // SDK-built and finite, so only details can set these.
    let nonFinite = false
    let unsafeInteger = false
    let text: string
    try {
        text = JSON.stringify(
            envelope,
            function (this: unknown, key: string, value: unknown): unknown {
                // JSON.stringify unboxes Numbers after the replacer. Do it
                // here so non-finite values remain visible, using its same
                // ToNumber conversion (including user-defined coercion). The
                // typeof gate keeps the native call off the primitive-heavy path.
                if (
                    typeof value === 'object' &&
                    value !== null &&
                    isNumberObject(value)
                )
                    value = +(value as number)
                if (this === container && key === field) {
                    // JSON.stringify has already applied the caller's toJSON,
                    // once; what it returns here is not passed through toJSON
                    // again, so the shape decision happens on the final value.
                    if (value == null) {
                        if (guidanceDetails !== undefined)
                            return { ...guidanceDetails }
                        return emptyWhenMissing ? {} : undefined
                    }
                    const object =
                        typeof value !== 'object' ||
                        Array.isArray(value) ||
                        JSON.isRawJSON(value)
                            ? { value }
                            : (value as JSONObject)
                    return guidanceDetails
                        ? { ...object, ...guidanceDetails }
                        : object
                }
                // JSON has no spelling for NaN or the infinities;
                // JSON.stringify would write null.
                if (typeof value === 'number' && !Number.isFinite(value)) {
                    nonFinite = true
                    return String(value)
                }
                if (
                    typeof value === 'bigint' &&
                    (value > MAX_SAFE_INTEGER || value < -MAX_SAFE_INTEGER)
                )
                    unsafeInteger = true
                return bigintReplacer(key, value)
            }
        )
    } catch (error) {
        serializationError(context, error)
        if (dropOnError) return
        setField(container, field, emptyWhenMissing ? {} : undefined)
        text = JSON.stringify(envelope, bigintReplacer)
        // A failed serialization reports only the error.
        nonFinite = unsafeInteger = false
    }
    // Warnings precede the packet they describe. Keep transport failures
    // outside the serialization catch: retrying them as details errors could
    // duplicate output and obscure the actual failure.
    if (nonFinite && !warnedNonFinite) {
        warnedNonFinite = true
        serializationWarning(
            6002,
            `JavaScript SDK replaced non-finite numbers in details for "${context}" with the strings "NaN", "Infinity" or "-Infinity"; later occurrences in this process are not reported`,
            context
        )
    }
    if (unsafeInteger && !warnedUnsafeInteger) {
        warnedUnsafeInteger = true
        serializationWarning(
            6003,
            `JavaScript SDK emitted integers beyond ±2^53 in details for "${context}"; consumers that parse JSON numbers as doubles will round them; later occurrences in this process are not reported`,
            context
        )
    }
    HANDLER.outputJsonString(text)
}

export function outputGuidance(data: JSONObject, context: string) {
    const guidance = data.antithesis_guidance as JSONObject
    outputWithDetails(
        data,
        guidance,
        'guidance_data',
        guidance.guidance_data,
        context,
        { dropOnError: true }
    )
}

export function randomU64(): bigint {
    return HANDLER.randomU64()
}

export function initCoverageModule(
    edgeCount: number,
    symbolFileName: string
): CoverageModule {
    return HANDLER.initCoverageModule(edgeCount, symbolFileName)
}

const PROTOCOL_VERSION = '1.1.0'

output({
    antithesis_sdk: {
        language: {
            name: 'JavaScript',
            version: process.version,
        },
        sdk_version: SDK_VERSION,
        protocol_version: PROTOCOL_VERSION,
    },
})
