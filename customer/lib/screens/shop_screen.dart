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
  int get _filterCount => (_inStock ? 1 : 0) + (_priceActive ? 1 : 0) + (_sort != 'newest' ? 1 : 0);
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
      _header(),
      _toolbar(),
      Expanded(child: _body()),
    ]);
  }

  /// Marketplace-style top bar: a back arrow on a pushed listing, the search
  /// field carrying the current query or category, and the cart.
  Widget _header() {
    final q = (widget.q ?? '').trim();
    final hint = q.isNotEmpty ? q : (_fixedCategory ? _title : 'Search jaggery, syrups, gift boxes…');
    return Container(
      color: VkColors.canvas,
      padding: EdgeInsets.fromLTRB(widget.asTab ? 20 : 8, 10, 8, 10),
      child: Row(children: [
        if (!widget.asTab) ...[
          TopBar.action(Icons.arrow_back_rounded, () => context.canPop() ? context.pop() : context.go('/shop'), tooltip: 'Back'),
          const SizedBox(width: 2),
        ],
        Expanded(
          child: Semantics(
            button: true,
            label: 'Search products',
            child: PressScale(
              onTap: () => context.push(q.isNotEmpty ? '/search?q=${Uri.encodeComponent(q)}' : '/search'),
              scale: 0.985,
              child: Container(
                height: 46,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: VkColors.paper,
                  borderRadius: BorderRadius.circular(VkRadii.md),
                  border: Border.all(color: q.isNotEmpty || _fixedCategory ? VkColors.primary : VkColors.rule, width: q.isNotEmpty || _fixedCategory ? 1.5 : 1),
                ),
                child: Row(children: [
                  const Icon(Icons.search_rounded, size: 20, color: VkColors.ink),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(hint, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: VkText.ui(13.5, color: q.isNotEmpty || _fixedCategory ? VkColors.ink : VkColors.muted, weight: q.isNotEmpty || _fixedCategory ? FontWeight.w600 : FontWeight.w400)),
                  ),
                ]),
              ),
            ),
          ),
        ),
        const SizedBox(width: 4),
        InkResponse(
          onTap: () => context.go('/cart'),
          radius: 24,
          child: const SizedBox(width: 44, height: 44, child: Center(child: CartIconBadge(size: 23))),
        ),
      ]),
    );
  }

  /// Quick pills: Sort & Filter opens everything; Price, Category and In
  /// stock each change one thing on the spot.
  Widget _toolbar() {
    final showCats = !_fixedCategory && _cats.isNotEmpty;
    final catLabel = _catSlug == null ? 'Category' : (_cats.cast<EcomCategory?>().firstWhere((c) => c!.slug == _catSlug, orElse: () => null)?.name ?? 'Category');
    return Container(
      decoration: const BoxDecoration(color: VkColors.canvas, border: Border(bottom: BorderSide(color: VkColors.rule))),
      padding: const EdgeInsets.only(top: 4, bottom: 10),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(children: [
          _Pill(icon: Icons.tune_rounded, label: _filterCount == 0 ? 'Sort & Filter' : 'Sort & Filter · $_filterCount', active: _filterCount > 0, onTap: _openFilters),
          const SizedBox(width: 8),
          _Pill(label: _priceActive ? _priceLabel : 'Price', chevron: true, active: _priceActive, onTap: _openPrice),
          if (showCats) ...[
            const SizedBox(width: 8),
            _Pill(label: catLabel, chevron: true, active: _catSlug != null, onTap: _openCategory),
          ],
          const SizedBox(width: 8),
          _Pill(label: 'In stock', active: _inStock, onTap: () {
            setState(() => _inStock = !_inStock);
            _load();
          }),
        ]),
      ),
    );
  }

  String get _priceLabel {
    final lo = _price.start.round();
    final hi = _price.end.round();
    if (lo == 0) return 'Under ₹${inr(hi)}';
    if (hi >= _priceCap) return '₹${inr(lo)}+';
    return '₹${inr(lo)} – ₹${inr(hi)}';
  }

  void _pickCat(String? slug) {
    if (_catSlug == slug) return;
    setState(() => _catSlug = slug);
    _load();
  }

  Future<void> _openFilters() async {
    final result = await showModalBottomSheet<_FilterResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: VkColors.canvas,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _FilterSheet(sort: _sort, inStock: _inStock, price: _price),
    );
    if (result == null || !mounted) return;
    setState(() {
      _sort = result.sort;
      _inStock = result.inStock;
      _price = result.price;
    });
    _load();
  }

  Future<void> _openPrice() async {
    final result = await showModalBottomSheet<RangeValues>(
      context: context,
      backgroundColor: VkColors.canvas,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _PriceSheet(price: _price),
    );
    if (result == null || !mounted) return;
    setState(() => _price = result);
    _load();
  }

  Future<void> _openCategory() async {
    final picked = await showModalBottomSheet<String?>(
      context: context,
      backgroundColor: VkColors.canvas,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _SheetFrame(
        title: 'Category',
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          for (final c in [null, ..._cats])
            ListTile(
              onTap: () => Navigator.pop(ctx, c?.slug ?? ''),
              leading: c == null
                  ? const Icon(Icons.grid_view_rounded, size: 20, color: VkColors.primaryDeep)
                  : SizedBox(width: 32, height: 32, child: ClipOval(child: NetImage(url: c.imageUrl, radius: 0, seed: paletteFor(c.slug), placeholderIcon: Icons.grass_rounded))),
              title: Text(c?.name ?? 'All categories', style: VkText.ui(14, weight: (c?.slug) == _catSlug ? FontWeight.w600 : FontWeight.w400)),
              trailing: Icon((c?.slug) == _catSlug ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                  color: (c?.slug) == _catSlug ? VkColors.primary : VkColors.rule2),
              contentPadding: const EdgeInsets.symmetric(horizontal: 20),
            ),
        ]),
      ),
    );
    if (picked == null || !mounted) return;
    _pickCat(picked.isEmpty ? null : picked);
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

/// A toolbar pill: optional leading icon, label, optional chevron; filled
/// dark when active.
class _Pill extends StatelessWidget {
  final IconData? icon;
  final String label;
  final bool chevron;
  final bool active;
  final VoidCallback onTap;
  const _Pill({this.icon, required this.label, this.chevron = false, this.active = false, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final fg = active ? Colors.white : VkColors.ink;
    return Semantics(
      button: true,
      selected: active,
      label: label,
      child: PressScale(
        onTap: onTap,
        child: Container(
          height: 38,
          padding: EdgeInsets.only(left: icon != null ? 12 : 14, right: chevron ? 10 : 14),
          decoration: BoxDecoration(
            color: active ? VkColors.primaryInk : VkColors.paper,
            borderRadius: BorderRadius.circular(VkRadii.md),
            border: Border.all(color: active ? VkColors.primaryInk : VkColors.rule),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            if (icon != null) ...[Icon(icon, size: 17, color: fg), const SizedBox(width: 7)],
            Text(label, style: VkText.ui(13, weight: FontWeight.w600, color: fg)),
            if (chevron) ...[const SizedBox(width: 4), Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: fg)],
          ]),
        ),
      ),
    );
  }
}

/// Just the price range, applied on its own.
class _PriceSheet extends StatefulWidget {
  final RangeValues price;
  const _PriceSheet({required this.price});
  @override
  State<_PriceSheet> createState() => _PriceSheetState();
}

class _PriceSheetState extends State<_PriceSheet> {
  late RangeValues _price = widget.price;
  @override
  Widget build(BuildContext context) {
    final lo = _price.start.round();
    final hi = _price.end.round();
    return _SheetFrame(
      title: 'Price',
      footer: Row(children: [
        Expanded(child: OutlineButton(label: 'Any price', height: 48, onTap: () => Navigator.pop(context, const RangeValues(0, _priceCap)))),
        const SizedBox(width: 10),
        Expanded(flex: 2, child: PrimaryButton(label: 'Apply', height: 48, onTap: () => Navigator.pop(context, _price))),
      ]),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 4),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
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
          const SizedBox(height: 6),
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (final cap in const [200, 500, 1000, 2000])
              VkChip(label: 'Under ₹${inr(cap)}', selected: lo == 0 && hi == cap, onTap: () => setState(() => _price = RangeValues(0, cap.toDouble()))),
          ]),
        ]),
      ),
    );
  }
}

class _FilterResult {
  final String sort;
  final bool inStock;
  final RangeValues price;
  const _FilterResult(this.sort, this.inStock, this.price);
}

/// Sort, availability and price in one sheet, applied together.
class _FilterSheet extends StatefulWidget {
  final String sort;
  final bool inStock;
  final RangeValues price;
  const _FilterSheet({required this.sort, required this.inStock, required this.price});
  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late String _sort = widget.sort;
  late bool _inStock = widget.inStock;
  late RangeValues _price = widget.price;

  @override
  Widget build(BuildContext context) {
    final lo = _price.start.round();
    final hi = _price.end.round();
    return _SheetFrame(
      title: 'Filter & sort',
      footer: Row(children: [
        Expanded(
          child: OutlineButton(
            label: 'Reset',
            height: 48,
            onTap: () => setState(() {
              _sort = 'newest';
              _inStock = false;
              _price = const RangeValues(0, _priceCap);
            }),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(flex: 2, child: PrimaryButton(label: 'Show products', height: 48, onTap: () => Navigator.pop(context, _FilterResult(_sort, _inStock, _price)))),
      ]),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 4),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('SORT BY', style: VkText.upper(9, letter: 0.18)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (final s in _sorts) VkChip(label: s.label, selected: s.id == _sort, onTap: () => setState(() => _sort = s.id)),
          ]),
          const SizedBox(height: 18),
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
