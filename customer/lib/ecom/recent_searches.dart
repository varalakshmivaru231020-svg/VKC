import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// The customer's last few searches, kept on the phone so the search screen
/// can offer them back. Most recent first, capped at [max].
class RecentSearches {
  RecentSearches._();
  static final RecentSearches I = RecentSearches._();

  static const _key = 'vkc_recent_searches_v1';
  static const max = 8;

  final ValueNotifier<List<String>> terms = ValueNotifier<List<String>>(const []);
  bool _loaded = false;

  Future<void> load() async {
    if (_loaded) return;
    _loaded = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      terms.value = prefs.getStringList(_key) ?? const [];
    } catch (_) {}
  }

  Future<void> add(String term) async {
    final t = term.trim();
    if (t.length < 2) return;
    final next = [t, ...terms.value.where((x) => x.toLowerCase() != t.toLowerCase())].take(max).toList();
    terms.value = next;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_key, next);
    } catch (_) {}
  }

  Future<void> remove(String term) async {
    terms.value = terms.value.where((x) => x != term).toList();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_key, terms.value);
    } catch (_) {}
  }

  Future<void> clear() async {
    terms.value = const [];
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_key);
    } catch (_) {}
  }
}
