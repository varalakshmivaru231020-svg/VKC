import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../ecom/ecom_adapter.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_wishlist.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets.dart';

// ── Listing (product grid) ───────────────────────────────────────────────────
class ListingScreen extends StatefulWidget {
  final String? cat;
  final String? q;
  /// Opens with the search field focused (tapping the home search bar).
  final bool autofocus;
  /// Only the pieces the store has flagged as featured.
  final bool featured;
  const ListingScreen({super.key, this.cat, this.q, this.autofocus = false, this.featured = false});
  @override
  State<ListingScreen> createState() => _ListingScreenState();
}

class _ListingScreenState extends State<ListingScreen> {
  bool _gridView = true;
  // Two chips both reading "Price" gave no clue which way they sorted; the
  // API takes price-asc and price-desc, so say which is which.
  final _chips = const ['Newest', 'Price: Low to High', 'Price: High to Low', 'In stock'];
  String _sort = 'newest';
  bool _inStock = false;
  List<Product> _catalog = [];
  bool _loading = true;
  bool _error = false;
  String _title = 'All Products';

  static const _pageSize = 24;
  final _scroll = ScrollController();
  int _page = 1;
  int _total = 0;
  bool _hasMore = false;
  bool _loadingMore = false;

  late final TextEditingController _qCtrl = TextEditingController(text: widget.q ?? '');
  String _query = '';
  Timer? _debounce;

  static const _sortMap = {
    'Newest': 'newest',
    'Price: Low to High': 'price-asc',
    'Price: High to Low': 'price-desc',
  };

  @override
  void initState() {
    super.initState();
    _query = widget.q ?? '';
    _scroll.addListener(_onScroll);
    _load();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _scroll.dispose();
    _qCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 600) _loadMore();
  }

  /// Pulls the next page. The catalogue used to stop at the first 40 products
  /// with no way to reach the rest.
  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore || _loading || _error) return;
    setState(() => _loadingMore = true);
    try {
      final page = await EcomApi.I.products(
        categorySlug: widget.cat,
        q: _query.trim().isEmpty ? null : _query.trim(),
        sort: _sort,
        inStock: _inStock,
        isFeatured: widget.featured ? true : null,
        page: _page + 1,
        limit: _pageSize,
      );
      if (!mounted) return;
      final seen = _catalog.map((p) => p.id).toSet();
      setState(() {
        _catalog = [..._catalog, ...productsFromEcom(page.products).where((p) => !seen.contains(p.id))];
        _page += 1;
        _hasMore = page.pagination.hasMore && page.products.isNotEmpty;
        _loadingMore = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingMore = false;
        _hasMore = false;
      });
    }
  }

  /// Re-query 350ms after the customer stops typing, so a search doesn't fire
  /// a request per keystroke.
  void _onQueryChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      if (!mounted || v == _query) return;
      _query = v;
      _load();
    });
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = false;
    });
    try {
      final page = await EcomApi.I.products(
        categorySlug: widget.cat,
        q: _query.trim().isEmpty ? null : _query.trim(),
        sort: _sort,
        inStock: _inStock,
        isFeatured: widget.featured ? true : null,
        page: 1,
        limit: _pageSize,
      );
      if (!mounted) return;
      // Name the category even when it has no products — falling back to the
      // slug beats mislabelling a filtered listing as "All Products".
      final title = widget.cat == null
          ? (widget.featured ? 'Featured' : 'All Products')
          : (page.products.isNotEmpty ? page.products.first.category?.name : null) ?? _titleize(widget.cat!);
      setState(() {
        _catalog = productsFromEcom(page.products);
        _title = title;
        _page = 1;
        _total = page.pagination.total;
        _hasMore = page.pagination.hasMore && page.products.isNotEmpty;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      // Never fall back to sample products — a shopper must not be shown
      // catalogue that isn't really for sale.
      // Keep whatever is already listed: a failed refresh must not throw away
      // a catalogue the shopper is mid-scroll through.
      setState(() {
        _error = _catalog.isEmpty;
        _loading = false;
      });
    }
  }

  Widget _searchField() => Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: VlColors.paper,
            borderRadius: BorderRadius.circular(VlRadii.lg),
            border: Border.all(color: VlColors.rule),
          ),
          child: Row(children: [
            Icon(Icons.search, size: 16, color: VlColors.muted),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _qCtrl,
                autofocus: widget.autofocus,
                textInputAction: TextInputAction.search,
                style: VlText.ui(13),
                // setState so the clear affordance tracks the field.
                onChanged: (v) {
                  setState(() {});
                  _onQueryChanged(v);
                },
                onSubmitted: (v) {
                  _debounce?.cancel();
                  _query = v;
                  _load();
                },
                decoration: InputDecoration(
                  isCollapsed: true,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  hintText: 'Search Kanjivaram, Banarasi, weave…',
                  hintStyle: VlText.ui(13, color: VlColors.muted),
                ),
              ),
            ),
            if (_qCtrl.text.isNotEmpty)
              GestureDetector(
                onTap: () {
                  _debounce?.cancel();
                  _qCtrl.clear();
                  _query = '';
                  FocusScope.of(context).unfocus();
                  _load();
                },
                child: Icon(Icons.close, size: 16, color: VlColors.muted),
              ),
          ]),
        ),
      );

  /// "organic-jaggery" → "Organic Jaggery", for categories the API returned no products for.
  static String _titleize(String slug) => slug
      .split('-')
      .where((w) => w.isNotEmpty)
      .map((w) => '${w[0].toUpperCase()}${w.substring(1)}')
      .join(' ');

  List<Product> get _items => _catalog;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<Set<String>>(
      valueListenable: Wishlist.I.variantIds,
      builder: (context, favs, _) {
        final items = _items;
        return Scaffold(
          backgroundColor: VlColors.canvas,
      floatingActionButton: const VideoCallFab(),
          body: SafeArea(
            child: Column(children: [
              TopBar(
                title: _title,
                onBack: () => context.pop(),
                actions: [
                  GestureDetector(
                    // go, not push — /cart is a ShellRoute child; pushing it
                    // duplicates the shell page key and trips Navigator.
                    onTap: () => context.go('/cart'),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: VlColors.rule2)),
                      child: Icon(Icons.shopping_bag_outlined, size: 16, color: VlColors.ink),
                    ),
                  ),
                ],
              ),
              _searchField(),
              // meta + view toggle
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: Row(children: [
                  Expanded(
                    // The catalogue count, not the count of what has loaded.
                    child: Text('${_total > 0 ? _total : items.length} PIECES',
                        style: VlText.upper(10, letter: 0.18, color: VlColors.muted)),
                  ),
                  _viewBtn(Icons.grid_view, true),
                  const SizedBox(width: 6),
                  _viewBtn(Icons.view_agenda_outlined, false),
                ]),
              ),
              // chips
              SizedBox(
                height: 52,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                  itemCount: _chips.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    final c = _chips[i];
                    final isStock = c == 'In stock';
                    final on = isStock ? _inStock : _sort == _sortMap[c];
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          if (isStock) {
                            _inStock = !_inStock;
                          } else {
                            _sort = _sortMap[c] ?? 'newest';
                          }
                        });
                        _load();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: on ? VlColors.ink : VlColors.paper,
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: on ? VlColors.ink : VlColors.rule2),
                        ),
                        child: Text(c, style: VlText.ui(12, color: on ? Colors.white : VlColors.ink)),
                      ),
                    );
                  },
                ),
              ),
              Expanded(
                child: _loading && _catalog.isEmpty
                    ? const ProductGridSkeleton(count: 6)
                    : _error
                        ? _errorState()
                        : items.isEmpty
                            ? Center(child: Text('No products found', style: VlText.body(13, color: VlColors.muted)))
                            // Matches Home / Wishlist / Orders, which were already refreshable.
                            : RefreshIndicator(
                                color: VlColors.red,
                                onRefresh: _load,
                                child: _gridView ? _grid(items, favs) : _list(items, favs),
                              ),
              ),
            ]),
          ),
        );
      },
    );
  }

  Widget _errorState() => Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 40),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.wifi_off_rounded, size: 36, color: VlColors.muted2),
            const SizedBox(height: 14),
            Text("Couldn't load products", style: VlText.display(20), textAlign: TextAlign.center),
            const SizedBox(height: 6),
            Text('Check your connection and try again.',
                style: VlText.body(13, color: VlColors.muted), textAlign: TextAlign.center),
            const SizedBox(height: 18),
            GestureDetector(
              onTap: _load,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
                child: Text('RETRY', style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.12)),
              ),
            ),
          ]),
        ),
      );

  Widget _viewBtn(IconData ic, bool grid) {
    final on = _gridView == grid;
    return GestureDetector(
      onTap: () => setState(() => _gridView = grid),
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: on ? VlColors.ink : Colors.transparent,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: VlColors.rule2),
        ),
        child: Icon(ic, size: 13, color: on ? Colors.white : VlColors.muted),
      ),
    );
  }

  /// Sits under the last row while the next page is on its way.
  Widget get _moreSpinner => Padding(
        padding: const EdgeInsets.only(bottom: 20),
        child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: VlColors.red))),
      );

  Widget _grid(List<Product> items, Set<String> favs) => CustomScrollView(
        controller: _scroll,
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
            // SliverLayoutBuilder gives the padded cross-axis width, so the
            // tile maths matches what the grid actually has to work with.
            sliver: SliverLayoutBuilder(
              builder: (context, sliverConstraints) => SliverGrid.builder(
                // Same geometry as Home, so a product looks identical wherever
                // the customer meets it.
                gridDelegate: productGridDelegate(context, sliverConstraints.crossAxisExtent),
                itemCount: items.length,
                itemBuilder: (context, i) {
                  final p = items[i];
                  return ProductCard(
                    key: ValueKey(p.variantId ?? p.id),
                    p: p,
                    fav: favs.contains(p.variantId),
                    onFav: () => toggleWishlist(context, p),
                    onTap: () => context.push('/product/${p.id}'),
                  );
                },
              ),
            ),
          ),
          if (_loadingMore) SliverToBoxAdapter(child: _moreSpinner),
        ],
      );

  Widget _list(List<Product> items, Set<String> favs) => ListView.separated(
        controller: _scroll,
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
        itemCount: items.length + (_loadingMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: 14),
        itemBuilder: (_, i) {
          if (i >= items.length) return _moreSpinner;
          final p = items[i];
          return GestureDetector(
            onTap: () => context.push('/product/${p.id}'),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: VlColors.paper,
                border: Border.all(color: VlColors.rule),
                borderRadius: BorderRadius.circular(VlRadii.md),
              ),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                SizedBox(width: 100, height: 130, child: ProductImage(p: p)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(p.weave.toUpperCase(), style: VlText.upper(9, color: VlColors.muted2, letter: 0.16)),
                    const SizedBox(height: 4),
                    Text(p.name, style: VlText.ui(14, weight: FontWeight.w500)),
                    const SizedBox(height: 6),
                    // The catalogue API carries no ratings, so the list view
                    // showed "0 · 0" beside a gold star on every product.
                    if (p.rating > 0)
                      Row(children: [
                        Icon(Icons.star, size: 11, color: VlColors.gold),
                        const SizedBox(width: 2),
                        Text('${p.rating} · ${p.reviews}', style: VlText.mono(10, color: VlColors.muted)),
                      ]),
                    const SizedBox(height: 8),
                    PriceRow(value: p.price, mrp: p.mrp, showDiscount: true),
                  ]),
                ),
                GestureDetector(
                  onTap: () => toggleWishlist(context, p),
                  child: Icon(favs.contains(p.variantId) ? Icons.favorite : Icons.favorite_border,
                      size: 16, color: favs.contains(p.variantId) ? VlColors.red : VlColors.ink),
                ),
              ]),
            ),
          );
        },
      );

}
