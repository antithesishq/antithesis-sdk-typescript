/**
 * lifecycle - Antithesis SDK
 * @module antithesis-sdk/lifecycle
 */
import { JSONValue } from '../internal'
import * as internal from '../internal'

/**
 * Not associated with assertions, but enables
 * developer-defined events to be emitted.
 */
export const LogEvent = (name: string, event: JSONValue) => {
    internal.output({ [`${name}`]: event })
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
export const SetupComplete = () => {
    LogEvent('setup_status', 'complete')
}
