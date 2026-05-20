import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:shared_preferences/shared_preferences.dart";

/// Lightweight SharedPreferences wrapper for non-sensitive flags
/// (onboarding-completed, last-seen-version, etc.).
class LocalPrefs {
  LocalPrefs(this._prefs);
  final SharedPreferences _prefs;

  static const _onboardingComplete = "onboarding_complete";
  static const _lastSeenVersion    = "last_seen_app_version";
  static const _searchHistory      = "search_history_v1";

  bool get onboardingComplete       => _prefs.getBool(_onboardingComplete) ?? false;
  Future<void> setOnboardingComplete(bool v) => _prefs.setBool(_onboardingComplete, v);

  String? get lastSeenVersion => _prefs.getString(_lastSeenVersion);
  Future<void> setLastSeenVersion(String v) => _prefs.setString(_lastSeenVersion, v);

  /// Most-recent first, capped at 10 entries.
  List<String> get searchHistory => _prefs.getStringList(_searchHistory) ?? const [];

  Future<void> pushSearch(String query) async {
    final q = query.trim();
    if (q.isEmpty) return;
    final list = List<String>.from(searchHistory);
    list.removeWhere((e) => e.toLowerCase() == q.toLowerCase());
    list.insert(0, q);
    if (list.length > 10) list.removeRange(10, list.length);
    await _prefs.setStringList(_searchHistory, list);
  }

  Future<void> clearSearchHistory() => _prefs.remove(_searchHistory);

  Future<void> clear() => _prefs.clear();
}

/// Override in main() with the resolved instance from `SharedPreferences.getInstance()`.
final localPrefsProvider = Provider<LocalPrefs>((ref) {
  throw UnimplementedError("localPrefsProvider must be overridden in main()");
});
