import 'package:flutter/foundation.dart';
import 'ecom_api.dart';
import 'ecom_models.dart';

/// The customer's wishlist, kept in one place so every heart in the app —
/// home rows, listing cards, the product page, the wishlist grid — shows the
/// same state and writes to the same endpoint (/v1/wishlist, keyed by
/// variantId).
class Wishlist {
  Wishlist._();
  static final Wishlist I = Wishlist._();

  /// Saved variant ids; what the hearts read.
  final ValueNotifier<Set<String>> variantIds = ValueNotifier<Set<String>>({});

  /// The saved entries themselves, for the wishlist grid.
  final ValueNotifier<List<WishlistEntry>> entries = ValueNotifier<List<WishlistEntry>>([]);

  bool _loaded = false;
  bool get isLoaded => _loaded;

  bool contains(String? variantId) => variantId != null && variantIds.value.contains(variantId);

  /// Pull the server's list. Safe to call repeatedly; a signed-out customer
  /// simply ends up with an empty wishlist.
  Future<void> load() async {
    if (!EcomAuth.I.isLoggedIn) {
      clear();
      return;
    }
    final list = await EcomApi.I.wishlist();
    entries.value = list;
    variantIds.value = list.map((e) => e.variantId).toSet();
    _loaded = true;
  }

  /// Best-effort refresh — used at startup, where a failure must not surface.
  Future<void> loadQuietly() async {
    try {
      await load();
    } catch (_) {
      // Leave the wishlist as it is; the screens can retry.
    }
  }

  /// Adds or removes [variantId], updating the hearts immediately and putting
  /// the old state back if the server refuses. Returns the state it settled
  /// on; throws what the API threw so callers can show the reason.
  Future<bool> toggle(String variantId, {EcomProduct? product}) async {
    final was = contains(variantId);
    _apply(variantId, !was, product: product);
    try {
      if (was) {
        await EcomApi.I.removeWishlist(variantId);
      } else {
        await EcomApi.I.addWishlist(variantId);
      }
      return !was;
    } catch (e) {
      _apply(variantId, was, product: product);
      rethrow;
    }
  }

  void _apply(String variantId, bool on, {EcomProduct? product}) {
    final next = Set<String>.from(variantIds.value);
    on ? next.add(variantId) : next.remove(variantId);
    variantIds.value = next;

    final list = [...entries.value];
    if (on) {
      if (product != null && !list.any((e) => e.variantId == variantId)) {
        list.insert(0, WishlistEntry(variantId: variantId, product: product));
      }
    } else {
      list.removeWhere((e) => e.variantId == variantId);
    }
    entries.value = list;
  }

  void clear() {
    variantIds.value = {};
    entries.value = [];
    _loaded = false;
  }
}
