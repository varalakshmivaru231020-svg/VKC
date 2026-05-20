import "dart:convert";

import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:shared_preferences/shared_preferences.dart";

import "cart_models.dart";

const _cartKey = "cart_items_v1";

/// Source of truth for the user's local cart. Items are persisted in
/// SharedPreferences as JSON so they survive app restarts. The notifier is
/// hydrated lazily — `bootstrap()` is called from main.dart.
class CartController extends StateNotifier<List<CartItem>> {
  CartController(this._prefs) : super(const []) {
    _load();
  }
  final SharedPreferences _prefs;

  void _load() {
    final raw = _prefs.getString(_cartKey);
    if (raw == null) return;
    try {
      final list = (jsonDecode(raw) as List).cast<dynamic>();
      state = list.map((e) => CartItem.fromJson((e as Map).cast<String, dynamic>())).toList();
    } catch (_) {
      // Corrupted — start fresh.
      state = const [];
    }
  }

  Future<void> _persist() async {
    await _prefs.setString(_cartKey, jsonEncode(state.map((e) => e.toJson()).toList()));
  }

  /// Adds an item; increments quantity if the variant already exists in cart.
  Future<void> add(CartItem item) async {
    final existing = state.indexWhere((it) => it.variantId == item.variantId);
    if (existing >= 0) {
      final cur  = state[existing];
      final next = (cur.quantity + item.quantity).clamp(1, item.stockQty.clamp(1, 999));
      state = [...state]..[existing] = cur.copyWith(quantity: next);
    } else {
      state = [...state, item];
    }
    await _persist();
  }

  Future<void> updateQty(String variantId, int qty) async {
    state = [
      for (final it in state)
        if (it.variantId == variantId)
          it.copyWith(quantity: qty.clamp(1, it.stockQty.clamp(1, 999)))
        else
          it,
    ];
    await _persist();
  }

  Future<void> remove(String variantId) async {
    state = state.where((it) => it.variantId != variantId).toList();
    await _persist();
  }

  Future<void> clear() async {
    state = const [];
    await _persist();
  }

  // Computed selectors
  int get totalQuantity => state.fold(0, (a, b) => a + b.quantity);
  num get subtotal      => state.fold<num>(0, (a, b) => a + (b.salePrice * b.quantity));
}

/// Provider — overridden in main() once SharedPreferences is ready.
final cartControllerProvider = StateNotifierProvider<CartController, List<CartItem>>((_) {
  throw UnimplementedError("cartControllerProvider must be overridden in main()");
});

/// Convenience selectors so widgets don't rebuild when unrelated cart fields change.
final cartCountProvider = Provider<int>(
  (ref) => ref.watch(cartControllerProvider).fold(0, (a, b) => a + b.quantity),
);
final cartSubtotalProvider = Provider<num>(
  (ref) => ref.watch(cartControllerProvider).fold<num>(0, (a, b) => a + (b.salePrice * b.quantity)),
);
