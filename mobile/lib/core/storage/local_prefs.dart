import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:shared_preferences/shared_preferences.dart";

/// Lightweight SharedPreferences wrapper for non-sensitive flags
/// (onboarding-completed, last-seen-version, etc.).
class LocalPrefs {
  LocalPrefs(this._prefs);
  final SharedPreferences _prefs;

  static const _onboardingComplete = "onboarding_complete";
  static const _lastSeenVersion    = "last_seen_app_version";

  bool get onboardingComplete       => _prefs.getBool(_onboardingComplete) ?? false;
  Future<void> setOnboardingComplete(bool v) => _prefs.setBool(_onboardingComplete, v);

  String? get lastSeenVersion => _prefs.getString(_lastSeenVersion);
  Future<void> setLastSeenVersion(String v) => _prefs.setString(_lastSeenVersion, v);

  Future<void> clear() => _prefs.clear();
}

/// Override in main() with the resolved instance from `SharedPreferences.getInstance()`.
final localPrefsProvider = Provider<LocalPrefs>((ref) {
  throw UnimplementedError("localPrefsProvider must be overridden in main()");
});
