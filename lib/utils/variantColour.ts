/**
 * Whether a product's variants carry a colour the admin actually chose.
 *
 * The admin product form seeds every new variant with an empty colour name and
 * the placeholder swatch "#8B1A2E" (the schema requires a hex value). Jaggery
 * products usually never touch those fields, so the storefront must not present
 * that placeholder as a real "Colour" option. A colour counts as chosen when the
 * name is filled in, or the hex was changed from the placeholder, or a second
 * hex (two-tone) was set.
 */
export const PLACEHOLDER_COLOUR_HEX = "#8B1A2E";

export interface ColourLike {
  colorName?: string | null;
  colorHex?: string | null;
  colorHex2?: string | null;
}

export function variantHasChosenColour(v: ColourLike): boolean {
  if (v.colorName && v.colorName.trim()) return true;
  if (v.colorHex2 && v.colorHex2.trim()) return true;
  const hex = (v.colorHex ?? "").trim().toUpperCase();
  return Boolean(hex) && hex !== PLACEHOLDER_COLOUR_HEX;
}

export function productHasChosenColours(variants: ColourLike[]): boolean {
  return variants.some(variantHasChosenColour);
}
