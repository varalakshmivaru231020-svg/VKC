/**
 * Generates a human-friendly return number, e.g. "RTN-A3B7K2X".
 *
 * Uses an alphabet without I, O, 0, 1 to avoid ambiguous lookalikes when a
 * customer reads the number off a courier slip or repeats it on a call.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReturnNumber() {
  let suffix = "";
  for (let i = 0; i < 7; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `RTN-${suffix}`;
}
