export type StackFrameOffset = number

export const offsetNewLocationInfo: StackFrameOffset = 0
export const offsetHere: StackFrameOffset = 1
export const offsetAPICaller: StackFrameOffset = 2
export const offsetAPICallersCaller: StackFrameOffset = 3

export const columnUnknown = 0

/** LocationInfo represents the attributes known at instrumentation time
 *  for each Antithesis assertion discovered
 */
export type LocationInfo = {
    classname: string
    ['function']: string
    filename: string
    line: number
    column: number
}

// NewLocationInfo creates a locationInfo directly from
// the current execution context
export const newLocationInfo = (nframes: StackFrameOffset) => {
    const loc_info: LocationInfo = {
        classname: '*classname*',
        ['function']: '',
        filename: '',
        line: 0,
        column: 0,
    }
    const e = new Error()
    if (!e.stack) {
        return loc_info
    }

    const regex = /^\s+at\s+(\S*)\s*\((.*):(\d+):(\d+)\)$/
    const match = regex.exec(e.stack.split('\n')[1 + nframes])
    if (match === null || match.length < 5) {
        return loc_info
    }
    const maybe_line = parseInt(match[3])
    const maybe_column = parseInt(match[4])
    loc_info.line = Number.isNaN(maybe_line) ? 0 : maybe_line
    loc_info.column = Number.isNaN(maybe_column) ? columnUnknown : maybe_column

    let classname = ''
    let funcname = match[1]
    const dot_idx = funcname.lastIndexOf('.')
    if (dot_idx >= 0) {
        classname = funcname.substring(0, dot_idx)
        funcname = funcname.slice(dot_idx + 1)
    }

    loc_info.classname = classname
    loc_info['function'] = funcname
    loc_info.filename = match[2]

    return loc_info
}
