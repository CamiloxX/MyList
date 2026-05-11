// Stub for `server-only` package used in unit tests.
// The real module throws on import outside of an RSC build, which is what we
// want at runtime — but for Node-based unit tests, we just want a no-op.
export {};
