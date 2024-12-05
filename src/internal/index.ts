import { type CoverageModule, HANDLER } from './handler'

export type JSONObject = { [x: string]: JSONValue | undefined }
export type JSONArray = Array<JSONValue>
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
