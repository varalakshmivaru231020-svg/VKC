import 'models.dart';

/// Static sample catalog ported from the Claude Design `data.jsx`. Used by the
/// static shop screens (Home / Category / Listing / Product / Cart / Wishlist).
/// The Live and Orders flows use the real API instead.

class Category {
  final String id;
  final String no;
  final String name;
  final String weave;
  final int count;
  final int palette;
  const Category(this.id, this.no, this.name, this.weave, this.count, this.palette);
}

const categories = <Category>[
  Category('kanji', '01', 'Kanjivaram', 'South Indian Silk', 142, 0),
  Category('banar', '02', 'Banarasi', 'Brocade & Zari', 98, 7),
  Category('patola', '03', 'Patola', 'Double Ikat', 44, 3),
  Category('chande', '04', 'Chanderi', 'Sheer Cotton-Silk', 76, 8),
  Category('tussar', '05', 'Tussar', 'Wild Silk', 61, 5),
  Category('paithan', '06', 'Paithani', 'Maharashtrian Silk', 39, 1),
  Category('leheria', '07', 'Leheriya', 'Rajasthani Tie-Dye', 52, 6),
  Category('jamdani', '08', 'Jamdani', 'Bengal Muslin', 47, 2),
];

Product _p(String id, String name, String cat, double price, double mrp, double rating, int reviews,
        String weave, int palette,
        {String? badge, bool isNew = false}) =>
    Product(
      id: id,
      name: name,
      weave: weave,
      price: price,
      mrp: mrp,
      discount: 25,
      rating: rating,
      reviews: reviews,
      palette: palette,
      badge: badge,
      isNew: isNew,
    );

final sampleProducts = <Product>[
  _p('VKC-2401', 'Marigold Border Kanjivaram', 'kanji', 18450, 24600, 4.8, 124, 'Pure Mulberry Silk', 0, badge: 'Bestseller'),
  _p('VKC-2402', 'Emerald Temple Kanjivaram', 'kanji', 21900, 29200, 4.9, 86, 'Pure Mulberry Silk', 1, badge: 'Editor’s Pick'),
  _p('VKC-2403', 'Royal Zari Banarasi', 'banar', 14200, 18900, 4.7, 211, 'Katan Silk', 2, isNew: true),
  _p('VKC-2404', 'Honey Brocade Banarasi', 'banar', 12800, 17066, 4.6, 92, 'Katan Silk', 3, badge: 'Flash'),
  _p('VKC-2405', 'Rani Patola Double Ikat', 'patola', 36500, 48700, 4.9, 41, 'Mashru Silk', 6, badge: 'Heritage'),
  _p('VKC-2406', 'Mist Chanderi', 'chande', 6900, 9200, 4.5, 167, 'Cotton-Silk', 8, isNew: true),
  _p('VKC-2407', 'Onyx Tussar with Kantha', 'tussar', 8400, 11200, 4.7, 78, 'Wild Silk', 4),
  _p('VKC-2408', 'Peacock Paithani Pallu', 'paithan', 28900, 38500, 4.8, 54, 'Paithani Silk', 7, badge: 'Bestseller'),
  _p('VKC-2409', 'Saffron Leheriya', 'leheria', 4900, 6500, 4.4, 198, 'Georgette', 5, isNew: true),
  _p('VKC-2410', 'Ivory Jamdani Muslin', 'jamdani', 9200, 12266, 4.6, 63, 'Bengal Muslin', 8),
];

Product? productById(String id) {
  for (final p in sampleProducts) {
    if (p.id == id) return p;
  }
  return null;
}

/// Product → category id (kept separate from the Product model, which mirrors
/// the API shape and has no category field).
const _productCats = <String, String>{
  'VKC-2401': 'kanji',
  'VKC-2402': 'kanji',
  'VKC-2403': 'banar',
  'VKC-2404': 'banar',
  'VKC-2405': 'patola',
  'VKC-2406': 'chande',
  'VKC-2407': 'tussar',
  'VKC-2408': 'paithan',
  'VKC-2409': 'leheria',
  'VKC-2410': 'jamdani',
};

String? productCat(String id) => _productCats[id];

/// In-memory cache of real products loaded from the API, keyed by serial (== id).
/// Screens fetch inventory once and register it here so Product detail can look
/// a piece up whether it came from the real feed or the static sample set.
final Map<String, Product> _realCatalog = {};

void cacheProducts(Iterable<Product> ps) {
  for (final p in ps) {
    _realCatalog[p.id] = p;
  }
}

/// Look up a product by id/serial: real cache first, then the static sample set.
Product? lookupProduct(String id) => _realCatalog[id] ?? productById(id);

/// "You might also love" — real neighbours from the cache when [p] is real
/// (no weave category exists on real data), else same-category sample pieces.
List<Product> relatedProducts(Product p) {
  if (_realCatalog.containsKey(p.id) && _realCatalog.length > 1) {
    return _realCatalog.values.where((x) => x.id != p.id).take(6).toList();
  }
  return sampleProducts.where((x) => productCat(x.id) == productCat(p.id) && x.id != p.id).take(6).toList();
}
