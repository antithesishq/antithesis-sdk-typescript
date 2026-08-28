import { type CoverageModule, HANDLER } from './handler'

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

// JSON.stringify throws on bigint, and a detour through number would round
// everything above 2^53 — but a bigint's decimal digits are a valid JSON
// integer, so serialize those. Every other case defers to JSON.stringify,
// keeping its escaping, its treatment of non-finite numbers, and its
// undefined conventions (omitted in objects, null in arrays).
function toJsonString(value: JSONValue | undefined): string | undefined {
    if (typeof value === 'bigint') return value.toString()
    if (typeof value !== 'object' || value === null)
        return JSON.stringify(value)
    const toJSON = (value as { toJSON?: unknown }).toJSON
    if (typeof toJSON === 'function')
        return toJsonString(toJSON.call(value) as JSONValue)
    if (Array.isArray(value))
        return `[${value.map((v) => toJsonString(v) ?? 'null').join(',')}]`
    const members: string[] = []
    for (const [k, v] of Object.entries(value)) {
        const encoded = toJsonString(v)
        if (encoded !== undefined)
            members.push(`${JSON.stringify(k)}:${encoded}`)
    }
    return `{${members.join(',')}}`
}

export function output(data: JSONObject) {
    HANDLER.outputJsonString(toJsonString(data) as string)
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

// TODO: The following does not work after TS transpilation, since source files are under `dist/` but not `package.json`.
// import { version as SDK_VERSION } from '../../package.json'
const SDK_VERSION = '0.2.0'
const PROTOCOL_VERSION = '1.1.0'

output({
    antithesis_sdk: {
        language: {
            name: 'JavaScript',
            // TODO: Get JS version
            // version: 'ES2022',
        },
        sdk_version: SDK_VERSION,
        protocol_version: PROTOCOL_VERSION,
    },
})
