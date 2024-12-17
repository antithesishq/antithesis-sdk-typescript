import type { JSONValue } from '../internal'
import * as internal from '../internal'

/**
 * Indicates to Antithesis that a certain event has been reached. It sends a
 * structured log message to Antithesis that you may later use to aid debugging.
 *
 * @param {string} name - The name of the event that is being logged, which will
 * be the top-level key in the generated event object.
 *
 * @param {JSONValue} details - Additional details that provide greater context for
 * the lifecycle event. Evaluated at runtime.
 */
export function sendEvent(name: string, details: JSONValue) {
    internal.output({ [name]: details })
}

/**
 * Call this function when your system and workload are fully initialized.
 * After this function is called, the Antithesis environment will take a
 * snapshot of your system and begin
 * <a href="https://antithesis.com/docs/applications/reliability/fault_injection.html">injecting faults</a>.
 *
 * Calling this function multiple times, or from multiple processes, will
 * have no effect. Antithesis will treat the first time any process called
 * this function as the moment that the setup was completed.
 */
export function setupComplete() {
    internal.output({ antithesis_setup: 'complete' })
}
