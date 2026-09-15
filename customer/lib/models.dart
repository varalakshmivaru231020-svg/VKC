import 'ecom/ecom_models.dart';

/// Deterministic index from an id, so a category or product without artwork
/// always gets the same placeholder tone.
int paletteFor(String? key) {
  final s = key ?? '';
  var h = 0;
  for (final c in s.codeUnits) {
    h = (h * 31 + c) & 0x7fffffff;
  }
  return h % 6;
}

/// What a product card draws. Built from an [EcomProduct] by
/// `productFromEcom`; the card never talks to the API model directly, so the
/// grid on Home, Shop, Search and Wishlist stays one component.
class Product {
  /// The product SLUG — tapping a card opens `/product/<slug>`.
  final String id;
  final String name;

  /// Category name, drawn as the small label above the product name.
  final String category;
  final double price;
  final double? mrp;
  final String? image;
  final int qty;
  final String? variantId;
  final String? productId;
  final bool isNew;
  final String? badge;
  final int palette;

  /// The full record, when the card came from the catalogue, so "add to cart"
  /// on the card can build the same cart line the detail screen would.
  final EcomProduct? source;

  const Product({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    this.mrp,
    this.image,
    this.qty = 0,
    this.variantId,
    this.productId,
    this.isNew = false,
    this.badge,
    this.palette = 0,
    this.source,
  });

  bool get inStock => qty > 0;
  bool get soldOut => !inStock;
}
