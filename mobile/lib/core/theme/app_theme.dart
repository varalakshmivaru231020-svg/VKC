import "package:flutter/material.dart";
import "package:google_fonts/google_fonts.dart";

import "theme_extension.dart";

/// Default tokens used before /app-config has loaded (or if it fails).
/// They mirror the web app's defaults.
class _Default {
  static const primary       = Color(0xFF7B1E2E);
  static const primaryLight  = Color(0xFFA93D52);
  static const primary50     = Color(0xFFFBE9EC);
  static const gold          = Color(0xFFC8A24C);
  static const ivory         = Color(0xFFFBF8F3);
  static const cream         = Color(0xFFF5EFE3);
  static const parchment     = Color(0xFFE5DBC7);
  static const textPrimary   = Color(0xFF1C1410);
  static const textMuted     = Color(0xFF7A6E62);
  static const success       = Color(0xFF2F7D49);
  static const error         = Color(0xFFB22222);
}

Color _hex(String? value, Color fallback) {
  if (value == null || value.isEmpty) return fallback;
  var hex = value.replaceAll("#", "").trim();
  if (hex.length == 6) hex = "FF$hex";
  final v = int.tryParse(hex, radix: 16);
  return v == null ? fallback : Color(v);
}

class AppThemeBuilder {
  /// Build a ThemeData from a flat color map (typically coming from
  /// `appConfig.theme.colors`). Pass null for the bootstrap (pre-config) state.
  static ThemeData build({
    Map<String, dynamic>? colors,
    String? headingFont,
    String? bodyFont,
  }) {
    final c = colors ?? const {};
    final primary       = _hex(c["primary"]      as String?, _Default.primary);
    final primaryLight  = _hex(c["primaryLight"] as String?, _Default.primaryLight);
    final primary50     = _hex(c["primary50"]    as String?, _Default.primary50);
    final ivory         = _hex(c["ivory"]        as String?, _Default.ivory);
    final cream         = _hex(c["cream"]        as String?, _Default.cream);
    final parchment     = _hex(c["parchment"]    as String?, _Default.parchment);
    final textPrimary   = _hex(c["textPrimary"]  as String?, _Default.textPrimary);
    final textMuted     = _hex(c["textMuted"]    as String?, _Default.textMuted);
    final success       = _hex(c["success"]      as String?, _Default.success);
    final error         = _hex(c["error"]        as String?, _Default.error);
    final gold          = _hex(c["gold"]         as String?, _Default.gold);

    final body    = _bodyTextTheme(textPrimary, bodyFont);
    final display = _displayTextTheme(textPrimary, headingFont);

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        primary: primary,
        onPrimary: Colors.white,
        secondary: gold,
        surface: Colors.white,
        error: error,
      ),
      scaffoldBackgroundColor: ivory,
      textTheme: display.merge(body),
      appBarTheme: AppBarTheme(
        backgroundColor: ivory,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: _safeGoogleFont(headingFont, "Cormorant Garamond",
            fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: _safeGoogleFont(bodyFont, "Inter",
              fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          foregroundColor: primary,
          side: BorderSide(color: primary),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border:    OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: parchment)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: parchment)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: primary, width: 1.5)),
        errorBorder:   OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: error)),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: primary,
        unselectedItemColor: textMuted,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
      ),
      dividerColor: parchment,
      cardTheme: CardTheme(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: BorderSide(color: parchment)),
      ),
      extensions: [
        AppColorsExtension(
          ivory: ivory,
          cream: cream,
          parchment: parchment,
          gold: gold,
          primary50: primary50,
          primaryLight: primaryLight,
          textMuted: textMuted,
          success: success,
        ),
      ],
    );
  }

  // Google Fonts family names that the admin might commonly choose.
  // Generics like "system-ui", "sans-serif" etc. are *not* Google Fonts so
  // we filter them out and fall back to the default if nothing matches.
  static const _genericCssFamilies = <String>{
    "system-ui", "sans-serif", "serif", "monospace", "cursive", "fantasy",
    "ui-sans-serif", "ui-serif", "ui-monospace", "ui-rounded",
    "-apple-system", "blinkmacsystemfont", "roboto", "segoe ui", "helvetica",
    "arial", "apple color emoji", "segoe ui emoji", "segoe ui symbol",
  };

  /// Resolves a font value (which may be a CSS stack like
  /// `"Inter", system-ui, sans-serif`) into a single Google-Fonts family
  /// name, falling back to [fallback] when nothing useful is found.
  static String _safeFont(String? requested, String fallback) {
    if (requested == null || requested.trim().isEmpty) return fallback;

    // Split on commas → strip quotes/whitespace → drop generics → first match wins.
    final candidates = requested
        .split(",")
        .map((s) => s.trim().replaceAll(RegExp(r'^[\"' + "'" + r']+|[\"' + "'" + r']+$'), '').trim())
        .where((s) => s.isNotEmpty)
        .toList();

    for (final c in candidates) {
      if (_genericCssFamilies.contains(c.toLowerCase())) continue;
      return c;
    }
    return fallback;
  }

  static TextTheme _displayTextTheme(Color color, String? font) {
    final base = TextTheme(
      displayLarge:  TextStyle(color: color, fontWeight: FontWeight.w600),
      displayMedium: TextStyle(color: color, fontWeight: FontWeight.w600),
      displaySmall:  TextStyle(color: color, fontWeight: FontWeight.w600),
      headlineLarge: TextStyle(color: color, fontWeight: FontWeight.w600),
      headlineMedium:TextStyle(color: color, fontWeight: FontWeight.w600),
      headlineSmall: TextStyle(color: color, fontWeight: FontWeight.w600),
      titleLarge:    TextStyle(color: color, fontWeight: FontWeight.w600),
    );
    return _applyGoogleFontOrFallback(_safeFont(font, "Cormorant Garamond"), "Cormorant Garamond", base);
  }

  static TextTheme _bodyTextTheme(Color color, String? font) {
    final base = TextTheme(
      titleMedium: TextStyle(color: color, fontWeight: FontWeight.w500),
      titleSmall:  TextStyle(color: color, fontWeight: FontWeight.w500),
      bodyLarge:   TextStyle(color: color),
      bodyMedium:  TextStyle(color: color),
      bodySmall:   TextStyle(color: color),
      labelLarge:  TextStyle(color: color, fontWeight: FontWeight.w600),
    );
    return _applyGoogleFontOrFallback(_safeFont(font, "Inter"), "Inter", base);
  }

  /// Try GoogleFonts.getFont(family) for a single TextStyle, with safe fallback.
  static TextStyle _safeGoogleFont(
    String? requested,
    String fallback, {
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
  }) {
    final family = _safeFont(requested, fallback);
    try {
      return GoogleFonts.getFont(family,
          fontSize: fontSize, fontWeight: fontWeight, color: color);
    } catch (_) {
      try {
        return GoogleFonts.getFont(fallback,
            fontSize: fontSize, fontWeight: fontWeight, color: color);
      } catch (_) {
        return TextStyle(fontSize: fontSize, fontWeight: fontWeight, color: color);
      }
    }
  }

  /// Try GoogleFonts.getTextTheme(family) and fall back to a known-good family
  /// if the requested one isn't in the Google Fonts catalogue.
  static TextTheme _applyGoogleFontOrFallback(String family, String fallback, TextTheme base) {
    try {
      return GoogleFonts.getTextTheme(family, base);
    } catch (_) {
      try {
        return GoogleFonts.getTextTheme(fallback, base);
      } catch (_) {
        return base; // ultimate fallback: platform default
      }
    }
  }
}
