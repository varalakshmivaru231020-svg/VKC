import "package:flutter_riverpod/flutter_riverpod.dart";

import "../data/product_repository.dart";

/// User-driven filter state for the shop listing. The infinite_scroll_pagination
/// list watches this and refreshes its first page whenever any field changes.
class ShopFiltersNotifier extends StateNotifier<ProductFilters> {
  ShopFiltersNotifier() : super(const ProductFilters());

  void setSort(String sort)               => state = state.copyWith(sort: sort);
  void setSearch(String? q)               => state = state.copyWith(q: q);
  void setCategory(String? slug)          => state = state.copyWith(categorySlug: slug);
  void setPriceRange({num? min, num? max}) => state = state.copyWith(minPrice: min, maxPrice: max);
  void setInStock(bool v)                 => state = state.copyWith(inStock: v);

  void setAttribute(String attrId, String? option) {
    final next = Map<String, String>.from(state.attributeFilters);
    if (option == null || option.isEmpty) {
      next.remove(attrId);
    } else {
      next[attrId] = option;
    }
    state = state.copyWith(attributeFilters: next);
  }

  void reset() => state = const ProductFilters();
}

final shopFiltersProvider = StateNotifierProvider<ShopFiltersNotifier, ProductFilters>(
  (_) => ShopFiltersNotifier(),
);
