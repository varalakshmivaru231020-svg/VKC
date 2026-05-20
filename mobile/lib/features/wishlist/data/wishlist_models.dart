import "../../shop/data/product_models.dart";

/// One row of `/api/v1/wishlist`. The backend returns the variant with its
/// images and the parent product, which is enough for a list-card render.
class WishlistItem {
  final String id;
  final DateTime addedAt;
  final ProductVariant variant;
  final String productId, productName, productSlug;

  const WishlistItem({
    required this.id,
    required this.addedAt,
    required this.variant,
    required this.productId,
    required this.productName,
    required this.productSlug,
  });

  factory WishlistItem.fromJson(Map<String, dynamic> j) {
    final v = (j["variant"] as Map).cast<String, dynamic>();
    final p = ((v["product"] as Map?) ?? {}).cast<String, dynamic>();
    return WishlistItem(
      id:      j["id"] as String,
      addedAt: DateTime.tryParse("${j["addedAt"]}") ?? DateTime.now(),
      variant: ProductVariant.fromJson(v),
      productId:   p["id"]   as String? ?? v["productId"] as String? ?? "",
      productName: p["name"] as String? ?? "",
      productSlug: p["slug"] as String? ?? "",
    );
  }
}
