import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_fonts/google_fonts.dart';

/// Runtime palette. Defaults are the Claude Design heritage tokens; at startup
/// [applyAdminTheme] overwrites them with the store's admin theme (from
/// /v1/app-config), so the app matches the website. Fields are NON-const on
/// purpose — that's what makes admin theming possible.
class VlColors {
  // Brand
  static Color red = const Color(0xFFC8102E);
  static Color redDeep = const Color(0xFF6B1220);
  static Color redInk = const Color(0xFF4A0C18);
  static Color redSoft = const Color(0xFFFCE6E9);
  static Color redTint = const Color(0xFFFFF0F2);

  // Warm neutrals
  static Color canvas = const Color(0xFFFBF7F0);
  static Color paper = const Color(0xFFFFFFFF);
  static Color cream = const Color(0xFFF5EDDE);
  static Color cream2 = const Color(0xFFEFE3CD);
  static Color ink = const Color(0xFF1A0F0F);
  static Color ink2 = const Color(0xFF2E1F1F);
  static Color muted = const Color(0xFF6B5B5B);
  static Color muted2 = const Color(0xFF9A8B8B);
  static Color rule = const Color(0xFFE8DDC9);
  static Color rule2 = const Color(0xFFD6C8AE);

  // Accent + status
  static Color gold = const Color(0xFFB8893A);
  static Color goldSoft = const Color(0xFFE8D5A8);
  static Color green = const Color(0xFF2F7D5B);
  static Color amber = const Color(0xFFC98F2E);
}

/// The launch screen's own colours, deliberately const.
///
/// [VlColors] is overwritten by the store's admin theme, so the splash — the
/// one screen that is pure Vijayalakshmi branding — was being repainted in
/// whatever palette the store had configured, and turned near-black once the
/// cached theme started applying before the first frame. Brand furniture does
/// not follow the runtime palette.
class VlBrand {
  static const ink = Color(0xFF4A0C18);
  static const gold = Color(0xFFB8893A);
  static const goldSoft = Color(0xFFE8D5A8);
  static const canvas = Color(0xFFFBF7F0);

  /// Discount badges, fixed rather than themed.
  ///
  /// The store's admin palette currently maps primary to black, which turned
  /// the "20% OFF" badge into a neutral black label indistinguishable from any
  /// other tag. A saving is the one thing on a product card that has to read as
  /// a saving at a glance, in the colour shoppers already expect.
  static const sale = Color(0xFFC8102E);
}

/// Bumped whenever the admin theme is applied, so MaterialApp rebuilds and the
/// whole tree re-reads the (now non-const) palette.
final ValueNotifier<int> themeVersion = ValueNotifier<int>(0);

Color? _hexColor(String? h) {
  if (h == null) return null;
  var s = h.replaceAll('#', '').trim();
  if (s.length == 3) s = s.split('').map((c) => '$c$c').join();
  if (s.length == 6) s = 'FF$s';
  if (s.length != 8) return null;
  final v = int.tryParse(s, radix: 16);
  return v == null ? null : Color(v);
}

const _themeStore = FlutterSecureStorage(aOptions: AndroidOptions(encryptedSharedPreferences: true));
const _kThemeColors = 'admin_theme_colors';

void _cacheTheme(Map<String, dynamic> colors) async {
  try {
    await _themeStore.write(key: _kThemeColors, value: jsonEncode(colors));
  } catch (_) {
    // A palette that can't be cached just means the next launch fetches it.
  }
}

/// Applies the palette saved from the last successful /app-config.
///
/// Without this the app painted the shipped crimson defaults, then flipped to
/// the store's own colours a second or two later when the config landed — a
/// visible change of theme under the customer's eyes on every cold start.
Future<void> loadCachedTheme() async {
  try {
    final raw = await _themeStore.read(key: _kThemeColors);
    if (raw == null || raw.isEmpty) return;
    final decoded = jsonDecode(raw);
    if (decoded is Map) applyAdminTheme(decoded.cast<String, dynamic>(), cache: false);
  } catch (_) {
    // Corrupt or unreadable — the network copy replaces it shortly.
  }
}

/// Maps the admin `theme.colors` (from /v1/app-config) onto [VlColors] so every
/// screen reflects the store theme — same tokens the website consumes.
void applyAdminTheme(Map<String, dynamic>? colors, {bool cache = true}) {
  if (colors == null || colors.isEmpty) return;
  if (cache) _cacheTheme(colors);
  Color pick(String key, Color fallback) => _hexColor(colors[key] as String?) ?? fallback;

  final primary = pick('primary', VlColors.red);
  VlColors.red = primary;
  VlColors.redDeep = pick('primaryDark', VlColors.redDeep);
  VlColors.redInk = pick('primaryDark', VlColors.redInk);
  VlColors.redSoft = pick('primary50', VlColors.redSoft);
  VlColors.redTint = pick('primary50', VlColors.redTint);

  VlColors.canvas = pick('ivory', VlColors.canvas);
  VlColors.paper = pick('ivory', VlColors.paper);
  VlColors.cream = pick('cream', VlColors.cream);
  VlColors.cream2 = pick('parchment', pick('sand', VlColors.cream2));

  VlColors.ink = pick('textPrimary', VlColors.ink);
  VlColors.ink2 = pick('textPrimary', VlColors.ink2);
  VlColors.muted = pick('textSecondary', VlColors.muted);
  VlColors.muted2 = pick('textMuted', VlColors.muted2);
  VlColors.rule = pick('border', VlColors.rule);
  VlColors.rule2 = pick('border', VlColors.rule2);

  VlColors.gold = pick('gold', VlColors.gold);
  VlColors.goldSoft = pick('goldLight', VlColors.goldSoft);
  VlColors.green = pick('success', VlColors.green);
  VlColors.amber = pick('warning', VlColors.amber);

  themeVersion.value++;
}

class VlRadii {
  static const sm = 8.0;
  static const md = 14.0;
  static const lg = 20.0;
  static const xl = 28.0;
}

/// Silk fabric placeholder palettes (from data.jsx FABRIC_PALETTES).
class FabricPalette {
  final Color top, bot;
  const FabricPalette(this.top, this.bot);
}

const fabricPalettes = <FabricPalette>[
  FabricPalette(Color(0xFFC8102E), Color(0xFF6B1220)), // crimson
  FabricPalette(Color(0xFF1F4D3B), Color(0xFF0E2A20)), // emerald
  FabricPalette(Color(0xFF3B2A6B), Color(0xFF1F1240)), // royal
  FabricPalette(Color(0xFFB8893A), Color(0xFF6B4E1E)), // mustard
  FabricPalette(Color(0xFF1A0F0F), Color(0xFF000000)), // ink
  FabricPalette(Color(0xFFD4A574), Color(0xFF8B5E2E)), // ivory-gold
  FabricPalette(Color(0xFF7A1D2B), Color(0xFF3D0A14)), // wine
  FabricPalette(Color(0xFF0E3A57), Color(0xFF04182A)), // peacock
  FabricPalette(Color(0xFFE8D5A8), Color(0xFFB8893A)), // cream-gold
];

FabricPalette paletteAt(int i) => fabricPalettes[i % fabricPalettes.length];

/// Type roles — display (Cormorant Garamond), UI (Poppins), body (Inter),
/// mono (JetBrains Mono).
class VlText {
  static TextStyle display(double size,
          {FontWeight weight = FontWeight.w500, Color? color, double height = 1.1, FontStyle? style}) =>
      GoogleFonts.cormorantGaramond(
          fontSize: size, fontWeight: weight, color: color ?? VlColors.ink, height: height, fontStyle: style);

  static TextStyle ui(double size,
          {FontWeight weight = FontWeight.w500, Color? color, double letter = 0.02}) =>
      GoogleFonts.poppins(
          fontSize: size, fontWeight: weight, color: color ?? VlColors.ink, letterSpacing: letter);

  static TextStyle body(double size, {FontWeight weight = FontWeight.w400, Color? color, double height = 1.4}) =>
      GoogleFonts.inter(fontSize: size, fontWeight: weight, color: color ?? VlColors.ink, height: height);

  static TextStyle mono(double size, {Color? color, double letter = 0.14, FontWeight weight = FontWeight.w400}) =>
      GoogleFonts.jetBrainsMono(
          fontSize: size, color: color ?? VlColors.muted, letterSpacing: letter, fontWeight: weight);

  /// Uppercase mono label with tracking (the ".mono.upper" utility).
  static TextStyle upper(double size, {Color? color, double letter = 0.18, FontWeight weight = FontWeight.w400}) =>
      mono(size, color: color, letter: letter, weight: weight);
}

ThemeData vlTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: VlColors.canvas,
    colorScheme: ColorScheme.fromSeed(seedColor: VlColors.red, primary: VlColors.red, surface: VlColors.paper),
    textTheme: GoogleFonts.interTextTheme(),
    splashFactory: InkRipple.splashFactory,
  );
}
