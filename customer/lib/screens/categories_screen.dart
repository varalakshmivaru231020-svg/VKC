import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../ecom/ecom_adapter.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_models.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets.dart';

/// Categories tab, marketplace style: a rail of categories down the left,
/// and on the right the products of the one selected as round tiles. The
/// first rail entry, Popular, shows the store's featured products.
class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});
  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

const _popularKey = '__popular__';

class _CategoriesScreenState extends State<CategoriesScreen> {
  List<EcomCategory> _cats = const [];
  bool _loadingCats = true;
  Object? _catsError;

  String _selected = _popularKey;
  final Map<String, List<Product>> _products = {};
  final Set<String> _loadingKeys = {};
  final Map<String, Object> _errors = {};

  @override
  void initState() {
    super.initState();
    _loadCats();
    _loadProducts(_popularKey);
  }

  Future<void> _loadCats({bool force = false}) async {
    if (_cats.isEmpty && mounted) setState(() => _loadingCats = true);
    try {
      final cats = await EcomApi.I.categories(force: force);
      if (!mounted) return;
      setState(() {
        _cats = cats;
        _catsError = null;
        _loadingCats = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _catsError = e;
        _loadingCats = false;
      });
    }
  }

  Future<void> _loadProducts(String key, {bool force = false}) async {
    if (!force && _products.containsKey(key)) return;
    if (_loadingKeys.contains(key)) return;
    setState(() {
      _loadingKeys.add(key);
      _errors.remove(key);
    });
    try {
      ProductPage page;
      if (key == _popularKey) {
        page = await EcomApi.I.products(isFeatured: true, limit: 24);
        if (page.products.isEmpty) page = await EcomApi.I.products(sort: 'newest', limit: 24);
      } else {
        page = await EcomApi.I.products(categorySlug: key, limit: 30);
      }
      if (!mounted) return;
      setState(() => _products[key] = productsFromEcom(page.products));
    } catch (e) {
      if (!mounted) return;
      setState(() => _errors[key] = e);
    } finally {
      if (mounted) setState(() => _loadingKeys.remove(key));
    }
  }

  void _select(String key) {
    if (_selected == key) return;
    setState(() => _selected = key);
    _loadProducts(key);
  }

  EcomCategory? get _selectedCat => _selected == _popularKey ? null : _cats.cast<EcomCategory?>().firstWhere((c) => c!.slug == _selected, orElse: () => null);

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      TabHeader(
        title: 'Categories',
        actions: [
          TopBar.action(Icons.search_rounded, () => context.push('/search'), tooltip: 'Search'),
          TopBar.action(Icons.favorite_border_rounded, () => context.push('/wishlist'), tooltip: 'Wishlist'),
          InkResponse(
            onTap: () => context.go('/cart'),
            radius: 24,
            child: const SizedBox(width: 44, height: 44, child: Center(child: CartIconBadge(size: 22))),
          ),
        ],
      ),
      const Divider(height: 1, color: VkColors.rule),
      Expanded(
        child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          _Rail(
            cats: _cats,
            loading: _loadingCats,
            selected: _selected,
            onSelect: _select,
          ),
          Expanded(child: _pane()),
        ]),
      ),
    ]);
  }

  Widget _pane() {
    if (_catsError != null && _cats.isEmpty && _selected != _popularKey) {
      return StateView.error(_catsError, onRetry: () => _loadCats(force: true));
    }
    final key = _selected;
    final cat = _selectedCat;
    final items = _products[key];
    final loading = _loadingKeys.contains(key) && items == null;
    final error = _errors[key];
    final kicker = cat == null ? 'Popular' : 'Category';
    final title = cat == null ? 'Featured on VKC Gold Ikshu' : cat.name;

    return RefreshIndicator(
      color: VkColors.primary,
      onRefresh: () async {
        await Future.wait([_loadCats(force: true), _loadProducts(key, force: true)]);
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
        children: [
          Row(children: [
            Text(kicker.toUpperCase(), style: VkText.upper(9, color: VkColors.muted, letter: 0.2)),
            const SizedBox(width: 10),
            const Expanded(child: Divider(height: 1, color: VkColors.rule)),
          ]),
          const SizedBox(height: 8),
          Text(title, style: VkText.display(21, height: 1.1)),
          const SizedBox(height: 14),
          if (loading)
            _TileGridSkeleton()
          else if (error != null && (items == null || items.isEmpty))
            StateView.error(error, onRetry: () => _loadProducts(key, force: true))
          else if (items == null || items.isEmpty)
            StateView(
              icon: Icons.inventory_2_outlined,
              title: 'Nothing here yet',
              body: cat == null ? 'Featured products will appear here.' : 'No products in ${cat.name} right now.',
              cta: 'Browse all products',
              onCta: () => context.go('/shop'),
            )
          else
            _TileGrid(
              items: items,
              onViewAll: () => cat == null ? context.go('/shop') : context.push('/listing?cat=${cat.slug}&title=${Uri.encodeComponent(cat.name)}'),
            ),
        ],
      ),
    );
  }
}

/// The left rail: Popular first, then every category as a round picture with
/// its name. The selected entry carries a brand bar on its left edge.
class _Rail extends StatelessWidget {
  final List<EcomCategory> cats;
  final bool loading;
  final String selected;
  final ValueChanged<String> onSelect;
  const _Rail({required this.cats, required this.loading, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) => Container(
        width: 100,
        decoration: const BoxDecoration(color: VkColors.paper, border: Border(right: BorderSide(color: VkColors.rule))),
        child: ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            _RailItem(
              selected: selected == _popularKey,
              onTap: () => onSelect(_popularKey),
              label: 'Popular',
              child: Container(
                width: 56,
                height: 56,
                decoration: const BoxDecoration(color: VkColors.amberSoft, shape: BoxShape.circle),
                child: const Icon(Icons.star_rounded, size: 28, color: VkColors.amber),
              ),
            ),
            if (loading && cats.isEmpty)
              for (var i = 0; i < 4; i++)
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 22, vertical: 16),
                  child: Column(children: [Skeleton(width: 56, height: 56, radius: 28), SizedBox(height: 8), Skeleton(width: 48, height: 10)]),
                ),
            for (final c in cats)
              _RailItem(
                selected: selected == c.slug,
                onTap: () => onSelect(c.slug),
                label: c.name,
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: const BoxDecoration(color: VkColors.cream, shape: BoxShape.circle),
                  clipBehavior: Clip.antiAlias,
                  child: NetImage(url: c.imageUrl, radius: 0, seed: paletteFor(c.slug), placeholderIcon: Icons.grass_rounded),
                ),
              ),
          ],
        ),
      );
}

class _RailItem extends StatelessWidget {
  final bool selected;
  final VoidCallback onTap;
  final String label;
  final Widget child;
  const _RailItem({required this.selected, required this.onTap, required this.label, required this.child});
  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        selected: selected,
        label: label,
        child: InkWell(
          onTap: onTap,
          child: AnimatedContainer(
            duration: VkMotion.base,
            curve: VkMotion.curve,
            decoration: BoxDecoration(
              color: selected ? VkColors.canvas : Colors.transparent,
              border: Border(
                left: BorderSide(color: selected ? VkColors.primary : Colors.transparent, width: 3),
                bottom: const BorderSide(color: VkColors.rule),
              ),
            ),
            padding: const EdgeInsets.fromLTRB(6, 14, 8, 14),
            child: Column(children: [
              child,
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: VkText.ui(11, weight: selected ? FontWeight.w700 : FontWeight.w500, color: selected ? VkColors.primary : VkColors.ink2, height: 1.2),
              ),
            ]),
          ),
        ),
      );
}

/// Products as round pictures with the name beneath, three to a row, ending
/// with a round View All tile that opens the full listing.
class _TileGrid extends StatelessWidget {
  final List<Product> items;
  final VoidCallback onViewAll;
  const _TileGrid({required this.items, required this.onViewAll});
  @override
  Widget build(BuildContext context) => GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: EdgeInsets.zero,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, mainAxisSpacing: 14, crossAxisSpacing: 10, mainAxisExtent: 124),
        itemCount: items.length + 1,
        itemBuilder: (context, i) {
          if (i == items.length) {
            return PressScale(
              onTap: onViewAll,
              child: Column(children: [
                Container(
                  width: 76,
                  height: 76,
                  decoration: const BoxDecoration(color: VkColors.amberSoft, shape: BoxShape.circle),
                  child: const Icon(Icons.arrow_forward_rounded, size: 30, color: VkColors.primaryDeep),
                ),
                const SizedBox(height: 8),
                Text('View All', textAlign: TextAlign.center, style: VkText.ui(11.5, weight: FontWeight.w600, color: VkColors.primaryDeep)),
              ]),
            );
          }
          final p = items[i];
          return PressScale(
            onTap: () => context.push('/product/${p.id}'),
            child: Column(children: [
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  color: VkColors.cream,
                  shape: BoxShape.circle,
                  border: Border.all(color: VkColors.rule),
                ),
                clipBehavior: Clip.antiAlias,
                child: NetImage(url: p.image, radius: 0, seed: p.palette),
              ),
              const SizedBox(height: 8),
              Text(p.name, textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis, style: VkText.ui(11.5, weight: FontWeight.w500, height: 1.25)),
            ]),
          );
        },
      );
}

class _TileGridSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) => GridView.count(
        crossAxisCount: 3,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: EdgeInsets.zero,
        mainAxisSpacing: 14,
        crossAxisSpacing: 10,
        childAspectRatio: 0.85,
        children: List.generate(9, (_) => const Column(children: [Skeleton(width: 76, height: 76, radius: 38), SizedBox(height: 8), Skeleton(width: 64, height: 10)])),
      );
}
