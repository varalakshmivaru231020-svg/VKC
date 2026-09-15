import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// VKC Gold Ikshu design tokens.
///
/// The palette is fixed on purpose: it is the brand — jaggery amber, cane
/// green, bark brown and ivory — and every screen reads from the same set so
/// the app feels like one product. Runtime theming from the admin panel was
/// removed: it once turned the whole app black when the store's primary
/// colour was set to #000, and brand identity must not depend on a setting.
class VkColors {
  // ── Brand ─────────────────────────────────────────────────────────────────
  /// Burnt jaggery — the one CTA colour, the active tab, the price accent.
  static const primary = Color(0xFFB4561A);
  static const primaryDeep = Color(0xFF7E3A0C);
  /// Bark — the darkest brand tone; used for hero overlays and dark cards.
  static const primaryInk = Color(0xFF3A1F0A);
  static const primarySoft = Color(0xFFFBE8D9);
  static const primaryTint = Color(0xFFFDF5EE);

  /// Bright jaggery gold, for highlights and ratings.
  static const amber = Color(0xFFE0961C);
  static const amberSoft = Color(0xFFFFF0CC);

  /// Cane leaf green — trust, stock, success.
  static const leaf = Color(0xFF487A38);
  static const leafSoft = Color(0xFFEBF5E9);

  // ── Warm neutrals ────────────────────────────────────────────────────────
  static const canvas = Color(0xFFFFFBF4); // ivory page background
  static const paper = Color(0xFFFFFFFF); // cards, sheets
  static const cream = Color(0xFFFBF1DE);
  static const cream2 = Color(0xFFF3E3C4);
  static const ink = Color(0xFF2B1708);
  static const ink2 = Color(0xFF5C3A1E);
  static const muted = Color(0xFF8A6A4E);
  static const muted2 = Color(0xFFB59B84);
  static const rule = Color(0xFFF0DCB6);
  static const rule2 = Color(0xFFE1C79B);

  // ── Accent + status ───────────────────────────────────────────────────────
  static const gold = Color(0xFFC8A24C);
  static const goldSoft = Color(0xFFEBDCAE);
  static const green = leaf;
  static const warning = Color(0xFFC47A2B);
  static const error = Color(0xFFC42B2B);
  /// Discount badges, fixed: a saving has to read as a saving at a glance.
  static const sale = Color(0xFFC8102E);
}

/// Colours that never change, for brand furniture (splash, badges).
class VkBrand {
  static const ink = VkColors.primaryInk;
  static const gold = VkColors.gold;
  static const goldSoft = VkColors.goldSoft;
  static const canvas = VkColors.canvas;
  static const sale = VkColors.sale;
}

class VkRadii {
  static const xs = 6.0;
  static const sm = 10.0;
  static const md = 14.0;
  static const lg = 20.0;
  static const xl = 28.0;
  static const pill = 999.0;
}

/// Spacing scale. Screen gutters are [page]; everything else steps in 4s.
class VkSpace {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 20.0;
  static const xxl = 28.0;
  static const section = 32.0;
  static const page = 20.0;
}

/// Motion: short, decelerating, never gimmicky.
class VkMotion {
  static const fast = Duration(milliseconds: 120);
  static const base = Duration(milliseconds: 220);
  static const slow = Duration(milliseconds: 360);
  static const curve = Curves.easeOutCubic;
  static const emphasized = Curves.easeOutBack;
}

/// Type roles — display (Cormorant Garamond), UI (Poppins), body (Inter).
///
/// [upper] and [mono] are small tracked labels (kickers, order numbers, meta
/// lines); both are drawn in the UI face so nothing in the app reads as
/// developer output.
class VkText {
  static TextStyle display(double size,
          {FontWeight weight = FontWeight.w600, Color? color, double height = 1.12, FontStyle? style}) =>
      GoogleFonts.cormorantGaramond(
          fontSize: size, fontWeight: weight, color: color ?? VkColors.ink, height: height, fontStyle: style);

  static TextStyle ui(double size, {FontWeight weight = FontWeight.w500, Color? color, double letter = 0.02, double? height}) =>
      GoogleFonts.poppins(fontSize: size, fontWeight: weight, color: color ?? VkColors.ink, letterSpacing: letter, height: height);

  static TextStyle body(double size, {FontWeight weight = FontWeight.w400, Color? color, double height = 1.45}) =>
      GoogleFonts.inter(fontSize: size, fontWeight: weight, color: color ?? VkColors.ink, height: height);

  static TextStyle mono(double size, {Color? color, double letter = 0.04, FontWeight weight = FontWeight.w500}) =>
      GoogleFonts.inter(
        fontSize: size,
        color: color ?? VkColors.muted,
        letterSpacing: letter,
        fontWeight: weight,
        fontFeatures: const [FontFeature.tabularFigures()],
      );

  /// Uppercase tracked kicker label.
  static TextStyle upper(double size, {Color? color, double letter = 0.14, FontWeight weight = FontWeight.w600}) =>
      GoogleFonts.poppins(fontSize: size, color: color ?? VkColors.muted, letterSpacing: letter * 8, fontWeight: weight);
}

ThemeData vkTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: VkColors.primary,
    primary: VkColors.primary,
    onPrimary: Colors.white,
    surface: VkColors.paper,
    onSurface: VkColors.ink,
    secondary: VkColors.leaf,
    error: VkColors.error,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: VkColors.canvas,
    textTheme: GoogleFonts.interTextTheme().apply(bodyColor: VkColors.ink, displayColor: VkColors.ink),
    splashFactory: InkSparkle.splashFactory,
    splashColor: VkColors.primary.withValues(alpha: 0.08),
    highlightColor: VkColors.primary.withValues(alpha: 0.04),
    dividerColor: VkColors.rule,
    snackBarTheme: SnackBarThemeData(
      backgroundColor: VkColors.ink,
      contentTextStyle: VkText.body(13, color: Colors.white),
      actionTextColor: VkColors.amberSoft,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(VkRadii.md)),
      insetPadding: const EdgeInsets.fromLTRB(16, 0, 16, 84),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: VkColors.canvas,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(VkRadii.xl))),
    ),
    dialogTheme: const DialogThemeData(backgroundColor: VkColors.paper, surfaceTintColor: Colors.transparent),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: VkColors.primary),
    pageTransitionsTheme: const PageTransitionsTheme(builders: {
      TargetPlatform.android: PredictiveBackPageTransitionsBuilder(),
    }),
  );
}
