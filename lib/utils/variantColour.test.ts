import { describe, expect, it } from "vitest";
import { PLACEHOLDER_COLOUR_HEX, productHasChosenColours, productUsesPackSizes } from "./variantColour";

const size = (colorName: string) => ({ colorName, colorHex: PLACEHOLDER_COLOUR_HEX, colorHex2: null });

describe("productUsesPackSizes", () => {
  it("treats labelled variants with the placeholder swatch as pack sizes", () => {
    expect(productUsesPackSizes([size("500 g"), size("1 kg")])).toBe(true);
  });

  it("is false for an untouched single variant", () => {
    expect(productUsesPackSizes([size("")])).toBe(false);
  });

  it("is false once any variant has a swatch the admin picked", () => {
    expect(productUsesPackSizes([size("500 g"), { colorName: "Ruby", colorHex: "#AA0000" }])).toBe(false);
    expect(productUsesPackSizes([{ colorName: "Two-tone", colorHex: PLACEHOLDER_COLOUR_HEX, colorHex2: "#000000" }])).toBe(false);
  });

  it("ignores hex case and blank labels", () => {
    expect(productUsesPackSizes([{ colorName: "1 kg", colorHex: PLACEHOLDER_COLOUR_HEX.toLowerCase() }])).toBe(true);
    expect(productUsesPackSizes([{ colorName: "   ", colorHex: PLACEHOLDER_COLOUR_HEX }])).toBe(false);
  });

  it("still counts a labelled variant as a chosen option, so existing callers keep working", () => {
    expect(productHasChosenColours([size("500 g")])).toBe(true);
  });
});
