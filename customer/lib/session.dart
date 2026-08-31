import 'package:flutter/foundation.dart';

/// Lightweight in-memory session. The public API is phone-gated (no login), so
/// we keep the customer's mobile once entered and reuse it for order lookups
/// and live chat identity. Not persisted — this matches the design's static
/// login (real auth is out of scope for this pass).
class Session {
  Session._();
  static final Session I = Session._();

  final ValueNotifier<String?> phone = ValueNotifier<String?>(null);
  final ValueNotifier<String?> name = ValueNotifier<String?>(null);

  /// In-memory wishlist + cart for the static shop screens.
  final ValueNotifier<Set<String>> favorites = ValueNotifier<Set<String>>({});
  final ValueNotifier<Map<String, int>> cart = ValueNotifier<Map<String, int>>({});

  void toggleFav(String id) {
    final next = Set<String>.from(favorites.value);
    next.contains(id) ? next.remove(id) : next.add(id);
    favorites.value = next;
  }

  void addToCart(String id, [int qty = 1]) {
    final next = Map<String, int>.from(cart.value);
    next[id] = (next[id] ?? 0) + qty;
    if (next[id]! <= 0) next.remove(id);
    cart.value = next;
  }

  int get cartCount => cart.value.values.fold(0, (a, b) => a + b);

  bool get hasPhone => (phone.value ?? '').replaceAll(RegExp(r'\D'), '').length >= 10;

  void setIdentity({required String phone, String? name}) {
    this.phone.value = phone.trim();
    if (name != null && name.trim().isNotEmpty) this.name.value = name.trim();
  }

  String get displayName => (name.value?.trim().isNotEmpty ?? false) ? name.value!.trim() : 'Guest';
}
