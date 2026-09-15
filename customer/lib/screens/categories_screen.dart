import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../ecom/ecom_api.dart';
import '../ecom/ecom_models.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets.dart';

/// Categories tab — every category the admin panel publishes, as a
/// discovery grid. Tap → that category's products.
class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});
  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  List<EcomCategory> _cats = const [];
  bool _loading = true;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool force = false}) async {
    if (_cats.isEmpty && mounted) setState(() => _loading = true);
    try {
      final cats = await EcomApi.I.categories(force: force);
      if (!mounted) return;
      setState(() {
        _cats = cats;
        _error = null;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  void _open(EcomCategory c) => context.push('/listing?cat=${c.slug}&title=${Uri.encodeComponent(c.name)}');

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      TabHeader(
        title: 'Categories',
        subtitle: 'Everything we make, by range',
        actions: [TopBar.action(Icons.search_rounded, () => context.push('/search'), tooltip: 'Search')],
      ),
      Expanded(child: _body()),
    ]);
  }

  Widget _body() {
    if (_loading && _cats.isEmpty) return const _CategoriesSkeleton();
    if (_error != null && _cats.isEmpty) return StateView.error(_error, onRetry: () => _load(force: true));
    if (_cats.isEmpty) {
      return StateView(
        icon: Icons.grid_view_outlined,
        title: 'No categories yet',
        body: 'Browse the full range instead.',
        cta: 'All products',
        onCta: () => context.go('/shop'),
      );
    }
    return RefreshIndicator(
      color: VkColors.primary,
      onRefresh: () => _load(force: true),
      child: CustomScrollView(slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
          sliver: SliverToBoxAdapter(child: _AllProductsCard(onTap: () => context.go('/shop'))),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 14,
              crossAxisSpacing: 14,
              childAspectRatio: 1,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, i) => FadeSlideIn(
                delay: Duration(milliseconds: 40 * (i % 6)),
                child: _CategoryCard(category: _cats[i], onTap: () => _open(_cats[i])),
              ),
              childCount: _cats.length,
            ),
          ),
        ),
      ]),
    );
  }
}

class _AllProductsCard extends StatelessWidget {
  final VoidCallback onTap;
  const _AllProductsCard({required this.onTap});
  @override
  Widget build(BuildContext context) => PressScale(
        onTap: onTap,
        scale: 0.985,
        child: Container(
          padding: const EdgeInsets.fromLTRB(18, 16, 14, 16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [VkColors.primaryInk, VkColors.primaryDeep]),
            borderRadius: BorderRadius.circular(VkRadii.lg),
          ),
          child: Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('THE FULL RANGE', style: VkText.upper(8.5, color: VkColors.amberSoft, letter: 0.2)),
                const SizedBox(height: 4),
                Text('All products', style: VkText.display(22, color: Colors.white)),
                const SizedBox(height: 2),
                Text('Jaggery, syrups, snacks and gift boxes', style: VkText.body(11.5, color: Colors.white.withValues(alpha: 0.75))),
              ]),
            ),
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(color: VkColors.amber, shape: BoxShape.circle),
              child: const Icon(Icons.arrow_forward_rounded, size: 20, color: VkColors.primaryInk),
            ),
          ]),
        ),
      );
}

/// A category on the Categories tab: the photograph fills the tile and the
/// name and count sit on a soft foot gradient — one clean picture, no frame.
class _CategoryCard extends StatelessWidget {
  final EcomCategory category;
  final VoidCallback onTap;
  const _CategoryCard({required this.category, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final c = category;
    final count = c.productCount;
    return PressScale(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(color: VkColors.cream, borderRadius: BorderRadius.circular(VkRadii.lg)),
        clipBehavior: Clip.antiAlias,
        child: Stack(fit: StackFit.expand, children: [
          NetImage(url: c.imageUrl, radius: 0, seed: paletteFor(c.slug), placeholderIcon: Icons.grass_rounded),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                stops: [0.45, 1],
                colors: [Colors.transparent, Color(0xCC2B1708)],
              ),
            ),
          ),
          Positioned(
            left: 14,
            right: 14,
            bottom: 12,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              Text(c.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: VkText.ui(14, weight: FontWeight.w700, color: Colors.white, height: 1.2)),
              const SizedBox(height: 3),
              Row(children: [
                Expanded(
                  child: Text(
                    count == null ? 'Explore' : (count == 1 ? '1 product' : '$count products'),
                    style: VkText.body(11, color: Colors.white.withValues(alpha: 0.8)),
                  ),
                ),
                const Icon(Icons.arrow_forward_rounded, size: 15, color: VkColors.amber),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _CategoriesSkeleton extends StatelessWidget {
  const _CategoriesSkeleton();
  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
        physics: const NeverScrollableScrollPhysics(),
        children: [
          const Skeleton(height: 96, radius: VkRadii.lg),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            mainAxisSpacing: 14,
            crossAxisSpacing: 14,
            childAspectRatio: 1,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: List.generate(4, (_) => const Skeleton(radius: VkRadii.lg)),
          ),
        ],
      );
}
