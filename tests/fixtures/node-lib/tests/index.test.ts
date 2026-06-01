import { describe, expect, it } from "vitest";
import { greet } from "../src/index.js";

describe("greet", () => {
  it("returns greeting", () => {
    expect(greet("world")).toBe("Hello, world!");
  });
});
