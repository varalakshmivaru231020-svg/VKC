import { describe, expect, it, vi } from "vitest";

// products.ts imports the Prisma client at module load; the price helper under
// test is pure, so the database is stubbed out.
vi.mock("@/lib/db", () => ({ db: {} }));

import { salePriceFilter } from "./products";

describe("salePriceFilter", () => {
  it("keeps BOTH bounds when a range is set (the minimum used to be dropped)", () => {
    expect(salePriceFilter(500, 1000)).toEqual({ salePrice: { gte: 500, lte: 1000 } });
  });

  it("handles a single bound", () => {
    expect(salePriceFilter(200, undefined)).toEqual({ salePrice: { gte: 200 } });
    expect(salePriceFilter(undefined, 999)).toEqual({ salePrice: { lte: 999 } });
  });

  it("adds no condition when neither bound is given", () => {
    expect(salePriceFilter()).toEqual({});
  });

  it("keeps a zero minimum, which is a real bound", () => {
    expect(salePriceFilter(0, 500)).toEqual({ salePrice: { gte: 0, lte: 500 } });
  });

  it("ignores a NaN bound (a garbled query string) instead of sending it to the database", () => {
    expect(salePriceFilter(Number.NaN, 500)).toEqual({ salePrice: { lte: 500 } });
    expect(salePriceFilter(Number.NaN, Number.NaN)).toEqual({});
  });
});
