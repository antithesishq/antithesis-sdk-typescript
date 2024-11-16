export type LocationInfo = {
    className?: string
    functionName?: string
    fileName?: string
    line?: number
    column?: number
}

export function locationToJSON(location: LocationInfo) {
    return {
        class: location.className ?? '',
        function: location.functionName ?? '',
        file: location.fileName ?? '',
        begin_line: location.line ?? 0,
        begin_column: location.column ?? 0,
    }
}

// Creates a locationInfo directly from the current execution call stack.
// TODO: Maybe we can also support source maps if they exists?
export function locationAtCallStack(offset = 0): LocationInfo {
    const validOffset = offset < 0 ? 0 : offset
    const oldPrepareStackTrace = Error.prepareStackTrace
    let result: NodeJS.CallSite[] = []
    try {
        Error.prepareStackTrace = (_err, stack) => {
            result = stack
        }
        new Error().stack
    } finally {
        Error.prepareStackTrace = oldPrepareStackTrace
    }
    if (validOffset + 1 >= result.length) return {}
    const site = result[validOffset + 1]
    return {
        className: site.getTypeName() ?? undefined,
        functionName: site.getFunctionName() ?? undefined,
        fileName: site.getFileName(),
        line: site.getLineNumber() ?? undefined,
        column: site.getColumnNumber() ?? undefined,
    }
}
