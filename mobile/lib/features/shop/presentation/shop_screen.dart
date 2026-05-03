import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:infinite_scroll_pagination/infinite_scroll_pagination.dart";

import "../../../core/errors/failures.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/widgets/state_widgets.dart";
import "../data/product_models.dart";
import "../data/product_repository.dart";
import "product_card.dart";
import "shop_filters_state.dart";

const _pageSize = 20;

const _sortOptions = [
  ("newest",     "Newest first"),
  ("price-asc",  "Price: Low → High"),
  ("price-desc", "Price: High → Low"),
];

class ShopScreen extends ConsumerStatefulWidget {
  const ShopScreen({super.key, this.categorySlug, this.title});
  final String? categorySlug;
  final String? title;

  @override
  ConsumerState<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends ConsumerState<ShopScreen> {
  final _pagingController = PagingController<int, Product>(firstPageKey: 1);

  @override
  void initState() {
    super.initState();
    _pagingController.addPageRequestListener(_fetchPage);

    // Apply incoming category filter (from category-strip taps on home).
    if (widget.categorySlug != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(shopFiltersProvider.notifier).setCategory(widget.categorySlug);
      });
    }

    // Defensively kick off the first page fetch in case the auto-listener
    // doesn't fire (e.g. on tab return after the controller was created).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && _pagingController.itemList == null && _pagingController.error == null) {
        _fetchPage(1);
      }
    });
  }

  Future<void> _fetchPage(int page) async {
    try {
      final filters = ref.read(shopFiltersProvider);
      final repo = ref.read(productRepositoryProvider);
      final result = await repo.products(filters: filters, page: page, limit: _pageSize);
      if (!mounted) return;
      if (result.pagination.hasMore) {
        _pagingController.appendPage(result.products, page + 1);
      } else {
        _pagingController.appendLastPage(result.products);
      }
    } catch (e) {
      _pagingController.error = e is Failure ? e : UnknownFailure(e.toString());
    }
  }

  @override
  void dispose() {
    _pagingController.dispose();
    super.dispose();
  }

  Future<void> _openFilters() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => const _FiltersSheet(),
    );
    _pagingController.refresh();
  }

  Future<void> _openSort() async {
    final current = ref.read(shopFiltersProvider).sort;
    await showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (sheetCtx) {
        return SafeArea(
          child: ListView(
            shrinkWrap: true,
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Text("Sort by", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, letterSpacing: 0.6)),
              ),
              const Divider(height: 1),
              for (final (value, label) in _sortOptions)
                RadioListTile<String>(
                  title: Text(label),
                  value: value,
                  groupValue: current,
                  onChanged: (v) {
                    if (v != null) {
                      ref.read(shopFiltersProvider.notifier).setSort(v);
                      _pagingController.refresh();
                      Navigator.of(sheetCtx).pop();
                    }
                  },
                ),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Refresh whenever the filter state changes (after a tab return etc).
    ref.listen<ProductFilters>(shopFiltersProvider, (_, __) => _pagingController.refresh());

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title ?? "Shop"),
      ),
      bottomNavigationBar: _ShopBottomBar(onSort: _openSort, onFilter: _openFilters),
      body: RefreshIndicator(
        onRefresh: () async => _pagingController.refresh(),
        child: PagedGridView<int, Product>(
          pagingController: _pagingController,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 16,
            crossAxisSpacing: 12,
            childAspectRatio: 0.5,
          ),
          builderDelegate: PagedChildBuilderDelegate<Product>(
            itemBuilder: (_, item, __) => ProductCard(product: item),
            firstPageProgressIndicatorBuilder: (_) => const AppLoading(),
            newPageProgressIndicatorBuilder:   (_) => const Padding(
              padding: EdgeInsets.all(20),
              child: Center(child: CircularProgressIndicator(strokeWidth: 2.4)),
            ),
            firstPageErrorIndicatorBuilder: (_) {
              final err = _pagingController.error;
              final f = err is Failure ? err : UnknownFailure(err.toString());
              return AppErrorView(failure: f, onRetry: () => _pagingController.refresh());
            },
            noItemsFoundIndicatorBuilder: (_) => const AppEmpty(
              title: "No sarees match these filters",
              description: "Try changing or clearing the filters.",
            ),
          ),
        ),
      ),
    );
  }
}

class _ShopBottomBar extends StatelessWidget {
  const _ShopBottomBar({required this.onSort, required this.onFilter});
  final VoidCallback onSort, onFilter;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    return SafeArea(
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: colors.parchment)),
        ),
        child: Row(
          children: [
            Expanded(
              child: TextButton.icon(
                onPressed: onSort,
                icon: const Icon(Icons.swap_vert_rounded),
                label: const Text("SORT"),
                style: TextButton.styleFrom(
                  foregroundColor: Theme.of(context).textTheme.titleMedium?.color,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: const RoundedRectangleBorder(),
                ),
              ),
            ),
            VerticalDivider(width: 1, color: colors.parchment),
            Expanded(
              child: TextButton.icon(
                onPressed: onFilter,
                icon: const Icon(Icons.tune_rounded),
                label: const Text("FILTER"),
                style: TextButton.styleFrom(
                  foregroundColor: Theme.of(context).textTheme.titleMedium?.color,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: const RoundedRectangleBorder(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FiltersSheet extends ConsumerStatefulWidget {
  const _FiltersSheet();
  @override
  ConsumerState<_FiltersSheet> createState() => _FiltersSheetState();
}

class _FiltersSheetState extends ConsumerState<_FiltersSheet> {
  late final TextEditingController _minCtrl;
  late final TextEditingController _maxCtrl;

  @override
  void initState() {
    super.initState();
    final f = ref.read(shopFiltersProvider);
    _minCtrl = TextEditingController(text: f.minPrice?.toString() ?? "");
    _maxCtrl = TextEditingController(text: f.maxPrice?.toString() ?? "");
  }

  @override
  void dispose() {
    _minCtrl.dispose();
    _maxCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final f = ref.watch(shopFiltersProvider);
    final n = ref.read(shopFiltersProvider.notifier);

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      builder: (_, scroll) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text("Filters", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16, letterSpacing: 0.6)),
                  TextButton(
                    onPressed: () { n.reset(); _minCtrl.clear(); _maxCtrl.clear(); },
                    child: const Text("Reset"),
                  ),
                ],
              ),
              const Divider(height: 16),
              Expanded(
                child: ListView(
                  controller: scroll,
                  children: [
                    const _SectionHeader("Price range"),
                    Row(
                      children: [
                        Expanded(child: TextField(controller: _minCtrl, decoration: const InputDecoration(labelText: "Min"), keyboardType: TextInputType.number)),
                        const SizedBox(width: 12),
                        Expanded(child: TextField(controller: _maxCtrl, decoration: const InputDecoration(labelText: "Max"), keyboardType: TextInputType.number)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile.adaptive(
                      value: f.inStock,
                      onChanged: n.setInStock,
                      title: const Text("In stock only"),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ],
                ),
              ),
              SafeArea(
                top: false,
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text("Close"),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          final min = num.tryParse(_minCtrl.text);
                          final max = num.tryParse(_maxCtrl.text);
                          n.setPriceRange(min: min, max: max);
                          Navigator.of(context).pop();
                        },
                        child: const Text("Apply"),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.text);
  final String text;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text.toUpperCase(),
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.2, color: context.appColors.textMuted)),
    );
  }
}
