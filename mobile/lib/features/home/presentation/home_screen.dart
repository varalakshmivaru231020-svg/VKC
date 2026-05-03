import "package:carousel_slider/carousel_slider.dart";
import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:smooth_page_indicator/smooth_page_indicator.dart";

import "../../../core/errors/failures.dart";
import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/widgets/app_image.dart";
import "../../../core/widgets/state_widgets.dart";
import "../../shop/data/product_models.dart";
import "../../shop/data/product_repository.dart";
import "../../shop/presentation/product_card.dart";
import "../../splash/data/app_config_repository.dart";

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider).asData?.value;
    final colors = context.appColors;

    return Scaffold(
      appBar: AppBar(
        title: Text(config?.site.name ?? "Vijaylakshmi Sarees"),
        actions: [
          IconButton(onPressed: () => context.push(RoutePaths.search), icon: const Icon(Icons.search)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(heroSlidesProvider);
          ref.invalidate(featuredProductsProvider);
          ref.invalidate(categoriesProvider);
          await Future.wait([
            ref.read(heroSlidesProvider.future),
            ref.read(featuredProductsProvider.future),
            ref.read(categoriesProvider.future),
          ]);
        },
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            if (config?.site.announcement.active == true && config!.site.announcement.text.isNotEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                color: Theme.of(context).colorScheme.primary,
                child: Text(
                  config.site.announcement.text,
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500),
                  textAlign: TextAlign.center,
                ),
              ),

            // Hero
            const _HeroSection(),

            // Categories strip
            const _CategoryStrip(),

            // Featured products
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("Featured", style: Theme.of(context).textTheme.titleLarge),
                  TextButton(
                    onPressed: () => context.go(RoutePaths.shop),
                    child: const Text("View all"),
                  ),
                ],
              ),
            ),
            const _FeaturedGrid(),

            const SizedBox(height: 24),
            Container(
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: colors.cream, borderRadius: BorderRadius.circular(8)),
              child: Column(
                children: const [
                  Icon(Icons.verified_rounded, size: 32),
                  SizedBox(height: 8),
                  Text("100% genuine, hand-picked sarees · Free shipping above ₹2,999",
                      textAlign: TextAlign.center),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroSection extends ConsumerWidget {
  const _HeroSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slides = ref.watch(heroSlidesProvider);

    return slides.when(
      loading: () => Container(
        height: 220,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(color: context.appColors.cream, borderRadius: BorderRadius.circular(8)),
      ),
      error: (e, _) => const SizedBox.shrink(),
      data: (list) {
        if (list.isEmpty) return const SizedBox.shrink();
        return _HeroCarousel(slides: list);
      },
    );
  }
}

class _HeroCarousel extends StatefulWidget {
  const _HeroCarousel({required this.slides});
  final List<HeroSlide> slides;

  @override
  State<_HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<_HeroCarousel> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 12),
        CarouselSlider.builder(
          itemCount: widget.slides.length,
          itemBuilder: (_, i, __) {
            final s = widget.slides[i];
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (s.imageUrl != null) AppImage(url: s.imageUrl, borderRadius: BorderRadius.zero),
                    Container(color: Colors.black.withOpacity(0.25)),
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          if (s.tag != null)
                            Text(s.tag!.toUpperCase(),
                                style: const TextStyle(color: Colors.white70, fontSize: 11, letterSpacing: 1.4, fontWeight: FontWeight.w600)),
                          if (s.heading != null) ...[
                            const SizedBox(height: 6),
                            Text(s.heading!,
                                style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700)),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
          options: CarouselOptions(
            height: 220,
            viewportFraction: 1,
            autoPlay: widget.slides.length > 1,
            autoPlayInterval: const Duration(seconds: 5),
            onPageChanged: (i, _) => setState(() => _index = i),
          ),
        ),
        const SizedBox(height: 8),
        if (widget.slides.length > 1)
          AnimatedSmoothIndicator(
            activeIndex: _index,
            count: widget.slides.length,
            effect: ExpandingDotsEffect(
              activeDotColor: Theme.of(context).colorScheme.primary,
              dotColor: context.appColors.parchment,
              dotHeight: 6, dotWidth: 6, expansionFactor: 3,
            ),
          ),
      ],
    );
  }
}

class _CategoryStrip extends ConsumerWidget {
  const _CategoryStrip();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cats = ref.watch(categoriesProvider);

    return cats.when(
      loading: () => const SizedBox(height: 100),
      error:   (_, __) => const SizedBox.shrink(),
      data: (list) {
        if (list.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.fromLTRB(0, 16, 0, 0),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: list.take(8).map((c) {
                return Padding(
                  padding: const EdgeInsets.only(right: 14),
                  child: GestureDetector(
                    onTap: () => context.go("${RoutePaths.shop}?category=${c.slug}"),
                    child: Column(
                      children: [
                        Container(
                          width: 64, height: 64,
                          decoration: BoxDecoration(
                            color: context.appColors.cream,
                            shape: BoxShape.circle,
                            image: c.imageUrl != null && c.imageUrl!.isNotEmpty
                                ? DecorationImage(image: NetworkImage(c.imageUrl!), fit: BoxFit.cover)
                                : null,
                          ),
                          child: c.imageUrl == null || c.imageUrl!.isEmpty
                              ? Center(child: Text(c.name.substring(0, 1), style: Theme.of(context).textTheme.titleLarge))
                              : null,
                        ),
                        const SizedBox(height: 6),
                        SizedBox(
                          width: 72,
                          child: Text(c.name, textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }
}

class _FeaturedGrid extends ConsumerWidget {
  const _FeaturedGrid();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final featured = ref.watch(featuredProductsProvider);

    return featured.when(
      loading: () => const SizedBox(height: 240, child: AppLoading()),
      error: (e, _) {
        final f = e is Failure ? e : UnknownFailure(e.toString());
        return Padding(
          padding: const EdgeInsets.all(16),
          child: AppErrorView(failure: f, onRetry: () => ref.invalidate(featuredProductsProvider)),
        );
      },
      data: (list) {
        if (list.isEmpty) {
          return const Padding(
            padding: EdgeInsets.all(24),
            child: AppEmpty(title: "No featured products yet"),
          );
        }
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: list.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 12,
              childAspectRatio: 0.5,
            ),
            itemBuilder: (_, i) => ProductCard(product: list[i]),
          ),
        );
      },
    );
  }
}
