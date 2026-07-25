import "dart:convert";

import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:shared_preferences/shared_preferences.dart";

import "../../../core/api/api_client.dart";
import "cart_models.dart";

const _cartKey = "cart_items_v1";

/// Source of truth for the user's local cart. Items are persisted in
/// SharedPreferences as JSON so they survive app restarts. After every
/// mutation the cart is also synced to the server so admin Cart History
/// stays up to date.
class CartController extends StateNotifier<List<CartItem>> {
  CartController(this._prefs, this._api) : super(const []) {
    _load();
  }
  final SharedPreferences _prefs;
  final ApiClient _api;

  void _load() {
    final raw = _prefs.getString(_cartKey);
    if (raw == null) return;
    try {
      final list = (jsonDecode(raw) as List).cast<dynamic>();
      state = list.map((e) => CartItem.fromJson((e as Map).cast<String, dynamic>())).toList();
    } catch (_) {
      state = const [];
    }
  }

  Future<void> _persist() async {
    await _prefs.setString(_cartKey, jsonEncode(state.map((e) => e.toJson()).toList()));
  }

  // Fire-and-forget — never throws; admin sync is best-effort.
  void _syncToServer() {
    _api.post<dynamic>("/cart", body: {
      "items": state.map((i) => {
        "productId": i.productId,
        "variantId": i.variantId,
        "quantity":  i.quantity,
      }).toList(),
    }).catchError((_) {});
  }

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
    _syncToServer();
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
    _syncToServer();
  }

  Future<void> remove(String variantId) async {
    state = state.where((it) => it.variantId != variantId).toList();
    await _persist();
    _syncToServer();
  }

  Future<void> clear() async {
    state = const [];
    await _persist();
    _syncToServer();
  }

  int get totalQuantity => state.fold(0, (a, b) => a + b.quantity);
  num get subtotal      => state.fold<num>(0, (a, b) => a + (b.salePrice * b.quantity));
}

/// Provider — overridden in main() once SharedPreferences is ready.
final cartControllerProvider = StateNotifierProvider<CartController, List<CartItem>>((_) {
  throw UnimplementedError("cartControllerProvider must be overridden in main()");
});

final cartCountProvider = Provider<int>(
  (ref) => ref.watch(cartControllerProvider).fold(0, (a, b) => a + b.quantity),
);
final cartSubtotalProvider = Provider<num>(
  (ref) => ref.watch(cartControllerProvider).fold<num>(0, (a, b) => a + (b.salePrice * b.quantity)),
);
