import '../models.dart';
import 'ecom_models.dart';

/// Adapts a real [EcomProduct] to the display [Product] the cards use, so
/// Home / Shop / Search / Wishlist / related rows render one component. The
/// card's `id` carries the product SLUG so tapping opens `/product/<slug>`.
/// [variantId] overrides which variant the card stands for — the wishlist
/// saves a specific variant, and un-hearting has to remove that one.
Product productFromEcom(EcomProduct e, {String? variantId}) {
  final v = variantId == null
      ? e.displayVariant
      : e.variants.where((x) => x.id == variantId).firstOrNull ?? e.displayVariant;
  final mrp = v.originalPrice > v.salePrice ? v.originalPrice.toDouble() : null;
  return Product(
    id: e.slug.isNotEmpty ? e.slug : e.id,
    name: e.name,
    category: e.category?.name ?? 'Jaggery',
    price: v.salePrice.toDouble(),
    mrp: mrp,
    image: v.images.isNotEmpty ? v.images.first.url : e.image,
    qty: e.availableQty,
    variantId: v.id.isNotEmpty ? v.id : null,
    productId: e.id,
    isNew: e.isNew,
    badge: e.isFeatured ? 'Featured' : null,
    palette: paletteFor(e.id),
    source: e,
  );
}

List<Product> productsFromEcom(Iterable<EcomProduct> list) => list.map(productFromEcom).toList();
