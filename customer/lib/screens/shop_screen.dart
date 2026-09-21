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
  _Sort('newest', 'New arrivals'),
  _Sort('price-asc', 'Price: low to high'),
  _Sort('price-desc', 'Price: high to low'),
  _Sort('discount', 'Discount: high to low'),
  _Sort('rating', 'Customer rating'),
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
  Set<String> _catSlugs = const {};
  int? _minDiscount;
  int? _minRating;
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
  int get _filterCount =>
      (_inStock ? 1 : 0) + (_priceActive ? 1 : 0) + (_catSlugs.isNotEmpty ? 1 : 0) + (_minDiscount != null ? 1 : 0) + (_minRating != null ? 1 : 0);
  bool get _fixedCategory => widget.cat != null;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    _load();
    if (!_fixedCategory) _loadCats();
  }

  @override
  void didUpdateWidget(covariant ProductListing old) {
    super.didUpdateWidget(old);
    if (old.q != widget.q || old.cat != widget.cat || old.featured != widget.featured) {
      _catSlugs = const {};
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
      // Parents and their children in one flat list for the check boxes.
      final flat = [
        for (final c in cats) ...[c, ...c.children],
      ];
      if (mounted) setState(() => _cats = flat);
    } catch (_) {
      // Chips are a convenience; the grid still works without them.
    }
  }

  void _onScroll() {
    if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 600) _loadMore();
  }

  Future<ProductPage> _fetch(int page) => EcomApi.I.products(
        // One category goes as `categorySlug`, which every server version reads.
        categorySlug: widget.cat ?? (_catSlugs.length == 1 ? _catSlugs.first : null),
        categorySlugs: widget.cat == null && _catSlugs.length > 1 ? _catSlugs.toList() : const [],
        minDiscount: _minDiscount,
        minRating: _minRating,
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
      _catSlugs = const {};
      _minDiscount = null;
      _minRating = null;
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

  /// Marketplace toolbar: Sort, Category, Price and Filter as equal cells
  /// split by hairlines. Category and Price open the filter sheet on their
  /// own section.
  Widget _toolbar() {
    final cells = <Widget>[
      _BarCell(label: 'Sort', active: _sort != 'newest', onTap: _openSort),
      if (!_fixedCategory) _BarCell(label: 'Category', active: _catSlugs.isNotEmpty, onTap: () => _openFilters(_Section.category)),
      _BarCell(label: 'Price', active: _priceActive, onTap: () => _openFilters(_Section.price)),
      _BarCell(
        label: _filterCount == 0 ? 'Filter' : 'Filter ($_filterCount)',
        icon: Icons.tune_rounded,
        active: _filterCount > 0,
        onTap: () => _openFilters(_fixedCategory ? _Section.price : _Section.category),
      ),
    ];
    return Container(
      decoration: const BoxDecoration(
        color: VkColors.cream,
        border: Border(top: BorderSide(color: VkColors.rule), bottom: BorderSide(color: VkColors.rule)),
      ),
      child: Row(children: [
        for (var i = 0; i < cells.length; i++) ...[
          if (i > 0) Container(width: 1, height: 46, color: VkColors.rule2),
          Expanded(child: cells[i]),
        ],
      ]),
    );
  }

  Future<void> _openSort() async {
    final result = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: VkColors.paper,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _SortSheet(sort: _sort),
    );
    if (result == null || result == _sort || !mounted) return;
    setState(() => _sort = result);
    _load();
  }

  Future<void> _openFilters(_Section section) async {
    final result = await showModalBottomSheet<_Filters>(
      context: context,
      isScrollControlled: true,
      backgroundColor: VkColors.paper,
      clipBehavior: Clip.antiAlias,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
        child: _FilterSheet(
          initial: _Filters(inStock: _inStock, price: _price, cats: _catSlugs, minDiscount: _minDiscount, minRating: _minRating),
          section: section,
          cats: _fixedCategory ? const [] : _cats,
        ),
      ),
    );
    if (result == null || !mounted) return;
    setState(() {
      _inStock = result.inStock;
      _price = result.price;
      _catSlugs = result.cats;
      _minDiscount = result.minDiscount;
      _minRating = result.minRating;
    });
    _load();
  }

  Widget _body() {
    if (_loading && _items.isEmpty) return const ShopGridSkeleton();
    if (_error != null && _items.isEmpty) return StateView.error(_error, onRetry: _load);
    if (_items.isEmpty) {
      final q = (widget.q ?? '').trim();
      return StateView(
        icon: Icons.search_off_rounded,
        title: 'No products found',
        body: q.isNotEmpty ? 'Nothing matches “$q”. Try a different word or browse a category.' : 'Try clearing the filters to see more.',
        cta: _filterCount > 0 ? 'Clear filters' : (widget.asTab ? null : 'Browse all'),
        onCta: _filterCount > 0 ? _clearFilters : () => context.go('/shop'),
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
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
                child: Text('${_total > 0 ? _total : _items.length} PRODUCTS', style: VkText.upper(9, color: VkColors.muted, letter: 0.16)),
              ),
            ),
          SliverPadding(
            padding: EdgeInsets.zero,
            sliver: SliverLayoutBuilder(
              builder: (context, c) => SliverGrid.builder(
                gridDelegate: shopGridDelegate(context, c.crossAxisExtent),
                itemCount: _items.length,
                itemBuilder: (context, i) {
                  final p = _items[i];
                  return ShopProductCard(
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

/// One cell of the toolbar: label, chevron or icon, and a dot when it holds
/// an applied value.
class _BarCell extends StatelessWidget {
  final String label;
  final IconData? icon;
  final bool active;
  final VoidCallback onTap;
  const _BarCell({required this.label, this.icon, this.active = false, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final fg = active ? VkColors.primary : VkColors.ink;
    return Semantics(
      button: true,
      selected: active,
      label: label,
      child: InkWell(
        onTap: onTap,
        child: SizedBox(
          height: 46,
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            if (icon != null) ...[Icon(icon, size: 17, color: fg), const SizedBox(width: 6)],
            Flexible(
              child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.ui(13, weight: active ? FontWeight.w600 : FontWeight.w500, color: fg)),
            ),
            if (icon == null) Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: fg),
            if (active && icon != null) ...[
              const SizedBox(width: 5),
              Container(width: 6, height: 6, decoration: const BoxDecoration(color: VkColors.primary, shape: BoxShape.circle)),
            ],
          ]),
        ),
      ),
    );
  }
}

/// Sort options as a radio list; a tap applies and closes.
class _SortSheet extends StatelessWidget {
  final String sort;
  const _SortSheet({required this.sort});
  @override
  Widget build(BuildContext context) => SafeArea(
        top: false,
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          _SheetHeader(title: 'Sort by', onClose: () => Navigator.pop(context)),
          const Divider(height: 1, color: VkColors.rule),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 4, 24, 12),
            child: Column(children: [
              for (final s in _sorts)
                _OptionRow(label: s.label, selected: s.id == sort, radio: true, onTap: () => Navigator.pop(context, s.id)),
            ]),
          ),
        ]),
      );
}

class _SheetHeader extends StatelessWidget {
  final String title;
  final VoidCallback onClose;
  const _SheetHeader({required this.title, required this.onClose});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 12, 14),
        child: Row(children: [
          Expanded(child: Text(title, style: VkText.ui(20, weight: FontWeight.w600))),
          IconButton(onPressed: onClose, tooltip: 'Close', icon: const Icon(Icons.close_rounded, size: 24, color: VkColors.ink)),
        ]),
      );
}

/// A full-width option: a square check box (or a round radio) and its label,
/// ruled off from the next one.
class _OptionRow extends StatelessWidget {
  final String label;
  final String? trailing;
  final bool selected;
  final bool radio;
  final VoidCallback onTap;
  const _OptionRow({required this.label, this.trailing, required this.selected, this.radio = false, required this.onTap});
  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        checked: selected,
        label: label,
        child: InkWell(
          onTap: onTap,
          child: Container(
            constraints: const BoxConstraints(minHeight: 54),
            decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: VkColors.rule))),
            child: Row(children: [
              AnimatedContainer(
                duration: VkMotion.fast,
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: selected ? VkColors.primary : VkColors.paper,
                  borderRadius: BorderRadius.circular(radio ? 11 : 5),
                  border: Border.all(color: selected ? VkColors.primary : VkColors.muted, width: 1.6),
                ),
                child: selected ? Icon(radio ? Icons.circle : Icons.check_rounded, size: radio ? 9 : 16, color: Colors.white) : null,
              ),
              const SizedBox(width: 14),
              Expanded(child: Text(label, style: VkText.ui(14.5, weight: selected ? FontWeight.w600 : FontWeight.w400))),
              if (trailing != null) Text(trailing!, style: VkText.ui(12, weight: FontWeight.w400, color: VkColors.muted2)),
            ]),
          ),
        ),
      );
}

/// Clear All (outlined) and Apply (filled) under the filter sheet.
class _FooterButton extends StatelessWidget {
  final String label;
  final bool filled;
  final VoidCallback onTap;
  const _FooterButton({required this.label, this.filled = false, required this.onTap});
  @override
  Widget build(BuildContext context) => Material(
        color: filled ? VkColors.primary : VkColors.paper,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(VkRadii.sm),
          side: BorderSide(color: filled ? VkColors.primary : VkColors.muted2),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Container(
            height: 50,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            alignment: Alignment.center,
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(label, maxLines: 1, style: VkText.ui(15, weight: FontWeight.w600, color: filled ? Colors.white : VkColors.muted)),
            ),
          ),
        ),
      );
}

enum _Section { category, price, discount, rating, availability }

extension on _Section {
  String get rail => switch (this) {
        _Section.category => 'Category',
        _Section.price => 'Price',
        _Section.discount => 'Discount',
        _Section.rating => 'Rating',
        _Section.availability => 'Availability',
      };
  String get heading => switch (this) {
        _Section.category => 'Select Category',
        _Section.price => 'Select Price',
        _Section.discount => 'Select Discount',
        _Section.rating => 'Select Rating',
        _Section.availability => 'Availability',
      };
}

class _Filters {
  final bool inStock;
  final RangeValues price;
  final Set<String> cats;
  final int? minDiscount;
  final int? minRating;
  const _Filters({required this.inStock, required this.price, required this.cats, this.minDiscount, this.minRating});
}

const _pricePresets = <(String, double, double)>[
  ('Under ₹200', 0, 200),
  ('₹200 – ₹500', 200, 500),
  ('₹500 – ₹1,000', 500, 1000),
  ('₹1,000 – ₹2,000', 1000, 2000),
  ('₹2,000 and above', 2000, _priceCap),
];

/// The filter sheet: sections down a left rail, the chosen section's options
/// on the right, Clear All and Apply pinned beneath.
class _FilterSheet extends StatefulWidget {
  final _Filters initial;
  final _Section section;
  final List<EcomCategory> cats;
  const _FilterSheet({required this.initial, required this.section, this.cats = const []});
  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late _Section _section = widget.section;
  late bool _inStock = widget.initial.inStock;
  late RangeValues _price = widget.initial.price;
  late final Set<String> _cats = {...widget.initial.cats};
  late int? _minDiscount = widget.initial.minDiscount;
  late int? _minRating = widget.initial.minRating;
  String _catQuery = '';

  List<_Section> get _sections => [
        if (widget.cats.isNotEmpty) _Section.category,
        _Section.price,
        _Section.discount,
        _Section.rating,
        _Section.availability,
      ];

  bool _has(_Section s) => switch (s) {
        _Section.category => _cats.isNotEmpty,
        _Section.price => _price.start > 0 || _price.end < _priceCap,
        _Section.discount => _minDiscount != null,
        _Section.rating => _minRating != null,
        _Section.availability => _inStock,
      };

  void _clear(_Section s) => setState(() {
        switch (s) {
          case _Section.category:
            _cats.clear();
          case _Section.price:
            _price = const RangeValues(0, _priceCap);
          case _Section.discount:
            _minDiscount = null;
          case _Section.rating:
            _minRating = null;
          case _Section.availability:
            _inStock = false;
        }
      });

  @override
  Widget build(BuildContext context) {
    final sections = _sections;
    if (!sections.contains(_section)) _section = sections.first;
    return SafeArea(
      top: false,
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.78,
        child: Column(children: [
          _SheetHeader(title: 'Filter', onClose: () => Navigator.pop(context)),
          const Divider(height: 1, color: VkColors.rule),
          Expanded(
            child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Container(
                width: 124,
                color: VkColors.cream,
                child: ListView(padding: EdgeInsets.zero, children: [for (final s in sections) _railItem(s)]),
              ),
              Expanded(child: ColoredBox(color: VkColors.paper, child: _pane())),
            ]),
          ),
          Container(
            decoration: const BoxDecoration(color: VkColors.paper, border: Border(top: BorderSide(color: VkColors.rule))),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Row(children: [
              Expanded(
                flex: 3,
                child: _FooterButton(
                  label: 'Clear All',
                  onTap: () => setState(() {
                    _cats.clear();
                    _price = const RangeValues(0, _priceCap);
                    _minDiscount = null;
                    _minRating = null;
                    _inStock = false;
                  }),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 5,
                child: _FooterButton(
                  label: 'Apply',
                  filled: true,
                  onTap: () => Navigator.pop(
                    context,
                    _Filters(inStock: _inStock, price: _price, cats: _cats, minDiscount: _minDiscount, minRating: _minRating),
                  ),
                ),
              ),
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _railItem(_Section s) {
    final on = s == _section;
    return Semantics(
      button: true,
      selected: on,
      child: InkWell(
        onTap: () => setState(() => _section = s),
        child: Container(
          constraints: const BoxConstraints(minHeight: 56),
          padding: const EdgeInsets.fromLTRB(0, 8, 8, 8),
          decoration: BoxDecoration(color: on ? VkColors.paper : null),
          child: Row(children: [
            Container(width: 4, height: 24, decoration: BoxDecoration(color: on ? VkColors.primary : Colors.transparent, borderRadius: BorderRadius.circular(2))),
            const SizedBox(width: 14),
            Expanded(child: Text(s.rail, style: VkText.ui(13.5, weight: on ? FontWeight.w600 : FontWeight.w400, color: on ? VkColors.ink : VkColors.ink2))),
            if (_has(s)) Container(width: 6, height: 6, decoration: const BoxDecoration(color: VkColors.primary, shape: BoxShape.circle)),
          ]),
        ),
      ),
    );
  }

  Widget _pane() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 18, 12, 6),
        child: Row(children: [
          Expanded(child: Text(_section.heading, style: VkText.ui(17, weight: FontWeight.w600))),
          TextButton(
            onPressed: _has(_section) ? () => _clear(_section) : null,
            child: Text('Clear', style: VkText.ui(13.5, weight: FontWeight.w600, color: _has(_section) ? VkColors.primary : VkColors.muted2)),
          ),
        ]),
      ),
      Expanded(
        child: switch (_section) {
          _Section.category => _categoryPane(),
          _Section.price => _pricePane(),
          _Section.discount => _list([
              for (final d in const [10, 20, 30, 40, 50])
                _OptionRow(label: '$d% and above', radio: true, selected: _minDiscount == d, onTap: () => setState(() => _minDiscount = _minDiscount == d ? null : d)),
            ]),
          _Section.rating => _list([
              for (final r in const [4, 3, 2])
                _OptionRow(label: '$r ★ and above', radio: true, selected: _minRating == r, onTap: () => setState(() => _minRating = _minRating == r ? null : r)),
            ]),
          _Section.availability => _list([
              _OptionRow(label: 'In stock only', selected: _inStock, onTap: () => setState(() => _inStock = !_inStock)),
            ]),
        },
      ),
    ]);
  }

  Widget _list(List<Widget> rows) => ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 16), children: rows);

  Widget _categoryPane() {
    final q = _catQuery.trim().toLowerCase();
    final shown = widget.cats.where((c) => q.isEmpty || c.name.toLowerCase().contains(q)).toList();
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
        child: SizedBox(
          height: 44,
          child: TextField(
            onChanged: (v) => setState(() => _catQuery = v),
            textInputAction: TextInputAction.search,
            style: VkText.ui(13.5, weight: FontWeight.w400),
            decoration: InputDecoration(
              hintText: 'Search Category',
              hintStyle: VkText.ui(13.5, weight: FontWeight.w400, color: VkColors.muted),
              prefixIcon: const Icon(Icons.search_rounded, size: 20, color: VkColors.ink),
              contentPadding: EdgeInsets.zero,
              filled: true,
              fillColor: VkColors.paper,
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(22), borderSide: const BorderSide(color: VkColors.rule)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(22), borderSide: const BorderSide(color: VkColors.primary, width: 1.4)),
            ),
          ),
        ),
      ),
      Expanded(
        child: shown.isEmpty
            ? Center(child: Text('No category matches', style: VkText.ui(13, weight: FontWeight.w400, color: VkColors.muted)))
            : _list([
                for (final c in shown)
                  _OptionRow(
                    label: c.name,
                    trailing: c.productCount != null ? '${c.productCount}' : null,
                    selected: _cats.contains(c.slug),
                    onTap: () => setState(() => _cats.contains(c.slug) ? _cats.remove(c.slug) : _cats.add(c.slug)),
                  ),
              ]),
      ),
    ]);
  }

  Widget _pricePane() {
    final lo = _price.start.round();
    final hi = _price.end.round();
    return ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 16), children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Flexible(child: Text(lo == 0 ? 'Any' : '₹${inr(lo)}', maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.ui(14, weight: FontWeight.w600))),
        const SizedBox(width: 8),
        Flexible(child: Text(hi >= _priceCap ? '₹${inr(_priceCap)}+' : '₹${inr(hi)}', maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.ui(14, weight: FontWeight.w600))),
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
      for (final (label, from, to) in _pricePresets)
        _OptionRow(
          label: label,
          radio: true,
          selected: _price.start == from && _price.end == to,
          onTap: () => setState(() => _price = _price.start == from && _price.end == to ? const RangeValues(0, _priceCap) : RangeValues(from, to)),
        ),
    ]);
  }
}
