import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_client.dart";
import "../../auth/data/auth_controller.dart";
import "wishlist_models.dart";

class WishlistRepository {
  WishlistRepository(this._api);
  final ApiClient _api;

  Future<List<WishlistItem>> list() async {
    final json = await _api.get<Map<String, dynamic>>("/wishlist");
    return (json["items"] as List? ?? const [])
        .map((e) => WishlistItem.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<void> add(String variantId) =>
      _api.post<dynamic>("/wishlist", body: {"variantId": variantId});

  Future<void> remove(String variantId) =>
      _api.delete<dynamic>("/wishlist", query: {"variantId": variantId});
}

final wishlistRepositoryProvider = Provider<WishlistRepository>(
  (ref) => WishlistRepository(ref.watch(apiClientProvider)),
);

/// Wishlist state — empty list until logged in. Re-fetches on auth changes.
final wishlistProvider = FutureProvider<List<WishlistItem>>((ref) async {
  final auth = ref.watch(authControllerProvider);
  if (!auth.isLoggedIn) return const [];
  return ref.watch(wishlistRepositoryProvider).list();
});

/// Convenience: set of variant ids in the wishlist (for "is wishlisted?" UI).
final wishlistVariantIdsProvider = Provider<Set<String>>((ref) {
  return ref.watch(wishlistProvider).asData?.value
          .map((it) => it.variant.id)
          .toSet() ??
      const <String>{};
});

/// One-line API for toggling a variant from the wishlist. Invalidates the
/// list provider on success so the UI refreshes.
class ToggleWishlist {
  ToggleWishlist(this._repo, this._invalidate);
  final WishlistRepository _repo;
  final void Function() _invalidate;

  Future<bool> call({required String variantId, required bool isWishlisted}) async {
    if (isWishlisted) {
      await _repo.remove(variantId);
    } else {
      await _repo.add(variantId);
    }
    _invalidate();
    return !isWishlisted;
  }
}

final toggleWishlistProvider = Provider<ToggleWishlist>((ref) {
  return ToggleWishlist(
    ref.watch(wishlistRepositoryProvider),
    () => ref.invalidate(wishlistProvider),
  );
});
