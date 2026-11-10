# Changelog

## 0.2.1 - 2026-11-10

- The SDK now requires Node 22 or later.
- Omitted and null assertion/setup details are excluded; explicit empty objects are preserved.
- Events use an empty object for omitted/null details and wrap serialized scalar or array values under `value`.
- Serialization failures report contextual `antithesis_error` records and preserve assertions/events without failed details. Failed guidance is skipped.
- Details serialization replaces non-finite numbers with the strings `"NaN"`, `"Infinity"` or `"-Infinity"`.
- Improved efficiency of all assertion functions.
- Corrected serialization of cycles, sparse arrays, and `toJSON` results while preserving exact bigint digits.
- `randomChoice` is now generic, `randomChoice<T>(things: readonly T[]): T | undefined`, so TypeScript callers see the element type and the `undefined` an empty array yields.
- Rich assertions (`alwaysGreaterThan`, `alwaysSome`, ...) called with no
  details now emit the `left`/`right` or named-bool fields they derive from
  their operands, instead of no details at all.

## 0.2.0 - 2026-08-28

- No longer emits duplicate assertion hits for assert_raw.
- Less biased implementation of random_choice
- Fix: no longer incorrectly emits values larger than 2^53.
- `setupComplete` now gets emitted in a conforming way.
