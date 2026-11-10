import type { JSONObject, JSONValue } from '../internal'
import * as internal from '../internal'

/**
 * Indicates to Antithesis that a certain event has been reached. It sends a
 * structured log message to Antithesis that you may later use to aid debugging.
 *
 * @param {string} name - The name of the event that is being logged, which will
 * be the top-level key in the generated event object.
 *
 * @param {JSONValue} details - Additional details that provide greater context for
 * the lifecycle event. Omitted or null details produce an empty object payload.
 * Serialized scalar and array values are wrapped as `{ value: details }`.
 * Serialization failures report an antithesis_error and emit an empty payload.
 */
export function sendEvent(name: string, details?: JSONValue) {
    const event: JSONObject = {}
    internal.outputWithDetails(event, event, name, details, name, {
        emptyWhenMissing: true,
    })
}

/**
 * Call this function when your system and workload are fully initialized.
 * After this function is called, the Antithesis environment will take a
 * snapshot of your system and begin
 * <a href="https://antithesis.com/docs/environment/fault_injection/">injecting faults</a>.
 *
 * Calling this function multiple times, or from multiple processes, will
 * have no effect. Antithesis will treat the first time any process called
 * this function as the moment that the setup was completed.
 *
 * @param {JSONObject} details - Additional details that provide greater
 * context for the setup event. Omitted or null details are excluded; an explicit
 * empty object is preserved. Serialization failures report an antithesis_error
 * and still emit setup completion without details.
 */
export function setupComplete(details?: JSONObject | null) {
    const setup: JSONObject = { status: 'complete' }
    internal.outputWithDetails(
        { antithesis_setup: setup },
        setup,
        'details',
        details,
        'setup_complete'
    )
}
