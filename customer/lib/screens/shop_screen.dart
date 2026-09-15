import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../ecom/ecom_adapter.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_models.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets.dart';

/// The Shop tab: the whole catalogue with search, category, sort and filters.
class ShopScreen extends StatelessWidget {
  const ShopScreen({super.key});
  @override
  Widget build(BuildContext context) => const ProductListing(asTab: true);
}

/// A pushed listing — one category, a search, or the featured pieces.
class ListingScreen extends StatelessWidget {
  final String? cat;
  final String? q;
  final bool featured;
  final String? title;
  const ListingScreen({super.key, this.cat, this.q, this.featured = false, this.title});
  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: VkColors.canvas,
        body: SafeArea(child: ProductListing(cat: cat, q: q, featured: featured, title: title)),
      );
}

class _Sort {
  final String id, label;
  const _Sort(this.id, this.label);
}

const _sorts = [
  _Sort('newest', 'Newest first'),
  _Sort('popular', 'Popular'),
  _Sort('price-asc', 'Price: low to high'),
  _Sort('price-desc', 'Price: high to low'),
];

const _priceCap = 5000.0;

/// The product grid with its filter bar and infinite scroll. Used by the
/// Shop tab, category listings and search results so they behave identically.
class ProductListing extends StatefulWidget {
  final String? cat;
  final String? q;
  final bool featured;
  final bool asTab;
  final String? title;

  /// Search results draw their own field above; hide the header here.
  final bool showHeader;
  const ProductListing({
    super.key,
    this.cat,
    this.q,
    this.featured = false,
    this.asTab = false,
    this.title,
    this.showHeader = true,
  });

  @override
  State<ProductListing> createState() => _ProductListingState();
}

class _ProductListingState extends State<ProductListing> {
  static const _pageSize = 24;
  final _scroll = ScrollController();

  String _sort = 'newest';
  bool _inStock = false;
  RangeValues _price = const RangeValues(0, _priceCap);
  String? _catSlug;
  List<EcomCategory> _cats = const [];

  List<Product> _items = const [];
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = false;
  int _page = 1;
  int _total = 0;
  Object? _error;
  int _request = 0;

  bool get _priceActive => _price.start > 0 || _price.end < _priceCap;
  int get _filterCount => (_inStock ? 1 : 0) + (_priceActive ? 1 : 0);
  bool get _fixedCategory => widget.cat != null;

  @override
  void initState() {
    super.initState();
    _catSlug = widget.cat;
    _scroll.addListener(_onScroll);
    _load();
    if (!_fixedCategory) _loadCats();
  }

  @override
  void didUpdateWidget(covariant ProductListing old) {
    super.didUpdateWidget(old);
    if (old.q != widget.q || old.cat != widget.cat || old.featured != widget.featured) {
      _catSlug = widget.cat;
      _load();
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _loadCats() async {
    try {
      final cats = await EcomApi.I.categories();
      if (mounted) setState(() => _cats = cats);
    } catch (_) {
      // Chips are a convenience; the grid still works without them.
    }
  }

  void _onScroll() {
    if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 600) _loadMore();
  }

  Future<ProductPage> _fetch(int page) => EcomApi.I.products(
        categorySlug: _catSlug,
        q: (widget.q ?? '').trim().isEmpty ? null : widget.q!.trim(),
        sort: _sort,
        inStock: _inStock,
        isFeatured: widget.featured ? true : null,
        minPrice: _price.start > 0 ? _price.start.round() : null,
        maxPrice: _price.end < _priceCap ? _price.end.round() : null,
        page: page,
        limit: _pageSize,
      );

  Future<void> _load() async {
    final req = ++_request;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final page = await _fetch(1);
      if (!mounted || req != _request) return;
      setState(() {
        _items = productsFromEcom(page.products);
        _page = 1;
        _total = page.pagination.total;
        _hasMore = page.pagination.hasMore && page.products.isNotEmpty;
        _loading = false;
      });
      if (_scroll.hasClients) _scroll.jumpTo(0);
    } catch (e) {
      if (!mounted || req != _request) return;
      // Keep whatever is already listed: a failed refresh must not throw away
      // a catalogue the shopper is mid-scroll through.
      setState(() {
        _error = _items.isEmpty ? e : null;
        _loading = false;
      });
      if (_items.isNotEmpty) toast(context, ecomError(e, 'Could not refresh products'));
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore || _loading || _error != null) return;
    setState(() => _loadingMore = true);
    final req = _request;
    try {
      final page = await _fetch(_page + 1);
      if (!mounted || req != _request) return;
      final seen = _items.map((p) => p.id).toSet();
      setState(() {
        _items = [..._items, ...productsFromEcom(page.products).where((p) => !seen.contains(p.id))];
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

  void _clearFilters() {
    setState(() {
      _inStock = false;
      _price = const RangeValues(0, _priceCap);
      _sort = 'newest';
      if (!_fixedCategory) _catSlug = null;
    });
    _load();
  }

  String get _title {
    if (widget.title != null && widget.title!.isNotEmpty) return widget.title!;
    if ((widget.q ?? '').isNotEmpty) return 'Results';
    if (widget.featured) return 'Featured';
    if (widget.cat != null) return _titleize(widget.cat!);
    return 'Shop';
  }

  static String _titleize(String slug) =>
      slug.split('-').where((w) => w.isNotEmpty).map((w) => '${w[0].toUpperCase()}${w.substring(1)}').join(' ');

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      if (widget.showHeader) _header(),
      _toolbar(),
      Expanded(child: _body()),
    ]);
  }

  Widget _header() {
    final count = _loading ? null : '${_total > 0 ? _total : _items.length} product${(_total > 0 ? _total : _items.length) == 1 ? '' : 's'}';
    if (widget.asTab) {
      return TabHeader(
        title: 'Shop',
        subtitle: count ?? 'The full VKC Gold Ikshu range',
        actions: [TopBar.action(Icons.search_rounded, () => context.push('/search'), tooltip: 'Search')],
      );
    }
    return TopBar(
      title: _title,
      onBack: () => context.canPop() ? context.pop() : context.go('/shop'),
      actions: [
        TopBar.action(Icons.search_rounded, () => context.push('/search'), tooltip: 'Search'),
        const SizedBox(width: 4),
        InkResponse(
          onTap: () => context.go('/cart'),
          radius: 24,
          child: const SizedBox(width: 44, height: 44, child: Center(child: CartIconBadge(size: 22))),
        ),
      ],
    );
  }

  /// Sort + filter buttons, then the category chips (when the category is
  /// not already fixed by the route).
  Widget _toolbar() {
    final showCats = !_fixedCategory && _cats.isNotEmpty;
    final sortLabel = _sorts.firstWhere((s) => s.id == _sort, orElse: () => _sorts.first).label;
    return Container(
      decoration: const BoxDecoration(color: VkColors.canvas, border: Border(bottom: BorderSide(color: VkColors.rule))),
      padding: const EdgeInsets.only(top: 6, bottom: 10),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(children: [
          VkChip(
            label: _filterCount == 0 ? 'Filters' : 'Filters · $_filterCount',
            icon: Icons.tune_rounded,
            selected: _filterCount > 0,
            onTap: _openFilters,
          ),
          const SizedBox(width: 8),
          VkChip(label: sortLabel, icon: Icons.swap_vert_rounded, onTap: _openSort),
          if (showCats) ...[
            Container(width: 1, height: 22, margin: const EdgeInsets.symmetric(horizontal: 10), color: VkColors.rule2),
            VkChip(label: 'All', selected: _catSlug == null, onTap: () => _pickCat(null)),
            for (final c in _cats) ...[
              const SizedBox(width: 8),
              VkChip(label: c.name, selected: _catSlug == c.slug, onTap: () => _pickCat(c.slug)),
            ],
          ],
        ]),
      ),
    );
  }

  void _pickCat(String? slug) {
    if (_catSlug == slug) return;
    setState(() => _catSlug = slug);
    _load();
  }

  Future<void> _openSort() async {
    final picked = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => _SheetFrame(
        title: 'Sort by',
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          for (final s in _sorts)
            ListTile(
              onTap: () => Navigator.pop(ctx, s.id),
              title: Text(s.label, style: VkText.ui(14, weight: s.id == _sort ? FontWeight.w600 : FontWeight.w400)),
              trailing: Icon(s.id == _sort ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                  color: s.id == _sort ? VkColors.primary : VkColors.rule2),
              contentPadding: const EdgeInsets.symmetric(horizontal: 20),
            ),
        ]),
      ),
    );
    if (picked == null || picked == _sort || !mounted) return;
    setState(() => _sort = picked);
    _load();
  }

  Future<void> _openFilters() async {
    final result = await showModalBottomSheet<(bool, RangeValues)>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _FilterSheet(inStock: _inStock, price: _price),
    );
    if (result == null || !mounted) return;
    setState(() {
      _inStock = result.$1;
      _price = result.$2;
    });
    _load();
  }

  Widget _body() {
    if (_loading && _items.isEmpty) return const ProductGridSkeleton(count: 6);
    if (_error != null && _items.isEmpty) return StateView.error(_error, onRetry: _load);
    if (_items.isEmpty) {
      final q = (widget.q ?? '').trim();
      return StateView(
        icon: Icons.search_off_rounded,
        title: 'No products found',
        body: q.isNotEmpty ? 'Nothing matches “$q”. Try a different word or browse a category.' : 'Try clearing the filters to see more.',
        cta: _filterCount > 0 || (_catSlug != null && !_fixedCategory) ? 'Clear filters' : (widget.asTab ? null : 'Browse all'),
        onCta: _filterCount > 0 || (_catSlug != null && !_fixedCategory) ? _clearFilters : () => context.go('/shop'),
      );
    }
    return RefreshIndicator(
      color: VkColors.primary,
      onRefresh: _load,
      child: CustomScrollView(
        controller: _scroll,
        slivers: [
          if (!widget.showHeader || widget.asTab)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
                child: Text('${_total > 0 ? _total : _items.length} PRODUCTS', style: VkText.upper(9, color: VkColors.muted, letter: 0.16)),
              ),
            ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
            sliver: SliverLayoutBuilder(
              builder: (context, c) => SliverGrid.builder(
                gridDelegate: productGridDelegate(context, c.crossAxisExtent),
                itemCount: _items.length,
                itemBuilder: (context, i) {
                  final p = _items[i];
                  return ProductCard(
                    key: ValueKey(p.variantId ?? p.id),
                    p: p,
                    onFav: () => toggleWishlist(context, p),
                    onAdd: () => quickAddToCart(context, p),
                    onTap: () => context.push('/product/${p.id}'),
                  );
                },
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 64,
              child: _loadingMore
                  ? const Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)))
                  : (!_hasMore && _items.length > 6
                      ? Center(child: Text('THAT’S EVERYTHING', style: VkText.upper(8.5, color: VkColors.muted2, letter: 0.2)))
                      : null),
            ),
          ),
        ],
      ),
    );
  }
}

/// Bottom-sheet chrome: grabber, title, content.
class _SheetFrame extends StatelessWidget {
  final String title;
  final Widget child;
  final Widget? footer;
  const _SheetFrame({required this.title, required this.child, this.footer});
  @override
  Widget build(BuildContext context) => SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const SizedBox(height: 12),
            Container(width: 36, height: 4, decoration: BoxDecoration(color: VkColors.rule2, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 14),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(children: [
                Expanded(child: Text(title, style: VkText.display(22))),
                InkResponse(onTap: () => Navigator.pop(context), radius: 20, child: const Icon(Icons.close_rounded, size: 20, color: VkColors.muted)),
              ]),
            ),
            const SizedBox(height: 6),
            Flexible(child: SingleChildScrollView(child: child)),
            if (footer != null) Padding(padding: const EdgeInsets.fromLTRB(20, 8, 20, 16), child: footer),
            if (footer == null) const SizedBox(height: 12),
          ]),
        ),
      );
}

class _FilterSheet extends StatefulWidget {
  final bool inStock;
  final RangeValues price;
  const _FilterSheet({required this.inStock, required this.price});
  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late bool _inStock = widget.inStock;
  late RangeValues _price = widget.price;

  @override
  Widget build(BuildContext context) {
    final lo = _price.start.round();
    final hi = _price.end.round();
    return _SheetFrame(
      title: 'Filters',
      footer: Row(children: [
        Expanded(
          child: OutlineButton(
            label: 'Reset',
            height: 48,
            onTap: () => setState(() {
              _inStock = false;
              _price = const RangeValues(0, _priceCap);
            }),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(flex: 2, child: PrimaryButton(label: 'Show products', height: 48, onTap: () => Navigator.pop(context, (_inStock, _price)))),
      ]),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 4),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('AVAILABILITY', style: VkText.upper(9, letter: 0.18)),
          SwitchListTile.adaptive(
            value: _inStock,
            onChanged: (v) => setState(() => _inStock = v),
            title: Text('In stock only', style: VkText.ui(14)),
            contentPadding: EdgeInsets.zero,
            activeTrackColor: VkColors.primary,
          ),
          const SizedBox(height: 8),
          Text('PRICE', style: VkText.upper(9, letter: 0.18)),
          const SizedBox(height: 6),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(lo == 0 ? 'Any' : '₹${inr(lo)}', style: VkText.ui(14, weight: FontWeight.w600)),
            Text(hi >= _priceCap ? '₹${inr(_priceCap)}+' : '₹${inr(hi)}', style: VkText.ui(14, weight: FontWeight.w600)),
          ]),
          RangeSlider(
            values: _price,
            min: 0,
            max: _priceCap,
            divisions: 50,
            activeColor: VkColors.primary,
            inactiveColor: VkColors.rule2,
            labels: RangeLabels('₹${inr(lo)}', hi >= _priceCap ? '₹${inr(_priceCap)}+' : '₹${inr(hi)}'),
            onChanged: (v) => setState(() => _price = v),
          ),
        ]),
      ),
    );
  }
}
