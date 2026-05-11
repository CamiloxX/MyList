import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/features/auth/schemas";
import { addToLibrarySchema, PLATFORMS, watchEntrySchema } from "@/features/library/schemas";

describe("auth.loginSchema", () => {
  it("accepts a valid email + password", () => {
    const result = loginSchema.safeParse({ email: "x@y.com", password: "any" });
    expect(result.success).toBe(true);
  });

  it("rejects malformed emails", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "x@y.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("auth.registerSchema", () => {
  it("accepts a valid signup payload", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "longenough",
      displayName: "Camilo",
    });
    expect(result.success).toBe(true);
  });

  it("rejects passwords shorter than 8 chars", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
      displayName: "Camilo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects display names longer than 50 chars", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "longenough",
      displayName: "x".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty display name", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "longenough",
      displayName: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("library.addToLibrarySchema", () => {
  const validBase = {
    source: "tmdb" as const,
    sourceId: "76479",
    kind: "tv" as const,
    title: "The Boys",
  };

  it("accepts minimal valid payload", () => {
    const result = addToLibrarySchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("defaults genres to an empty array", () => {
    const result = addToLibrarySchema.parse(validBase);
    expect(result.genres).toEqual([]);
  });

  it("accepts both string and number entries in genres", () => {
    const result = addToLibrarySchema.safeParse({
      ...validBase,
      genres: [10765, "Action"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid kind", () => {
    const result = addToLibrarySchema.safeParse({
      ...validBase,
      kind: "movie-tv",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid source", () => {
    const result = addToLibrarySchema.safeParse({
      ...validBase,
      source: "imdb",
    });
    expect(result.success).toBe(false);
  });
});

describe("library.watchEntrySchema", () => {
  const validBase = {
    mediaItemId: "550e8400-e29b-41d4-a716-446655440000",
    watchedOn: "2026-05-10",
  };

  it("accepts a minimal valid entry", () => {
    const result = watchEntrySchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid date format", () => {
    const result = watchEntrySchema.safeParse({
      ...validBase,
      watchedOn: "10/05/2026",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-UUID mediaItemId", () => {
    const result = watchEntrySchema.safeParse({
      ...validBase,
      mediaItemId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts rating from 1 to 10", () => {
    for (const rating of [1, 5, 10]) {
      const result = watchEntrySchema.safeParse({ ...validBase, rating });
      expect(result.success).toBe(true);
    }
  });

  it("rejects rating outside 1-10", () => {
    expect(watchEntrySchema.safeParse({ ...validBase, rating: 0 }).success).toBe(false);
    expect(watchEntrySchema.safeParse({ ...validBase, rating: 11 }).success).toBe(false);
  });

  it("rejects fractional ratings", () => {
    const result = watchEntrySchema.safeParse({ ...validBase, rating: 7.5 });
    expect(result.success).toBe(false);
  });

  it("accepts null rating", () => {
    const result = watchEntrySchema.safeParse({ ...validBase, rating: null });
    expect(result.success).toBe(true);
  });

  it("rejects notes longer than 2000 chars", () => {
    const result = watchEntrySchema.safeParse({
      ...validBase,
      notes: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("library.PLATFORMS", () => {
  it("includes the canonical list with 'Otra' as fallback", () => {
    expect(PLATFORMS).toContain("Netflix");
    expect(PLATFORMS).toContain("Cine");
    expect(PLATFORMS[PLATFORMS.length - 1]).toBe("Otra");
  });
});
