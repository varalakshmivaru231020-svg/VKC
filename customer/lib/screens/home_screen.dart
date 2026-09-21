import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../ecom/ecom_adapter.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_config.dart';
import '../ecom/ecom_models.dart' hide Banner;
import '../ecom/ecom_models.dart' as m show Banner;
import '../models.dart';
import '../theme.dart';
import '../widgets.dart';
import 'content_screens.dart';
import 'why_vkc.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Home data
// ─────────────────────────────────────────────────────────────────────────────

class HomeData {
  final List<Product> arrivals;
  final List<EcomCategory> categories;
  final List<HeroSlide> hero;
  final List<m.Banner> heroBanners, midBanners, bottomBanners;
  final List<BlogPost> blogs;
  final List<Testimonial> testimonials;
  final List<GalleryItem> gallery;
  final AboutContent? about;

  /// Admin → Banners "home_why_image": replaces the bundled farmer in Why VKC.
  final String? whyImage;
  const HomeData({
    required this.arrivals,
    required this.categories,
    required this.hero,
    required this.heroBanners,
    required this.midBanners,
    required this.bottomBanners,
    required this.blogs,
    required this.testimonials,
    required this.gallery,
    required this.about,
    this.whyImage,
  });
}

/// Fetches everything Home shows, each section on its own so one failing
/// call can never blank the store. Held for the app's lifetime and refreshed
/// quietly when it ages out or the customer pulls to refresh.
class HomeRepo {
  HomeRepo._();
  static final HomeRepo I = HomeRepo._();

  static const ttl = Duration(minutes: 5);
  HomeData? data;
  DateTime? at;
  Future<HomeData>? _inflight;

  bool get fresh => at != null && DateTime.now().difference(at!) < ttl;

  /// Warms the cache during launch; failures are the screen's to show later.
  void prewarm() {
    load().catchError((_) => data ?? const HomeData(
          arrivals: [], categories: [], hero: [], heroBanners: [], midBanners: [], bottomBanners: [],
          blogs: [], testimonials: [], gallery: [], about: null,
        ));
  }

  Future<HomeData> load({bool force = false}) {
    if (!force && data != null && fresh) return Future.value(data);
    return _inflight ??= _fetch(force).whenComplete(() => _inflight = null);
  }

  Future<HomeData> _fetch(bool force) async {
    Object? firstError;
    Future<T?> soft<T>(Future<T> Function() call) async {
      try {
        return await call();
      } catch (e) {
        firstError ??= e;
        return null;
      }
    }

    final results = await Future.wait<dynamic>([
      soft(() => EcomApi.I.products(isFeatured: true, limit: 6)),
      soft(() => EcomApi.I.products(sort: 'newest', limit: 6)),
      soft(() => EcomApi.I.categories(force: force)),
      soft(() => EcomApi.I.heroSlides(force: force)),
      soft(() => EcomApi.I.banners(force: force)),
      soft(() => EcomApi.I.blogs(limit: 3)),
      soft(() => EcomApi.I.testimonials(force: force)),
      soft(() => EcomApi.I.gallery(limit: 12, force: force)),
      soft(() => EcomApi.I.about(force: force)),
    ]);
    final featured = results[0] as ProductPage?;
    final newest = results[1] as ProductPage?;
    if (featured == null && newest == null) {
      // The catalogue is the one thing Home cannot draw without.
      throw firstError ?? StateError('catalogue unavailable');
    }
    final source = (featured?.products.isNotEmpty ?? false) ? featured!.products : (newest?.products ?? const []);
    final banners = (results[4] as List<m.Banner>?) ?? const [];
    final result = HomeData(
      arrivals: productsFromEcom(source),
      categories: (results[2] as List<EcomCategory>?) ?? const [],
      hero: ((results[3] as List<HeroSlide>?) ?? const []).where((h) => (h.imageUrl ?? '').isNotEmpty).toList(),
      heroBanners: banners.where((b) => b.position == 'home_hero' && (b.image ?? '').isNotEmpty).toList(),
      midBanners: banners.where((b) => b.position == 'home_mid' && (b.image ?? '').isNotEmpty).toList(),
      bottomBanners: banners.where((b) => b.position == 'home_bottom' && (b.image ?? '').isNotEmpty).toList(),
      blogs: (results[5] as List<BlogPost>?) ?? const [],
      testimonials: (results[6] as List<Testimonial>?) ?? const [],
      gallery: ((results[7] as List<GalleryItem>?) ?? const []).where((g) => !g.isVideo).take(10).toList(),
      about: results[8] as AboutContent?,
      whyImage: banners.where((b) => b.position == 'home_why_image' && (b.image ?? '').isNotEmpty).map((b) => b.image).firstOrNull,
    );
    data = result;
    at = DateTime.now();
    return result;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Home screen
// ─────────────────────────────────────────────────────────────────────────────

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  HomeData? _data = HomeRepo.I.data;
  Object? _error;
  bool _loading = HomeRepo.I.data == null;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool force = false}) async {
    if (_data == null && mounted) setState(() => _loading = true);
    try {
      final d = await HomeRepo.I.load(force: force);
      if (!mounted) return;
      setState(() {
        _data = d;
        _error = null;
        _loading = false;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) PromoPopup.maybeShow(context);
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = _data;
    return Column(children: [
      const _HomeHeader(),
      Expanded(
        child: d == null
            ? (_loading ? const _HomeSkeleton() : StateView.error(_error, onRetry: () => _load(force: true), title: "Couldn't load the store"))
            : RefreshIndicator(
                color: VkColors.primary,
                onRefresh: () => _load(force: true),
                child: _HomeBody(data: d),
              ),
      ),
    ]);
  }
}

/// Logo on the left; search and notifications on the right. One row, so the
/// banners start right under the brand.
class _HomeHeader extends StatelessWidget {
  const _HomeHeader();
  @override
  Widget build(BuildContext context) => Container(
        color: VkColors.canvas,
        padding: const EdgeInsets.fromLTRB(VkSpace.page, 10, 8, 8),
        child: Row(children: [
          const Expanded(child: BrandLogo(height: 40, animate: true)),
          TopBar.action(Icons.search_rounded, () => context.push('/search'), tooltip: 'Search'),
          TopBar.action(Icons.notifications_none_rounded, () => context.push('/notifications'), tooltip: 'Notifications'),
        ]),
      );
}

class _HomeSkeleton extends StatelessWidget {
  const _HomeSkeleton();
  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        physics: const NeverScrollableScrollPhysics(),
        children: [
          AspectRatio(aspectRatio: 16 / 9, child: const Skeleton(radius: VkRadii.lg)),
          const SizedBox(height: 28),
          const Skeleton(width: 140, height: 20),
          const SizedBox(height: 14),
          Row(children: List.generate(4, (_) => const Expanded(child: Padding(padding: EdgeInsets.only(right: 12), child: AspectRatio(aspectRatio: 1, child: Skeleton(radius: VkRadii.lg)))))),
          const SizedBox(height: 28),
          const Skeleton(width: 140, height: 20),
          const SizedBox(height: 4),
          const ProductGridSkeleton(count: 4, padding: EdgeInsets.symmetric(vertical: 10)),
        ],
      );
}

class _HomeBody extends StatelessWidget {
  final HomeData data;
  const _HomeBody({required this.data});

  @override
  Widget build(BuildContext context) {
    final d = data;
    final about = d.about;
    return ListView(
      padding: const EdgeInsets.only(bottom: 32),
      children: [
        const _Announcement(),
        if (d.hero.isNotEmpty || d.heroBanners.isNotEmpty) _HeroCarousel(slides: d.hero, banners: d.heroBanners),
        if (d.categories.isNotEmpty) ...[
          SectionHead(kicker: 'Our range', title: 'Shop by Category', action: 'See all', onAction: () => context.go('/categories')),
          _CategoryStrip(categories: d.categories),
        ],
        if (d.arrivals.isNotEmpty) ...[
          SectionHead(kicker: 'Curated for you', title: 'New Arrivals', action: 'View all', onAction: () => context.go('/shop')),
          _ProductGrid(items: d.arrivals),
        ],
        for (final b in d.midBanners) _PromoBanner(banner: b),
        _HeritageCard(about: about),
        WhyVkcSection(imageUrl: d.whyImage, onReadStory: () => openSitePage(context, '/about')),
        if (d.blogs.isNotEmpty) ...[
          SectionHead(kicker: 'From the blog', title: 'Stories from the cane fields', action: 'View all', onAction: () => context.push('/journal')),
          _BlogPager(posts: d.blogs),
        ],
        if (d.testimonials.isNotEmpty) ...[
          const SectionHead(kicker: 'Customer stories', title: 'What our customers say'),
          _TestimonialPager(items: d.testimonials),
        ],
        if (d.gallery.isNotEmpty) ...[
          SectionHead(kicker: 'Behind the scenes', title: 'Gallery', action: 'See all', onAction: () => context.push('/gallery')),
          _GalleryStrip(items: d.gallery),
        ],
        for (final b in d.bottomBanners) _PromoBanner(banner: b),
        _TrustCards(returnsDays: about?.returnsDays ?? 0),
        const _Newsletter(),
        const _HomeFooter(),
      ],
    );
  }
}

/// The store's announcement strip — the same line the website runs across
/// the top of every page, shown only while the store has it switched on.
class _Announcement extends StatelessWidget {
  const _Announcement();
  @override
  Widget build(BuildContext context) => ValueListenableBuilder<StoreConfig>(
        valueListenable: storeConfig,
        builder: (context, cfg, _) {
          if (!cfg.announcementActive) return const SizedBox.shrink();
          return Container(
            width: double.infinity,
            margin: const EdgeInsets.fromLTRB(20, 4, 20, 14),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(
              color: VkColors.amberSoft,
              borderRadius: BorderRadius.circular(VkRadii.sm),
            ),
            child: Row(children: [
              const Icon(Icons.campaign_outlined, size: 15, color: VkColors.primaryDeep),
              const SizedBox(width: 8),
              Expanded(child: Text(cfg.announcement, style: VkText.body(11.5, color: VkColors.ink2, height: 1.4))),
            ]),
          );
        },
      );
}

// ── Hero carousel ────────────────────────────────────────────────────────────

class _Slide {
  final String image;
  final String? tag, heading, cta, href;
  const _Slide({required this.image, this.tag, this.heading, this.cta, this.href});
}

class _HeroCarousel extends StatefulWidget {
  final List<HeroSlide> slides;
  final List<m.Banner> banners;
  const _HeroCarousel({required this.slides, required this.banners});
  @override
  State<_HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<_HeroCarousel> {
  late final PageController _ctrl = PageController();
  Timer? _auto;
  int _page = 0;
  bool _userTouching = false;

  List<_Slide> get _items => [
        for (final h in widget.slides)
          _Slide(image: h.imageUrl!, tag: h.tag, heading: h.heading, cta: h.ctaLabel, href: h.ctaHref),
        for (final b in widget.banners) _Slide(image: b.image!, heading: b.title, tag: b.subtitle, href: b.linkUrl),
      ];

  @override
  void initState() {
    super.initState();
    _startAuto();
  }

  void _startAuto() {
    _auto?.cancel();
    if (_items.length < 2) return;
    _auto = Timer.periodic(const Duration(milliseconds: 4800), (_) {
      if (!mounted || _userTouching || !_ctrl.hasClients) return;
      final next = (_page + 1) % _items.length;
      _ctrl.animateToPage(next, duration: const Duration(milliseconds: 650), curve: Curves.easeInOutCubic);
    });
  }

  @override
  void dispose() {
    _auto?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;
    if (items.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 0),
      child: Column(children: [
        AspectRatio(
          aspectRatio: 16 / 9,
          child: Listener(
            onPointerDown: (_) => _userTouching = true,
            onPointerUp: (_) => _userTouching = false,
            onPointerCancel: (_) => _userTouching = false,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(VkRadii.lg),
              child: PageView.builder(
                controller: _ctrl,
                itemCount: items.length,
                onPageChanged: (i) => setState(() => _page = i),
                itemBuilder: (_, i) => AnimatedBuilder(
                  animation: _ctrl,
                  builder: (context, child) {
                    // Subtle parallax: the picture drifts a touch slower than
                    // the page it sits on.
                    double delta = 0;
                    if (_ctrl.hasClients && _ctrl.position.haveDimensions) {
                      delta = ((_ctrl.page ?? _page.toDouble()) - i).clamp(-1.0, 1.0);
                    }
                    return _HeroSlideView(slide: items[i], parallax: delta * 28);
                  },
                ),
              ),
            ),
          ),
        ),
        if (items.length > 1) ...[
          const SizedBox(height: 10),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            for (var i = 0; i < items.length; i++)
              AnimatedContainer(
                duration: VkMotion.base,
                curve: VkMotion.curve,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: i == _page ? 20 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: i == _page ? VkColors.primary : VkColors.rule2,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
          ]),
        ],
      ]),
    );
  }
}

class _HeroSlideView extends StatelessWidget {
  final _Slide slide;
  final double parallax;
  const _HeroSlideView({required this.slide, required this.parallax});
  @override
  Widget build(BuildContext context) {
    final hasText = (slide.heading ?? '').trim().isNotEmpty || (slide.tag ?? '').trim().isNotEmpty;
    return GestureDetector(
      onTap: () => openLink(context, slide.href, fallback: '/shop'),
      child: Stack(fit: StackFit.expand, children: [
        Transform.translate(
          offset: Offset(parallax, 0),
          child: Transform.scale(scale: 1.08, child: NetImage(url: slide.image, radius: 0)),
        ),
        if (hasText)
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                stops: [0.35, 1],
                colors: [Colors.transparent, Color(0xB33A1F0A)],
              ),
            ),
          ),
        if (hasText)
          Positioned(
            left: 16,
            right: 16,
            bottom: 14,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              if ((slide.tag ?? '').trim().isNotEmpty)
                Text(slide.tag!.trim().toUpperCase(), style: VkText.upper(8.5, color: VkColors.amberSoft, letter: 0.2)),
              if ((slide.heading ?? '').trim().isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(slide.heading!.replaceAll('\n', ' '),
                    maxLines: 2, overflow: TextOverflow.ellipsis, style: VkText.display(22, color: Colors.white, height: 1.08)),
              ],
              if ((slide.cta ?? '').trim().isNotEmpty) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(color: VkColors.paper, borderRadius: BorderRadius.circular(999)),
                  child: Text(slide.cta!.toUpperCase(), style: VkText.upper(9, color: VkColors.ink, letter: 0.12, weight: FontWeight.w700)),
                ),
              ],
            ]),
          ),
      ]),
    );
  }
}

// ── Sections ─────────────────────────────────────────────────────────────────

class _CategoryStrip extends StatelessWidget {
  final List<EcomCategory> categories;
  const _CategoryStrip({required this.categories});
  @override
  Widget build(BuildContext context) => SizedBox(
        height: 88 + 9 + 34,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: categories.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (_, i) => CategoryTile(
            width: 88,
            category: categories[i],
            onTap: () => context.push('/listing?cat=${categories[i].slug}&title=${Uri.encodeComponent(categories[i].name)}'),
          ),
        ),
      );
}

class _ProductGrid extends StatelessWidget {
  final List<Product> items;
  const _ProductGrid({required this.items});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: LayoutBuilder(
          builder: (context, box) => GridView.builder(
            gridDelegate: productGridDelegate(context, box.maxWidth),
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: EdgeInsets.zero,
            itemCount: items.length,
            itemBuilder: (context, i) {
              final p = items[i];
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
      );
}

class _PromoBanner extends StatelessWidget {
  final m.Banner banner;
  const _PromoBanner({required this.banner});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
        child: PressScale(
          onTap: () => openLink(context, banner.linkUrl, fallback: '/shop'),
          scale: 0.985,
          child: AspectRatio(aspectRatio: 2, child: NetImage(url: banner.image, radius: VkRadii.lg)),
        ),
      );
}

/// "Our Heritage" — the photograph whole, a few lines and Read Our Story,
/// which opens the website's About page in the phone's browser.
class _HeritageCard extends StatelessWidget {
  final AboutContent? about;
  const _HeritageCard({required this.about});
  @override
  Widget build(BuildContext context) {
    final a = about;
    final eyebrow = a?.eyebrow ?? 'Our Heritage';
    final heading = a?.heading ?? 'Rooted in Mandya since 1988';
    final body = a?.body ??
        'Every VKC Gold Ikshu product begins in the sugarcane fields of Mandya, with farmers we have worked alongside for decades. We pay fairly, process without chemicals, and let the cane speak for itself.';
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, VkSpace.section, 20, 0),
      child: Container(
        decoration: BoxDecoration(
          color: VkColors.leafSoft,
          borderRadius: BorderRadius.circular(VkRadii.lg),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if ((a?.storyImage ?? '').isNotEmpty) _StoryImage(url: a!.storyImage!),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(color: VkColors.paper, borderRadius: BorderRadius.circular(999)),
                child: Text(eyebrow.toUpperCase(), style: VkText.upper(8.5, color: VkColors.leaf, letter: 0.16, weight: FontWeight.w700)),
              ),
              const SizedBox(height: 12),
              Text(heading, style: VkText.display(24, height: 1.08)),
              const SizedBox(height: 8),
              Text(body, maxLines: 4, overflow: TextOverflow.ellipsis, style: VkText.body(13, color: VkColors.ink2, height: 1.6)),
              if ((a?.quote ?? '').isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.only(left: 12),
                  decoration: const BoxDecoration(border: Border(left: BorderSide(color: VkColors.leaf, width: 2))),
                  child: Text(a!.quote, maxLines: 3, overflow: TextOverflow.ellipsis,
                      style: VkText.display(15, color: VkColors.ink2, style: FontStyle.italic, weight: FontWeight.w500, height: 1.35)),
                ),
              ],
              const SizedBox(height: 16),
              PrimaryButton(
                label: a?.ctaLabel ?? 'Read Our Story',
                icon: Icons.auto_stories_outlined,
                expanded: false,
                height: 44,
                color: VkColors.leaf,
                onTap: () => openSitePage(context, '/about'),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

/// One card at a time, full width, with dots — the house slider for Why VKC,
/// the blog and customer stories, so nothing ever shows as one and a half.
class _Pager extends StatefulWidget {
  final int count;
  final double height;
  final bool auto;
  final Widget Function(BuildContext, int) itemBuilder;
  const _Pager({required this.count, required this.height, required this.itemBuilder, this.auto = false});
  @override
  State<_Pager> createState() => _PagerState();
}

class _PagerState extends State<_Pager> {
  late final PageController _ctrl = PageController();
  Timer? _auto;
  int _page = 0;
  bool _touching = false;

  @override
  void initState() {
    super.initState();
    if (widget.auto && widget.count > 1) {
      _auto = Timer.periodic(const Duration(seconds: 4), (_) {
        if (!mounted || _touching || !_ctrl.hasClients) return;
        _ctrl.animateToPage((_page + 1) % widget.count, duration: const Duration(milliseconds: 600), curve: Curves.easeInOutCubic);
      });
    }
  }

  @override
  void dispose() {
    _auto?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Column(children: [
        SizedBox(
          height: widget.height,
          child: Listener(
            onPointerDown: (_) => _touching = true,
            onPointerUp: (_) => _touching = false,
            onPointerCancel: (_) => _touching = false,
            child: PageView.builder(
              controller: _ctrl,
              itemCount: widget.count,
              onPageChanged: (i) => setState(() => _page = i),
              itemBuilder: (context, i) => Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: widget.itemBuilder(context, i)),
            ),
          ),
        ),
        if (widget.count > 1) ...[
          const SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            for (var i = 0; i < widget.count; i++)
              AnimatedContainer(
                duration: VkMotion.base,
                curve: VkMotion.curve,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: i == _page ? 18 : 6,
                height: 6,
                decoration: BoxDecoration(color: i == _page ? VkColors.primary : VkColors.rule2, borderRadius: BorderRadius.circular(3)),
              ),
          ]),
        ],
      ]);
}

/// The latest posts, one at a time: a wide picture, the date and the title.
class _BlogPager extends StatelessWidget {
  final List<BlogPost> posts;
  const _BlogPager({required this.posts});
  @override
  Widget build(BuildContext context) => _Pager(
        count: posts.length,
        height: 296,
        itemBuilder: (context, i) {
          final p = posts[i];
          return PressScale(
            onTap: () => context.push('/journal/${p.slug}'),
            scale: 0.985,
            child: Container(
              decoration: BoxDecoration(color: VkColors.paper, borderRadius: BorderRadius.circular(VkRadii.lg), border: Border.all(color: VkColors.rule)),
              clipBehavior: Clip.antiAlias,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                AspectRatio(aspectRatio: 16 / 9, child: NetImage(url: p.imageUrl, radius: 0, seed: i, placeholderIcon: Icons.menu_book_outlined)),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    if (p.publishedAt != null)
                      Text(DateFormat('d MMM yyyy').format(p.publishedAt!.toLocal()).toUpperCase(), style: VkText.upper(8, color: VkColors.primary, letter: 0.16)),
                    const SizedBox(height: 5),
                    Text(p.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: VkText.ui(14.5, weight: FontWeight.w600, height: 1.3)),
                    const SizedBox(height: 8),
                    Row(children: [
                      Text('Read more', style: VkText.ui(12, weight: FontWeight.w600, color: VkColors.primary)),
                      const SizedBox(width: 2),
                      const Icon(Icons.arrow_forward_rounded, size: 14, color: VkColors.primary),
                    ]),
                  ]),
                ),
              ]),
            ),
          );
        },
      );
}

/// Customer stories, one at a time.
class _TestimonialPager extends StatelessWidget {
  final List<Testimonial> items;
  const _TestimonialPager({required this.items});
  @override
  Widget build(BuildContext context) => _Pager(
        count: items.length,
        height: 176,
        auto: true,
        itemBuilder: (_, i) {
          final t = items[i];
          return Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(color: VkColors.paper, borderRadius: BorderRadius.circular(VkRadii.lg), border: Border.all(color: VkColors.rule)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              RatingStars(rating: t.rating.toDouble(), size: 15),
              const SizedBox(height: 8),
              Expanded(
                child: Text('“${t.quote.trim()}”', maxLines: 4, overflow: TextOverflow.ellipsis, style: VkText.body(13, color: VkColors.ink2, height: 1.5)),
              ),
              const SizedBox(height: 10),
              Row(children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: const BoxDecoration(color: VkColors.amberSoft, shape: BoxShape.circle),
                  clipBehavior: Clip.antiAlias,
                  alignment: Alignment.center,
                  child: (t.avatarUrl ?? '').isNotEmpty ? NetImage(url: t.avatarUrl, radius: 16) : Text(t.initial, style: VkText.display(15, color: VkColors.primaryDeep)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(t.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.ui(12.5, weight: FontWeight.w600)),
                    if ((t.location ?? t.tag ?? '').isNotEmpty)
                      Text([t.location, t.tag].where((s) => (s ?? '').isNotEmpty).join(' · '), maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.mono(10, color: VkColors.muted)),
                  ]),
                ),
              ]),
            ]),
          );
        },
      );
}

/// The four promises as four matching cards, two to a row. Returns default
/// to the website's seven days when the store has not set a number.
class _TrustCards extends StatelessWidget {
  final int returnsDays;
  const _TrustCards({required this.returnsDays});
  @override
  Widget build(BuildContext context) => ValueListenableBuilder<StoreConfig>(
        valueListenable: storeConfig,
        builder: (context, cfg, _) {
          final days = returnsDays > 0 ? returnsDays : 7;
          final items = <(IconData, String, String)>[
            (Icons.eco_outlined, '100% Natural', 'No chemicals or preservatives'),
            (Icons.local_shipping_outlined, 'Free shipping', 'On orders above ₹${inr(cfg.freeShippingThreshold)}'),
            (Icons.autorenew_rounded, '$days-day returns', 'Easy return & exchange'),
            (Icons.lock_outline_rounded, 'Secure payment', 'Safe, encrypted checkout'),
          ];
          return Padding(
            padding: const EdgeInsets.fromLTRB(20, VkSpace.section, 20, 0),
            child: GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: EdgeInsets.zero,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 12, crossAxisSpacing: 12, mainAxisExtent: 118),
              itemCount: items.length,
              itemBuilder: (_, i) {
                final t = items[i];
                return Container(
                  padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
                  decoration: BoxDecoration(color: VkColors.paper, border: Border.all(color: VkColors.rule), borderRadius: BorderRadius.circular(VkRadii.lg)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: const BoxDecoration(color: VkColors.cream, shape: BoxShape.circle),
                      child: Icon(t.$1, size: 18, color: VkColors.primaryDeep),
                    ),
                    const Spacer(),
                    Text(t.$2, maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.ui(12.5, weight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(t.$3, maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.body(10.5, color: VkColors.muted, height: 1.3)),
                  ]),
                );
              },
            ),
          );
        },
      );
}

/// The app's footer: the brand, its line, and where to find us. Nothing else.
class _HomeFooter extends StatelessWidget {
  const _HomeFooter();
  @override
  Widget build(BuildContext context) => ValueListenableBuilder<StoreConfig>(
        valueListenable: storeConfig,
        builder: (context, cfg, _) => Padding(
          padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
          child: Column(children: [
            const DoubleRule(),
            const SizedBox(height: 22),
            const BrandLogo(height: 44),
            const SizedBox(height: 14),
            Text('Rooted in Legacy. Led with Purpose.', textAlign: TextAlign.center, style: VkText.display(19, color: VkColors.ink, height: 1.15)),
            if (cfg.storeAddress.isNotEmpty) ...[
              const SizedBox(height: 12),
              Row(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Padding(padding: EdgeInsets.only(top: 2), child: Icon(Icons.location_on_outlined, size: 15, color: VkColors.primaryDeep)),
                const SizedBox(width: 6),
                Flexible(child: Text(cfg.storeAddress, textAlign: TextAlign.center, style: VkText.body(12.5, color: VkColors.ink2, height: 1.5))),
              ]),
            ],
            const SizedBox(height: 22),
            Text('© ${DateTime.now().year} VKC GOLD IKSHU · MANDYA · SINCE 1988', style: VkText.upper(8, color: VkColors.muted2, letter: 0.2)),
          ]),
        ),
      );
}

/// The heritage photograph, shown whole: it takes the card's width and its
/// own height, so nothing is cropped away.
class _StoryImage extends StatelessWidget {
  final String url;
  const _StoryImage({required this.url});
  @override
  Widget build(BuildContext context) => CachedNetworkImage(
        imageUrl: url,
        width: double.infinity,
        fit: BoxFit.fitWidth,
        fadeInDuration: VkMotion.base,
        placeholder: (_, __) => const AspectRatio(aspectRatio: 16 / 9, child: Skeleton(radius: 0)),
        errorWidget: (_, __, ___) => const AspectRatio(aspectRatio: 16 / 9, child: PlaceholderTile(radius: 0, icon: Icons.grass_rounded)),
      );
}

/// "Sweetness in your inbox" — the same sign-up the website footer offers,
/// feeding the same list (POST /v1/newsletter).
class _Newsletter extends StatefulWidget {
  const _Newsletter();
  @override
  State<_Newsletter> createState() => _NewsletterState();
}

class _NewsletterState extends State<_Newsletter> {
  final _email = TextEditingController();
  bool _sending = false;
  String? _done;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final value = _email.text.trim();
    final ok = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$').hasMatch(value);
    if (!ok) {
      setState(() => _error = 'Enter a valid email address');
      return;
    }
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await EcomApi.I.subscribe(value);
      if (!mounted) return;
      setState(() {
        _done = 'You are on the list. Thank you!';
        _email.clear();
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Could not subscribe right now. Please try again.');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
          decoration: BoxDecoration(color: VkColors.primaryInk, borderRadius: BorderRadius.circular(VkRadii.lg)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('STAY IN THE LOOP', style: VkText.upper(8.5, color: VkColors.amberSoft, letter: 0.2)),
            const SizedBox(height: 6),
            Text('Sweetness in your inbox', style: VkText.display(22, color: Colors.white, height: 1.08)),
            const SizedBox(height: 6),
            Text('New arrivals, exclusive offers and jaggery recipes — straight to your inbox.',
                style: VkText.body(12.5, color: Colors.white.withValues(alpha: 0.75), height: 1.45)),
            const SizedBox(height: 14),
            if (_done != null)
              Row(children: [
                const Icon(Icons.check_circle_rounded, size: 18, color: VkColors.amber),
                const SizedBox(width: 8),
                Expanded(child: Text(_done!, style: VkText.ui(13, color: Colors.white, weight: FontWeight.w600))),
              ])
            else ...[
              Row(children: [
                Expanded(
                  child: Container(
                    height: 46,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(VkRadii.md),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
                    ),
                    alignment: Alignment.centerLeft,
                    child: TextField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => _submit(),
                      style: VkText.ui(13.5, color: Colors.white),
                      cursorColor: VkColors.amber,
                      decoration: InputDecoration(
                        isDense: true,
                        border: InputBorder.none,
                        hintText: 'Your email address',
                        hintStyle: VkText.ui(13.5, color: Colors.white.withValues(alpha: 0.5), weight: FontWeight.w400),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                PrimaryButton(label: _sending ? 'Sending…' : 'Subscribe', expanded: false, height: 46, color: VkColors.amber, onTap: _sending ? null : _submit),
              ]),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: VkText.body(11.5, color: VkColors.amberSoft)),
              ],
            ],
          ]),
        ),
      );
}


class _GalleryStrip extends StatelessWidget {
  final List<GalleryItem> items;
  const _GalleryStrip({required this.items});
  @override
  Widget build(BuildContext context) => SizedBox(
        height: 118,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: items.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (_, i) => PressScale(
            onTap: () => context.push('/gallery'),
            child: SizedBox(width: 118, height: 118, child: NetImage(url: items[i].url, radius: VkRadii.md, seed: i, placeholderIcon: Icons.photo_outlined)),
          ),
        ),
      );
}

