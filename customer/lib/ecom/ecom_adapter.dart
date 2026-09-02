import '../models.dart';
import 'ecom_models.dart';

/// Adapts a real [EcomProduct] to the display [Product] the design's cards use,
/// so Home / Listing / Wishlist / related rows render unchanged. The card's
/// `id` carries the product SLUG so tapping opens `/product/<slug>` which the
/// detail screen resolves against the ecom API.
/// [variantId] overrides which variant the card stands for — the wishlist
/// saves a specific colour, and un-hearting has to remove that one.
Product productFromEcom(EcomProduct e, {String? variantId}) {
  final v = e.primaryVariant;
  final mrp = v.originalPrice > v.salePrice ? v.originalPrice.toDouble() : null;
  final available = e.variants.fold<int>(0, (s, x) => s + x.availableQty);
  return Product(
    id: e.slug.isNotEmpty ? e.slug : e.id,
    name: e.name,
    weave: e.fabric ?? e.weaveType ?? e.category?.name ?? 'Jaggery',
    price: v.salePrice.toDouble(),
    mrp: mrp,
    discount: v.discountPercent,
    rating: 0,
    reviews: 0,
    palette: paletteFor(e.id),
    badge: e.isFeatured ? 'Featured' : null,
    image: e.image,
    status: available > 0 ? 'AVAILABLE' : 'SOLD',
    qty: available,
    variantId: variantId ?? (v.id.isNotEmpty ? v.id : null),
  );
}

List<Product> productsFromEcom(Iterable<EcomProduct> list) => list.map(productFromEcom).toList();
