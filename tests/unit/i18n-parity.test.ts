import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";

/** Flattens a messages object into dot-separated key paths. */
function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === "object"
      ? collectKeys(value as Record<string, unknown>, path)
      : [path];
  });
}

describe("i18n message parity", () => {
  it("es.json and en.json expose exactly the same keys", () => {
    const esKeys = collectKeys(es).sort();
    const enKeys = collectKeys(en).sort();

    const missingInEn = esKeys.filter((k) => !enKeys.includes(k));
    const missingInEs = enKeys.filter((k) => !esKeys.includes(k));

    // Report the exact drifted keys instead of a giant array diff.
    expect(missingInEn, "keys present in es.json but missing in en.json").toEqual([]);
    expect(missingInEs, "keys present in en.json but missing in es.json").toEqual([]);
  });
});
