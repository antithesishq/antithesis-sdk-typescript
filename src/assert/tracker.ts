export class Tracker<K, V> {
    #tracker: Map<K, V>

    constructor() {
        this.#tracker = new Map()
    }

    set(key: K, val: V) {
        this.#tracker.set(key, val)
    }

    getOr(key: K, init: () => V): V {
        const result = this.#tracker.get(key)
        if (result !== undefined) return result
        const value = init()
        this.#tracker.set(key, value)
        return value
    }
}
