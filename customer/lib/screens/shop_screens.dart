import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../data.dart';
import '../ecom/ecom_adapter.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_config.dart';
import '../ecom/ecom_wishlist.dart';
import 'content_screens.dart';
import '../ecom/ecom_models.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets.dart';

String _grouped(num v) => v.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');

/// What Home last drew, held for the app's lifetime.
///
/// Home sits inside the shell route, so every tab switch disposes and recreates
/// its State — which re-ran all four calls and put the skeleton back up even
/// though nothing had changed. Painting the last snapshot first makes coming
/// back to Home instant; if it has gone stale it is revalidated quietly in the
/// background, with no skeleton and no flash of empty.
class _HomeSnapshot {
  static List<Product> products = const [];
  static List<Product> featured = const [];
  static List<EcomCategory> cats = const [];
  static List<HeroSlide> hero = const [];
  static DateTime? at;
  static const ttl = Duration(minutes: 5);

  static bool get has => at != null && products.isNotEmpty;
  static bool get fresh => at != null && DateTime.now().difference(at!) < ttl;

  static void save(List<Product> p, List<Product> f, List<EcomCategory> c, List<HeroSlide> h) {
    products = p;
    featured = f;
    cats = c;
    hero = h;
    at = DateTime.now();
  }
}

/// Fetches Home's data while the splash is still on screen.
///
/// Home used to fire its four calls only once it mounted, so the customer
/// watched the splash finish and *then* waited on the network behind a
/// skeleton. Running them during the splash means Home usually paints straight
/// from memory. Every failure is swallowed: Home still does its own resilient
/// load when the snapshot is empty.
Future<void> prewarmHome() async {
  if (_HomeSnapshot.has) return;
  Future<T?> quiet<T>(Future<T> Function() call) async {
    try {
      return await call();
    } catch (_) {
      return null;
    }
  }

  final newestF = quiet(() => EcomApi.I.products(sort: 'newest', limit: 10));
  final featuredF = quiet(() => EcomApi.I.products(isFeatured: true, limit: 6));
  final catsF = quiet(() => EcomApi.I.categories(flat: true));
  final heroF = quiet(() => EcomApi.I.heroSlides());

  final newest = await newestF;
  final featured = await featuredF;
  final cats = await catsF;
  final hero = await heroF;
  // The catalogue is the one part Home cannot draw without.
  if (newest == null || newest.products.isEmpty || _HomeSnapshot.has) return;
  _HomeSnapshot.save(
    productsFromEcom(newest.products),
    productsFromEcom((featured?.products.isNotEmpty ?? false) ? featured!.products : newest.products),
    cats ?? const [],
    (hero ?? const []).where((h) => (h.imageUrl ?? '').isNotEmpty).toList(),
  );
}

// ── Home ─────────────────────────────────────────────────────────────────────
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Product> _products = [];
  List<Product> _featured = [];
  List<EcomCategory> _cats = [];
  List<HeroSlide> _hero = [];
  bool _loading = true;
  bool _error = false;

  /// Owned for the State's lifetime — building one per frame leaked a
  /// controller each rebuild and reset the carousel to the first slide.
  final PageController _heroCtrl = PageController(viewportFraction: 0.92);

  @override
  void initState() {
    super.initState();
    if (_HomeSnapshot.has) {
      _products = _HomeSnapshot.products;
      _featured = _HomeSnapshot.featured;
      _cats = _HomeSnapshot.cats;
      _hero = _HomeSnapshot.hero;
      _loading = false;
      // Already on screen — only go back to the network if it has aged out,
      // and then without disturbing what the customer is looking at.
      if (!_HomeSnapshot.fresh) _load(silent: true);
      // _load normally does this; the snapshot path skips it, and the store's
      // promotion should still get its one showing.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) PromoPopup.maybeShow(context);
      });
    } else {
      _load();
    }
  }

  @override
  void dispose() {
    _heroCtrl.dispose();
    super.dispose();
  }

  /// Runs one call, retrying once, and returns null instead of throwing.
  ///
  /// Home used to `Future.wait` on four calls at once, so ONE of them failing
  /// blanked the whole store behind "Couldn't load the store" even when the
  /// catalogue had arrived. On a flaky connection the odds of at least one of
  /// four failing are roughly four times a single call's — which is why it
  /// showed up on patchy Wi-Fi but not on mobile data.
  Future<T?> _soft<T>(Future<T> Function() call) async {
    for (var attempt = 0; attempt < 2; attempt++) {
      try {
        return await call();
      } catch (_) {
        if (attempt == 1) return null;
        await Future<void>.delayed(const Duration(milliseconds: 400));
      }
    }
    return null;
  }

  Future<void> _load({bool force = false, bool silent = false}) async {
    if (mounted && !silent) setState(() => _loading = true);
    // Kicked off together, awaited individually: each section stands or falls
    // on its own.
    final newestF = _soft(() => EcomApi.I.products(sort: 'newest', limit: 10));
    final featuredF = _soft(() => EcomApi.I.products(isFeatured: true, limit: 6));
    final catsF = _soft(() => EcomApi.I.categories(flat: true, force: force));
    final heroF = _soft(() => EcomApi.I.heroSlides(force: force));

    final newest = (await newestF)?.products;
    final featured = (await featuredF)?.products;
    final cats = await catsF;
    final hero = await heroF;
    if (!mounted) return;

    // Only the catalogue is essential. Never substitute sample data — showing
    // sarees that aren't really for sale is worse than showing an error.
    if (newest == null && _products.isEmpty) {
      setState(() {
        _error = true;
        _loading = false;
      });
      return;
    }
    setState(() {
      _error = false;
      if (newest != null) _products = productsFromEcom(newest);
      if (featured != null || newest != null) {
        _featured = productsFromEcom((featured?.isNotEmpty ?? false) ? featured! : (newest ?? const []));
      }
      if (cats != null) _cats = cats;
      if (hero != null) _hero = hero.where((h) => (h.imageUrl ?? '').isNotEmpty).toList();
      _loading = false;
    });
    // Only stamp the snapshot when the network actually answered — a failed
    // silent refresh must not renew the TTL on data it never revalidated.
    if (newest != null) _HomeSnapshot.save(_products, _featured, _cats, _hero);
    // The store's promotion, once the home screen actually has something
    // behind it to come back to.
    if (mounted) PromoPopup.maybeShow(context);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _products.isEmpty) return _skeleton();
    if (_error && _products.isEmpty) return _errorState();
    final trending = _products.take(4).toList();
    final flash = (_featured.isNotEmpty ? _featured : _products).take(3).toList();
    // No wishlist listener around the whole page — each card's heart
    // subscribes for itself, so favouriting no longer rebuilds all of Home.
    return RefreshIndicator(
      color: VlColors.red,
      onRefresh: () => _load(force: true),
      child: ListView(
        // Clears the video-call FAB, which was sitting on top of the last
        // trust tile at the bottom of the page.
        padding: const EdgeInsets.only(bottom: 96),
        children: [
          _header(context),
          _announcement(),
          _search(context),
          _liveBanner(context),
          if (_hero.isNotEmpty) _heroBanner(context),
          // Only advertise weaves we actually have — never the design
          // placeholder list, which links to listings that don't exist.
          // Every section closes with a rule, so titles, product rows and
          // the block that follows never read as one run-on stretch.
          if (_cats.isNotEmpty) ...[
            SectionHead(
                kicker: const Text('SHOP BY WEAVE'),
                title: 'Heritage Categories',
                action: 'View all',
                onAction: () => context.go('/shop')),
            _categoryRow(context),
            const SectionDivider(),
          ],
          if (flash.isNotEmpty) ...[
            SectionHead(kicker: const Text('HANDPICKED FOR YOU'), title: 'Featured', action: 'See all', onAction: () => context.push('/listing')),
            _hRow(context, flash),
            const SectionDivider(),
          ],
          if (trending.isNotEmpty) ...[
            SectionHead(kicker: const Text('FRESH ARRIVALS'), title: 'New In', action: 'View all', onAction: () => context.push('/listing')),
            _grid(context, trending),
            const SectionDivider(),
          ],
          const SizedBox(height: 22),
          _trustFooter(),
        ],
      ),
    );
  }

  // ── Real hero banner carousel (/v1/hero-slides) ───────────────────────────
  Widget _heroBanner(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 18),
      child: SizedBox(
        height: 180,
        // A single slide needs no pager — this also keeps the controller's
        // viewportFraction constant, so it can live for the State's lifetime
        // instead of being rebuilt (and leaked) on every frame.
        child: _hero.length == 1
            ? _heroSlide(context, 0)
            : PageView.builder(
                controller: _heroCtrl,
                itemCount: _hero.length,
                padEnds: false,
                itemBuilder: (_, i) => _heroSlide(context, i),
              ),
      ),
    );
  }

  Widget _heroSlide(BuildContext context, int i) {
            final h = _hero[i];
            return Padding(
              padding: EdgeInsets.only(right: i < _hero.length - 1 ? 10 : 0),
              child: GestureDetector(
                // Follow the slide's own CTA (the store points these at a
                // category or a campaign), not a fixed listing.
                onTap: () => openLink(context, h.ctaHref, fallback: '/listing'),
                child: Stack(fit: StackFit.expand, children: [
                  NetImage(url: h.imageUrl, radius: VlRadii.lg),
                  if ((h.heading ?? '').isNotEmpty || (h.tag ?? '').isNotEmpty)
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(VlRadii.lg),
                          gradient: LinearGradient(begin: Alignment.centerLeft, end: Alignment.centerRight, colors: [
                            VlColors.redInk.withValues(alpha: 0.5),
                            Colors.transparent,
                          ]),
                        ),
                      ),
                    ),
                  Positioned(
                    left: 16,
                    bottom: 16,
                    right: 16,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                      if ((h.tag ?? '').isNotEmpty) Text(h.tag!.toUpperCase(), style: VlText.upper(9, color: Colors.white, letter: 0.2)),
                      if ((h.heading ?? '').isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(h.heading!, maxLines: 2, overflow: TextOverflow.ellipsis, style: VlText.display(20, color: Colors.white)),
                      ],
                    ]),
                  ),
                ]),
              ),
            );
  }

  Widget _skeleton() => ListView(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
        physics: const NeverScrollableScrollPhysics(),
        children: [
          Row(children: [
            const Skeleton(width: 38, height: 38, radius: 19),
            const SizedBox(width: 10),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
              Skeleton(width: 60, height: 8),
              SizedBox(height: 6),
              Skeleton(width: 120, height: 12),
            ]),
          ]),
          const SizedBox(height: 16),
          const Skeleton(height: 48, radius: VlRadii.lg),
          const SizedBox(height: 16),
          const Skeleton(height: 170, radius: VlRadii.lg),
          const SizedBox(height: 20),
          Row(children: List.generate(4, (_) => const Expanded(child: Padding(padding: EdgeInsets.only(right: 12), child: Skeleton(height: 92))))),
          const SizedBox(height: 24),
          GridView.count(
            crossAxisCount: 2,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 0.62,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: List.generate(4, (_) => const Skeleton(radius: VlRadii.md)),
          ),
        ],
      );

  Widget _header(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
        child: Row(children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(color: VlColors.redInk, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text('V', style: VlText.display(18, color: Colors.white, style: FontStyle.italic)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('NAMASTE', style: VlText.upper(9, letter: 0.2, color: VlColors.muted)),
              // Real identity only. This previously hardcoded a location
              // ("Indiranagar, Bengaluru") for every customer — the app has no
              // location permission and never geocodes, so it was fabricated.
              ValueListenableBuilder<EcomUser?>(
                valueListenable: EcomAuth.I.user,
                builder: (_, u, __) => Text(
                  u?.displayName ?? 'Guest',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: VlText.ui(13, weight: FontWeight.w500),
                ),
              ),
            ]),
          ),
          // No unread state exists behind notifications, so the dot was always
          // on — a badge that never clears is just noise.
          // push, not go: these are detail screens reached from Home, and go()
          // replaced the stack so the system back button quit the app.
          _circleBtn(Icons.notifications_none, () => context.push('/notifications')),
          const SizedBox(width: 8),
          _circleBtn(Icons.favorite_border, () => context.push('/wishlist')),
        ]),
      );

  Widget _circleBtn(IconData ic, VoidCallback onTap, {bool dot = false}) => GestureDetector(
        onTap: onTap,
        child: Stack(children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: VlColors.paper,
              shape: BoxShape.circle,
              border: Border.all(color: VlColors.rule),
            ),
            child: Icon(ic, size: 16, color: VlColors.ink),
          ),
          if (dot)
            Positioned(
              top: 7,
              right: 9,
              child: CircleAvatar(radius: 3, backgroundColor: VlColors.red),
            ),
        ]),
      );

  /// The store's announcement strip — the same line the website runs across
  /// the top of every page, shown only while the store has it switched on.
  Widget _announcement() => ValueListenableBuilder<StoreConfig>(
        valueListenable: storeConfig,
        builder: (context, cfg, _) {
          if (!cfg.announcementActive) return const SizedBox.shrink();
          return Container(
            width: double.infinity,
            margin: const EdgeInsets.fromLTRB(20, 6, 20, 0),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(
              color: VlColors.cream,
              borderRadius: BorderRadius.circular(VlRadii.sm),
              border: Border.all(color: VlColors.gold),
            ),
            child: Row(children: [
              Icon(Icons.campaign_outlined, size: 14, color: VlColors.red),
              const SizedBox(width: 8),
              Expanded(child: Text(cfg.announcement, style: VlText.body(11, color: VlColors.ink2, height: 1.4))),
            ]),
          );
        },
      );

  Widget _search(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 14),
        child: GestureDetector(
          // Opens the listing with its search field focused — this bar is just
          // the affordance; the real input lives on the results screen.
          onTap: () => context.push('/listing?focus=1'),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: VlColors.paper,
              borderRadius: BorderRadius.circular(VlRadii.lg),
              border: Border.all(color: VlColors.rule),
            ),
            child: Row(children: [
              Icon(Icons.search, size: 16, color: VlColors.muted),
              const SizedBox(width: 10),
              // No camera affordance: the store has no image search, and the
              // icon promised one.
              Expanded(child: Text('Search Kanjivaram, Banarasi, weave…', style: VlText.ui(13, color: VlColors.muted))),
            ]),
          ),
        ),
      );

  Widget _liveBanner(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 18),
        child: GestureDetector(
          onTap: () => context.go('/live'),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(VlRadii.lg),
            child: SizedBox(
              height: 170,
              child: Stack(fit: StackFit.expand, children: [
                const Silk(palette: 0, radius: 0),
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [VlColors.redInk.withValues(alpha: 0.55), Colors.transparent],
                    ),
                  ),
                ),
                Positioned(
                  top: 14,
                  left: 14,
                  child: GlassChip(
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const CircleAvatar(radius: 3, backgroundColor: Colors.white),
                      const SizedBox(width: 6),
                      Text('LIVE SHOPPING', style: VlText.ui(10, weight: FontWeight.w600, color: Colors.white, letter: 0.18)),
                    ]),
                  ),
                ),
                Positioned(
                  left: 14,
                  right: 14,
                  bottom: 14,
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('VKC GOLD STUDIO', style: VlText.upper(9, color: Colors.white70, letter: 0.22)),
                    const SizedBox(height: 4),
                    Text('Shop our sarees, live',
                        maxLines: 1, overflow: TextOverflow.ellipsis, style: VlText.display(18, color: Colors.white)),
                    const SizedBox(height: 8),
                    Row(children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(color: VlColors.paper, borderRadius: BorderRadius.circular(4)),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Icon(Icons.play_arrow, size: 12, color: VlColors.redInk),
                          const SizedBox(width: 5),
                          Text('WATCH LIVE', style: VlText.ui(11, weight: FontWeight.w600, color: VlColors.redInk, letter: 0.12)),
                        ]),
                      ),
                    ]),
                  ]),
                ),
              ]),
            ),
          ),
        ),
      );

  Widget _errorState() => Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 40),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.wifi_off_rounded, size: 40, color: VlColors.muted2),
            const SizedBox(height: 16),
            Text("Couldn't load the store", style: VlText.display(22), textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text('Check your connection and try again.',
                style: VlText.body(13, color: VlColors.muted), textAlign: TextAlign.center),
            const SizedBox(height: 20),
            GestureDetector(
              onTap: _load,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 13),
                decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
                child: Text('RETRY', style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.12)),
              ),
            ),
          ]),
        ),
      );

  Widget _categoryRow(BuildContext context) {
    // Real categories when loaded; else the static design list.
    final useReal = _cats.isNotEmpty;
    final count = useReal ? (_cats.length > 8 ? 8 : _cats.length) : (categories.length > 6 ? 6 : categories.length);
    return SizedBox(
      // Taller and wider than before: "CHIFFAN SAREES" and "SILK COTTON" were
      // ellipsised into "CHIFFAN…" in an 80dp tile with a single line.
      height: 168,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
        itemCount: count,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (_, i) {
          final String label, slug;
          final int palette;
          final String? imageUrl;
          if (useReal) {
            final c = _cats[i];
            label = c.name;
            slug = c.slug;
            palette = paletteFor(c.slug);
            imageUrl = c.imageUrl;
          } else {
            final c = categories[i];
            label = c.name;
            slug = c.id;
            palette = c.palette;
            imageUrl = null;
          }
          return GestureDetector(
            onTap: () => context.push('/listing?cat=$slug'),
            child: SizedBox(
              width: 92,
              child: Column(children: [
                SizedBox(
                  width: 92,
                  height: 108,
                  child: NetImage(url: imageUrl, palette: palette),
                ),
                const SizedBox(height: 10),
                Text(label,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: VlText.ui(11, weight: FontWeight.w500)),
              ]),
            ),
          );
        },
      ),
    );
  }

  Widget _hRow(BuildContext context, List<Product> items) => SizedBox(
        // Derived from the card's own geometry rather than a magic 300, so a
        // larger system font stretches the row instead of clipping the price.
        height: 168 * 1.25 + productCardTextHeight(context),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
          itemCount: items.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (_, i) => SizedBox(
            width: 168,
            child: ProductCard(
              key: ValueKey(items[i].variantId ?? items[i].id),
              p: items[i],
              onFav: () => toggleWishlist(context, items[i]),
              onTap: () => context.push('/product/${items[i].id}'),
            ),
          ),
        ),
      );

  Widget _grid(BuildContext context, List<Product> items) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
        child: LayoutBuilder(
          builder: (context, box) => GridView.builder(
          gridDelegate: productGridDelegate(context, box.maxWidth),
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: items.length,
          itemBuilder: (context, i) {
            final p = items[i];
            return ProductCard(
              // Keyed by product: without it Flutter can reuse the element of a
              // card that scrolled away and briefly show one saree's photo
              // against another's price.
              key: ValueKey(p.variantId ?? p.id),
              p: p,
              onFav: () => toggleWishlist(context, p),
              onTap: () => context.push('/product/${p.id}'),
            );
          },
          ),
        ),
      );

  /// Three promises the store actually makes, read from its own settings —
  /// this used to advertise India-wide free shipping, 7-day no-questions
  /// returns and free stitching, none of which the store offers.
  Widget _trustFooter() {
    final cfg = storeConfig.value;
    final items = [
      (
        Icons.local_shipping_outlined,
        // Grouped like every other price in the app — this read "₹10000".
        'Free above ₹${_grouped(cfg.freeShippingThreshold)}',
        'SHIPPED INDIA-WIDE',
      ),
      (Icons.schedule, cfg.deliveryTitle, cfg.deliveryNotes.toUpperCase()),
      // Only promise COD while the store actually offers it — this is the
      // admin's own toggle, not a guess.
      if (paymentMethods.value?.cod == true)
        (Icons.payments_outlined, 'Cash on delivery', 'PAY ON ARRIVAL')
      else
        (Icons.verified_outlined, 'Handpicked weaves', 'QUALITY CHECKED'),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: Row(
        children: [
          for (final t in items) ...[
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: VlColors.paper,
                  border: Border.all(color: VlColors.rule),
                  borderRadius: BorderRadius.circular(VlRadii.md),
                ),
                child: Column(children: [
                  Icon(t.$1, size: 16, color: VlColors.red),
                  const SizedBox(height: 4),
                  Text(t.$2, style: VlText.ui(11, weight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(t.$3, style: VlText.upper(8, color: VlColors.muted, letter: 0.16)),
                ]),
              ),
            ),
            if (t != items.last) const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

// ── Category (Shop by Weave) — real /v1/categories ───────────────────────────
class CategoryScreen extends StatefulWidget {
  const CategoryScreen({super.key});
  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  List<EcomCategory> _cats = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  /// [force] comes from pull-to-refresh, which must bypass the session cache.
  Future<void> _load({bool force = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final cats = await EcomApi.I.categories(flat: true, force: force);
      if (!mounted) return;
      setState(() {
        _cats = cats.where((c) => c.name.isNotEmpty).toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      // A silent empty grid read as "this store has no sarees"; say what
      // actually happened and offer the retry.
      setState(() {
        _error = ecomError(e, 'Could not load the weaves.');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      const TopBar(title: 'Shop by Weave'),
      Expanded(
        child: _loading && _cats.isEmpty
            ? const _CategorySkeleton()
            : _error != null && _cats.isEmpty
                ? _errorState()
                : RefreshIndicator(
                    color: VlColors.red,
                    onRefresh: () => _load(force: true),
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                      children: [
                        Text('FEATURED COLLECTIONS', style: VlText.upper(9, letter: 0.22)),
                        const SizedBox(height: 12),
                        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Expanded(flex: 14, child: _featured(context, 'New Arrivals', 'JUST IN', 0, '/listing')),
                          const SizedBox(width: 10),
                          // "Bestsellers" had nothing behind it — the store
                          // flags featured pieces, so show those instead.
                          Expanded(flex: 10, child: _featured(context, 'Featured', 'HANDPICKED', 3, '/listing?featured=1')),
                        ]),
                        const DoubleRule(margin: EdgeInsets.symmetric(vertical: 16)),
                        Text('ALL WEAVES', style: VlText.upper(9, letter: 0.22)),
                        const SizedBox(height: 12),
                        if (_cats.isEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 30),
                            child: Center(child: Text('No weaves listed yet.', style: VlText.body(13, color: VlColors.muted))),
                          )
                        else
                          GridView.count(
                            crossAxisCount: 2,
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                            childAspectRatio: 0.72,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            children: _cats.map((c) => _weaveCard(context, c)).toList(),
                          ),
                      ],
                    ),
                  ),
      ),
    ]);
  }

  Widget _errorState() => ListView(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        children: [
          const SizedBox(height: 100),
          Icon(Icons.wifi_off_rounded, size: 40, color: VlColors.muted2),
          const SizedBox(height: 16),
          Text("Couldn't load the weaves", textAlign: TextAlign.center, style: VlText.display(22)),
          const SizedBox(height: 8),
          Text(_error!, textAlign: TextAlign.center, style: VlText.body(13, color: VlColors.muted)),
          const SizedBox(height: 20),
          Center(
            child: GestureDetector(
              onTap: _load,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 13),
                decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
                child: Text('RETRY', style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.12)),
              ),
            ),
          ),
        ],
      );

  Widget _featured(BuildContext context, String title, String sub, int palette, String route) => GestureDetector(
        onTap: () => context.push(route),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(VlRadii.md),
          child: AspectRatio(
            aspectRatio: 5 / 4,
            child: Stack(fit: StackFit.expand, children: [
              Silk(palette: palette, radius: 0),
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, VlColors.redInk.withValues(alpha: 0.7)],
                  ),
                ),
              ),
              Positioned(
                left: 12,
                bottom: 12,
                right: 8,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: VlText.display(17, color: Colors.white)),
                  Text(sub, style: VlText.upper(8, color: Colors.white70, letter: 0.2)),
                ]),
              ),
            ]),
          ),
        ),
      );

  Widget _weaveCard(BuildContext context, EcomCategory c) => GestureDetector(
        onTap: () => context.push('/listing?cat=${c.slug}'),
        child: Container(
          decoration: BoxDecoration(
            color: VlColors.paper,
            border: Border.all(color: VlColors.rule),
            borderRadius: BorderRadius.circular(VlRadii.md),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Fill whatever the grid tile leaves over the text block below,
            // so the card never ends in a band of empty paper.
            Expanded(
              child: NetImage(url: c.imageUrl, palette: paletteFor(c.slug), radius: 0),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(c.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: VlText.display(16)),
                const SizedBox(height: 2),
                Text('EXPLORE', style: VlText.upper(8, color: VlColors.muted, letter: 0.18)),
                const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: DashedRule()),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('View all', style: VlText.ui(12, weight: FontWeight.w600)),
                  Icon(Icons.arrow_forward, size: 12, color: VlColors.red),
                ]),
              ]),
            ),
          ]),
        ),
      );
}

/// Shop-by-weave placeholder: the two featured tiles plus the weave grid.
class _CategorySkeleton extends StatelessWidget {
  const _CategorySkeleton();
  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        physics: const NeverScrollableScrollPhysics(),
        children: [
          const Skeleton(width: 150, height: 9),
          const SizedBox(height: 12),
          Row(children: const [
            Expanded(flex: 14, child: AspectRatio(aspectRatio: 5 / 4, child: Skeleton(radius: VlRadii.md))),
            SizedBox(width: 10),
            Expanded(flex: 10, child: AspectRatio(aspectRatio: 5 / 4, child: Skeleton(radius: VlRadii.md))),
          ]),
          const DoubleRule(margin: EdgeInsets.symmetric(vertical: 16)),
          const Skeleton(width: 110, height: 9),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.72,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: List.generate(4, (_) => const Skeleton(radius: VlRadii.md)),
          ),
        ],
      );
}

// ── Wishlist (ecom /v1/wishlist, needs auth) ─────────────────────────────────
class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});
  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (EcomAuth.I.isLoggedIn) {
      _load();
    } else {
      _loading = false;
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await Wishlist.I.load();
      if (!mounted) return;
      setState(() => _loading = false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = ecomError(e, 'Could not load your wishlist.');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // The grid is the shared wishlist itself, so un-hearting a saree here (or
    // anywhere else in the app) removes it in place.
    return ValueListenableBuilder<List<WishlistEntry>>(
      valueListenable: Wishlist.I.entries,
      builder: (context, entries, _) => Column(children: [
        TopBar(title: entries.isEmpty ? 'Wishlist' : 'Wishlist · ${entries.length}', onBack: () => context.canPop() ? context.pop() : context.go('/home')),
        Expanded(child: _body(entries)),
      ]),
    );
  }

  Widget _body(List<WishlistEntry> entries) {
    if (!EcomAuth.I.isLoggedIn) {
      return _empty(context, 'Sign in to see your wishlist', 'Save sarees you love and find them here.', 'Sign in', () => context.push('/login'));
    }
    if (_loading && Wishlist.I.entries.value.isEmpty) return const ProductGridSkeleton(count: 4, padding: EdgeInsets.all(20));
    if (_error != null && entries.isEmpty) {
      return _empty(context, 'Couldn’t load your wishlist', _error!, 'Retry', _load);
    }
    if (entries.isEmpty) {
      return _empty(context, 'Your wishlist is empty', 'Tap the heart on a saree you love to save it for later.', 'Browse', () => context.go('/shop'));
    }
    return RefreshIndicator(
      color: VlColors.red,
      onRefresh: _load,
      child: LayoutBuilder(
        builder: (context, box) => GridView.builder(
        gridDelegate: productGridDelegate(context, box.maxWidth - 40),
        padding: const EdgeInsets.all(20),
        itemCount: entries.length,
        itemBuilder: (context, i) {
          final e = entries[i];
          final p = productFromEcom(e.product, variantId: e.variantId);
          return ProductCard(
            key: ValueKey(e.variantId),
            p: p,
            fav: true,
            onFav: () => toggleWishlist(context, p),
            onTap: () => context.push('/product/${p.id}'),
          );
        },
        ),
      ),
    );
  }

  Widget _empty(BuildContext context, String title, String body, String cta, VoidCallback onCta) => Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.favorite_border, size: 40, color: VlColors.red),
          const SizedBox(height: 14),
          Text(title, style: VlText.display(22)),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(body, textAlign: TextAlign.center, style: VlText.body(13, color: VlColors.muted)),
          ),
          const SizedBox(height: 16),
          TextButton(onPressed: onCta, child: Text(cta, style: VlText.ui(13, color: VlColors.red))),
        ]),
      );
}
