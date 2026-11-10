import * as internal from '../internal'
import { type LocationInfo, locationToJSON } from './location'
import { Tracker } from './tracker'

class NumericGuard {
    // Undefined until the first hit
    #mark: number | undefined
    #maximize: boolean

    constructor(maximize: boolean) {
        this.#maximize = maximize
    }

    shouldEmit(value: number) {
        if (
            this.#mark !== undefined &&
            (this.#maximize ? this.#mark >= value : this.#mark <= value)
        )
            return false

        this.#mark = value
        return true
    }
}

const NUMERIC_GUARDS: Tracker<string, NumericGuard> = new Tracker()

export type GuidanceData = {
    numeric: { left: number; right: number }
    boolean: { [key: string]: boolean }
}

export type GuidanceType = keyof GuidanceData

export const registerGuidance = ({
    id,
    message,
    location,
    guidanceType,
    maximize,
}: {
    id: string
    message: string
    location: LocationInfo
    guidanceType: GuidanceType
    maximize: boolean
}) => {
    internal.output({
        antithesis_guidance: {
            id,
            message,
            location: locationToJSON(location),
            guidance_type: guidanceType,
            maximize,
            hit: false,
        },
    })
}

export const hitGuidance = <T extends GuidanceType>(
    args: T extends unknown
        ? {
              id: string
              message: string
              location: LocationInfo
              guidanceType: T
              maximize: boolean
              data: GuidanceData[T]
          }
        : never
) => {
    const { id, message, location, guidanceType, maximize, data } = args
    if (guidanceType === 'numeric') {
        if (!Number.isFinite(data.left) || !Number.isFinite(data.right)) {
            internal.nonFiniteGuidanceWarning(id)
            return
        }
        const guard = NUMERIC_GUARDS.getOr(id, () => new NumericGuard(maximize))
        if (!guard.shouldEmit(data.left - data.right)) return
    }

    internal.outputGuidance(
        {
            antithesis_guidance: {
                id,
                message,
                location: locationToJSON(location),
                guidance_type: guidanceType,
                maximize,
                hit: true,
                guidance_data: data,
            },
        },
        id
    )
}
