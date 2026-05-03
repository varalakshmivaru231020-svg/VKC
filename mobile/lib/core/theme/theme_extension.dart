import "package:flutter/material.dart";

/// Brand-specific colors that don't have a slot in Material's ColorScheme
/// (cream, parchment, gold etc.). Access via `Theme.of(context).extension<AppColorsExtension>()!`.
class AppColorsExtension extends ThemeExtension<AppColorsExtension> {
  final Color ivory;
  final Color cream;
  final Color parchment;
  final Color gold;
  final Color primary50;
  final Color primaryLight;
  final Color textMuted;
  final Color success;

  const AppColorsExtension({
    required this.ivory,
    required this.cream,
    required this.parchment,
    required this.gold,
    required this.primary50,
    required this.primaryLight,
    required this.textMuted,
    required this.success,
  });

  @override
  AppColorsExtension copyWith({
    Color? ivory, Color? cream, Color? parchment, Color? gold,
    Color? primary50, Color? primaryLight, Color? textMuted, Color? success,
  }) =>
      AppColorsExtension(
        ivory: ivory ?? this.ivory,
        cream: cream ?? this.cream,
        parchment: parchment ?? this.parchment,
        gold: gold ?? this.gold,
        primary50: primary50 ?? this.primary50,
        primaryLight: primaryLight ?? this.primaryLight,
        textMuted: textMuted ?? this.textMuted,
        success: success ?? this.success,
      );

  @override
  AppColorsExtension lerp(ThemeExtension<AppColorsExtension>? other, double t) {
    if (other is! AppColorsExtension) return this;
    return AppColorsExtension(
      ivory:        Color.lerp(ivory, other.ivory, t)!,
      cream:        Color.lerp(cream, other.cream, t)!,
      parchment:    Color.lerp(parchment, other.parchment, t)!,
      gold:         Color.lerp(gold, other.gold, t)!,
      primary50:    Color.lerp(primary50, other.primary50, t)!,
      primaryLight: Color.lerp(primaryLight, other.primaryLight, t)!,
      textMuted:    Color.lerp(textMuted, other.textMuted, t)!,
      success:      Color.lerp(success, other.success, t)!,
    );
  }
}

extension AppColorsContext on BuildContext {
  AppColorsExtension get appColors => Theme.of(this).extension<AppColorsExtension>()!;
}
