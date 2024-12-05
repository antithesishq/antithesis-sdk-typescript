import { type CoverageModule, HANDLER } from './handler'

export type JSONObject = { [x: string]: JSONValue | undefined }
export type JSONArray = JSONValue[]
export type JSONValue =
    | string
    | number
    | boolean
    | null
    | JSONObject
    | JSONArray

export function output(data: JSONObject) {
    const msg = JSON.stringify(data)
    HANDLER.outputJsonString(msg)
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

import { version as SDK_VERSION } from '../../package.json'
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
