// JSON.rawJSON and JSON.isRawJSON (V8 11.4, Node 21) are missing from this
// TypeScript's lib. A local declaration keeps the augmentation out of the
// published .d.ts files.
interface JSON {
    rawJSON(text: string): object
    isRawJSON(value: unknown): boolean
}
