import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_client.dart";
import "product_models.dart";

class ProductFilters {
  final String sort;          // "newest" | "price-asc" | "price-desc" | "popular"
  final String? q;
  final String? categorySlug;
  final num? minPrice, maxPrice;
  final bool inStock;
  final bool? isFeatured;
  /// Each entry is `attributeId → selected option`
  final Map<String, String> attributeFilters;

  const ProductFilters({
    this.sort = "newest",
    this.q,
    this.categorySlug,
    this.minPrice, this.maxPrice,
    this.inStock = false,
    this.isFeatured,
    this.attributeFilters = const {},
  });

  Map<String, dynamic> toQuery({required int page, required int limit}) {
    final m = <String, dynamic>{
      "page": "$page",
      "limit": "$limit",
      "sort": sort,
    };
    if (q != null && q!.isNotEmpty)               m["q"] = q;
    if (categorySlug != null)                     m["categorySlug"] = categorySlug;
    if (minPrice != null)                         m["minPrice"] = "$minPrice";
    if (maxPrice != null)                         m["maxPrice"] = "$maxPrice";
    if (inStock)                                  m["inStock"]  = "true";
    if (isFeatured == true)                       m["isFeatured"] = "true";
    attributeFilters.forEach((k, v) {
      if (v.isNotEmpty) m["attr.$k"] = v;
    });
    return m;
  }

  ProductFilters copyWith({
    String? sort, String? q, String? categorySlug,
    num? minPrice, num? maxPrice, bool? inStock, bool? isFeatured,
    Map<String, String>? attributeFilters,
  }) =>
      ProductFilters(
        sort: sort ?? this.sort,
        q: q ?? this.q,
        categorySlug: categorySlug ?? this.categorySlug,
        minPrice: minPrice ?? this.minPrice,
        maxPrice: maxPrice ?? this.maxPrice,
        inStock: inStock ?? this.inStock,
        isFeatured: isFeatured ?? this.isFeatured,
        attributeFilters: attributeFilters ?? this.attributeFilters,
      );
}

class ProductRepository {
  ProductRepository(this._api);
  final ApiClient _api;

  Future<List<Category>> categories({bool flat = false}) async {
    final json = await _api.get<Map<String, dynamic>>("/categories", query: flat ? {"flat": "1"} : null);
    return (json["categories"] as List)
        .map((c) => Category.fromJson((c as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<ProductPage> products({required ProductFilters filters, int page = 1, int limit = 20}) async {
    final json = await _api.get<Map<String, dynamic>>(
      "/products",
      query: filters.toQuery(page: page, limit: limit),
    );
    return ProductPage.fromJson(json);
  }

  Future<({Product product, List<Product> related})> productBySlug(String slug) async {
    final json = await _api.get<Map<String, dynamic>>("/products/$slug");
    final p = Product.fromJson((json["product"] as Map).cast<String, dynamic>());
    final r = (json["related"] as List? ?? const [])
        .map((x) => Product.fromJson((x as Map).cast<String, dynamic>()))
        .toList();
    return (product: p, related: r);
  }

  Future<List<HeroSlide>> heroSlides() async {
    final json = await _api.get<Map<String, dynamic>>("/hero-slides");
    return (json["slides"] as List? ?? const [])
        .map((s) => HeroSlide.fromJson((s as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<List<Banner>> banners() async {
    final json = await _api.get<Map<String, dynamic>>("/banners");
    return (json["banners"] as List? ?? const [])
        .map((b) => Banner.fromJson((b as Map).cast<String, dynamic>()))
        .toList();
  }
}

final productRepositoryProvider = Provider<ProductRepository>(
  (ref) => ProductRepository(ref.watch(apiClientProvider)),
);

/// Cached for the lifetime of the app — categories rarely change. Use
/// `ref.invalidate(categoriesProvider)` to force a refetch.
final categoriesProvider = FutureProvider<List<Category>>(
  (ref) => ref.watch(productRepositoryProvider).categories(),
);

final heroSlidesProvider = FutureProvider<List<HeroSlide>>(
  (ref) => ref.watch(productRepositoryProvider).heroSlides(),
);

final bannersProvider = FutureProvider<List<Banner>>(
  (ref) => ref.watch(productRepositoryProvider).banners(),
);

/// Featured products for the home screen.
final featuredProductsProvider = FutureProvider<List<Product>>((ref) async {
  final page = await ref.watch(productRepositoryProvider).products(
    filters: const ProductFilters(isFeatured: true),
    limit: 8,
  );
  return page.products;
});

/// Single product fetcher — keyed by slug.
final productDetailProvider =
    FutureProvider.family<({Product product, List<Product> related}), String>((ref, slug) {
  return ref.watch(productRepositoryProvider).productBySlug(slug);
});
