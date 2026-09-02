import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../ecom/ecom_adapter.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_cart.dart';
import '../ecom/ecom_models.dart';
import '../ecom/ecom_wishlist.dart';
import '../theme.dart';
import '../widgets.dart';

String _stripHtml(String? s) => (s ?? '')
    .replaceAll(RegExp(r'<[^>]*>'), ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll(RegExp(r'\s+'), ' ')
    .trim();

Color? _hex(String? h) {
  if (h == null || h.isEmpty) return null;
  var s = h.replaceAll('#', '').trim();
  if (s.length == 6) s = 'FF$s';
  final v = int.tryParse(s, radix: 16);
  return v == null ? null : Color(v);
}

/// Real product detail, bound to vkcgold_ecom `/v1/products/:slug`.
class ProductScreen extends StatefulWidget {
  final String id; // slug
  const ProductScreen({super.key, required this.id});
  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  EcomProduct? _p;
  List<EcomProduct> _related = const [];
  bool _loading = true;
  String? _error;

  int _variant = 0;
  int _img = 0;
  String _tab = 'Details';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final (product, related) = await EcomApi.I.productBySlug(widget.id);
      if (!mounted) return;
      setState(() {
        _p = product;
        _related = related;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not load this product.';
        _loading = false;
      });
    }
  }

  /// The chosen colour. Clamped, so a reload that returns fewer variants than
  /// the one the customer had selected can't index out of range.
  ProductVariant get _sel {
    final vs = _p!.variants;
    if (vs.isEmpty) return _p!.primaryVariant;
    return vs[_variant.clamp(0, vs.length - 1)];
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(backgroundColor: VlColors.canvas, body: const DetailSkeleton(heroHeight: 440));
    }
    if (_error != null || _p == null) {
      return Scaffold(
        backgroundColor: VlColors.canvas,
        body: SafeArea(
          child: Column(children: [
            TopBar(title: 'Product', onBack: () => context.pop()),
            Expanded(
              child: Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Text(_error ?? 'Not found', style: VlText.body(13, color: VlColors.muted)),
                  const SizedBox(height: 12),
                  TextButton(onPressed: _load, child: Text('Retry', style: VlText.ui(13, color: VlColors.red))),
                ]),
              ),
            ),
          ]),
        ),
      );
    }

    final p = _p!;
    final v = _sel;
    final images = v.images;
    return Scaffold(
      backgroundColor: VlColors.canvas,
      // Lifted clear of this screen's sticky ADD TO CART / BUY NOW bar.
      floatingActionButton: const VideoCallFab(liftAbove: 78),
      body: Stack(children: [
        ListView(
          padding: const EdgeInsets.only(bottom: 92),
          children: [
            // hero gallery
            SizedBox(
              height: 440,
              child: Stack(children: [
                Positioned.fill(
                  child: images.isEmpty
                      ? Silk(palette: 0, radius: 0)
                      : PageView.builder(
                          itemCount: images.length,
                          onPageChanged: (i) => setState(() => _img = i),
                          itemBuilder: (_, i) => NetImage(url: images[i].url, radius: 0),
                        ),
                ),
                Positioned(
                  right: 16,
                  bottom: 20,
                  child: GestureDetector(
                    onTap: _toggleWishlist,
                    child: Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(color: VlColors.paper, shape: BoxShape.circle),
                      // Reads the shared wishlist, so the heart matches the
                      // cards the customer just came from.
                      child: ValueListenableBuilder<Set<String>>(
                        valueListenable: Wishlist.I.variantIds,
                        builder: (context, ids, _) {
                          final on = ids.contains(_sel.id);
                          return Icon(on ? Icons.favorite : Icons.favorite_border, size: 18, color: on ? VlColors.red : VlColors.ink);
                        },
                      ),
                    ),
                  ),
                ),
                if (images.length > 1)
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 20,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(images.length, (i) {
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          width: i == _img ? 22 : 6,
                          height: 6,
                          decoration: BoxDecoration(color: i == _img ? Colors.white : Colors.white54, borderRadius: BorderRadius.circular(3)),
                        );
                      }),
                    ),
                  ),
              ]),
            ),
            // title
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text([p.category?.name, v.sareeCode].whereType<String>().where((s) => s.isNotEmpty).join(' · ').toUpperCase(),
                    style: VlText.upper(9, color: VlColors.muted, letter: 0.22)),
                const SizedBox(height: 8),
                Text(p.name, style: VlText.display(26)),
                const SizedBox(height: 12),
                Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                  PriceRow(value: v.salePrice.toDouble(), mrp: v.hasDiscount ? v.originalPrice.toDouble() : null, size: 26),
                  if (v.hasDiscount) ...[
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: VlColors.redSoft, borderRadius: BorderRadius.circular(4)),
                      child: Text('${v.discountPercent}% OFF', style: VlText.ui(11, weight: FontWeight.w600, color: VlColors.red)),
                    ),
                  ],
                ]),
                const SizedBox(height: 6),
                Text(v.availableQty > 0 ? 'IN STOCK · INCL. ALL TAXES' : 'OUT OF STOCK',
                    style: VlText.upper(9, color: v.availableQty > 0 ? VlColors.green : VlColors.red, letter: 0.18)),
              ]),
            ),
            const DoubleRule(margin: EdgeInsets.fromLTRB(20, 0, 20, 14)),
            if (p.variants.length > 1) _variants(p),
            _tabs(p, v),
            if (_related.isNotEmpty) ...[
              SectionHead(kicker: const Text('PAIRS WELL WITH'), title: 'You might also love'),
              SizedBox(
                height: 300,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                  itemCount: _related.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (_, i) => SizedBox(
                    width: 150,
                    child: ProductCard(
                      p: productFromEcom(_related[i]),
                      onTap: () => context.push('/product/${_related[i].slug}'),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
        // floating top bar
        Positioned(
          top: MediaQuery.of(context).padding.top + 8,
          left: 16,
          right: 16,
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            _floatBtn(Icons.arrow_back, () => context.pop()),
            Row(children: [
              _floatBtn(Icons.ios_share_rounded, _share),
              const SizedBox(width: 10),
              _cartBtn(),
            ]),
          ]),
        ),
        // sticky CTA
        Positioned(left: 0, right: 0, bottom: 0, child: _cta(p, v)),
      ]),
    );
  }

  Widget _variants(EcomProduct p) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text.rich(TextSpan(style: VlText.upper(9, color: VlColors.muted, letter: 0.22), children: [
            const TextSpan(text: 'COLOUR · '),
            TextSpan(text: _sel.colorName.toUpperCase(), style: VlText.upper(9, color: VlColors.ink, letter: 0.22)),
          ])),
          const SizedBox(height: 10),
          Wrap(spacing: 10, runSpacing: 10, children: List.generate(p.variants.length, (i) {
            final vr = p.variants[i];
            final on = i == _variant;
            final c = _hex(vr.colorHex);
            // A sold-out colour is still selectable (so its photos can be
            // seen) but says so, instead of silently disabling BUY NOW.
            final out = vr.availableQty <= 0;
            return GestureDetector(
              onTap: () => setState(() {
                _variant = i;
                _img = 0;
              }),
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: on ? VlColors.ink : VlColors.rule2, width: on ? 2 : 1),
                ),
                child: Stack(alignment: Alignment.center, children: [
                  Opacity(
                    opacity: out ? 0.4 : 1,
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: c ?? VlColors.cream,
                        image: (c == null && vr.images.isNotEmpty)
                            ? DecorationImage(image: NetworkImage(vr.images.first.url), fit: BoxFit.cover)
                            : null,
                      ),
                    ),
                  ),
                  if (out)
                    Transform.rotate(
                      angle: -0.7,
                      child: Container(width: 34, height: 1.5, color: VlColors.ink.withValues(alpha: 0.6)),
                    ),
                ]),
              ),
            );
          })),
          if (_sel.availableQty <= 0 && p.variants.length > 1) ...[
            const SizedBox(height: 8),
            Text('${_sel.colorName.toUpperCase()} IS SOLD OUT — TRY ANOTHER COLOUR',
                style: VlText.upper(9, color: VlColors.red, letter: 0.16)),
          ],
        ]),
      );

  Widget _tabs(EcomProduct p, ProductVariant v) {
    final tabs = ['Details', 'Weave'];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: VlColors.rule))),
        child: Row(children: [
          for (final t in tabs)
            GestureDetector(
              onTap: () => setState(() => _tab = t),
              child: Container(
                margin: const EdgeInsets.only(right: 22),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(border: Border(bottom: BorderSide(color: _tab == t ? VlColors.red : Colors.transparent, width: 2))),
                child: Text(t, style: VlText.ui(13, weight: _tab == t ? FontWeight.w600 : FontWeight.w400, color: _tab == t ? VlColors.ink : VlColors.muted)),
              ),
            ),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 14),
        child: _tab == 'Weave' ? _specs(p, v) : _details(p),
      ),
    ]);
  }

  Widget _details(EcomProduct p) {
    final body = _stripHtml(p.description).isNotEmpty ? _stripHtml(p.description) : _stripHtml(p.shortDesc);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(body.isEmpty ? 'Pure, chemical-free cane jaggery from VKC Gold.' : body,
          style: VlText.body(13, color: VlColors.muted, height: 1.6)),
      if (p.occasions.isNotEmpty) ...[
        const SizedBox(height: 12),
        Wrap(spacing: 8, runSpacing: 8, children: p.occasions
            .map((o) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(color: VlColors.cream, borderRadius: BorderRadius.circular(999)),
                  child: Text(o, style: VlText.ui(11, color: VlColors.redDeep)),
                ))
            .toList()),
      ],
    ]);
  }

  Widget _specs(EcomProduct p, ProductVariant v) {
    final specs = <(String, String?)>[
      ('Fabric', p.fabric),
      ('Weave', p.weaveType),
      ('Region', p.regionOfOrigin),
      ('Colour', v.colorName),
      ('Product code', v.sareeCode),
      ('Care', p.careInstructions),
    ].where((s) => s.$2 != null && s.$2!.isNotEmpty).toList();
    if (specs.isEmpty) {
      return Text('Details coming soon.', style: VlText.body(13, color: VlColors.muted));
    }
    return Column(
      children: specs
          .map((s) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  SizedBox(width: 110, child: Text(s.$1.toUpperCase(), style: VlText.upper(9, color: VlColors.muted2, letter: 0.18))),
                  Expanded(child: Text(s.$2!, style: VlText.ui(13))),
                ]),
              ))
          .toList(),
    );
  }

  Widget _floatBtn(IconData ic, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(color: VlColors.paper.withValues(alpha: 0.92), shape: BoxShape.circle),
          child: Icon(ic, size: 16, color: VlColors.ink),
        ),
      );

  Widget _cartBtn() => ValueListenableBuilder(
        valueListenable: EcomCart.I.items,
        builder: (context, _, __) => GestureDetector(
          // go, not push: /cart lives inside the ShellRoute, and pushing a
          // second copy of that shell collides with the existing page key.
          onTap: () => context.go('/cart'),
          child: Stack(clipBehavior: Clip.none, children: [
            _floatBtn(Icons.shopping_bag_outlined, () => context.go('/cart')),
            if (EcomCart.I.count > 0)
              Positioned(
                top: -4,
                right: -4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  decoration: BoxDecoration(color: VlColors.red, shape: BoxShape.circle),
                  child: Text('${EcomCart.I.count}', style: VlText.ui(9, weight: FontWeight.w600, color: Colors.white)),
                ),
              ),
          ]),
        ),
      );

  Widget _cta(EcomProduct p, ProductVariant v) {
    final canBuy = v.availableQty > 0;
    return Container(
      decoration: BoxDecoration(color: VlColors.paper, border: Border(top: BorderSide(color: VlColors.rule))),
      padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + MediaQuery.of(context).padding.bottom),
      child: Row(children: [
        // flex 3:5 — BUY NOW stays dominant, but the icon + "ADD TO CART"
        // label still needs ~104dp or the row overflows.
        Expanded(
          flex: 3,
          child: GestureDetector(
            onTap: canBuy ? () => _addToCart(p, v, toast: true) : null,
            child: Opacity(
              opacity: canBuy ? 1 : 0.5,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                alignment: Alignment.center,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(VlRadii.md), border: Border.all(color: VlColors.rule2)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.shopping_bag_outlined, size: 15, color: VlColors.ink),
                  const SizedBox(width: 6),
                  Text('ADD TO CART', style: VlText.ui(12, weight: FontWeight.w600, letter: 0.1)),
                ]),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          flex: 5,
          child: GestureDetector(
            onTap: canBuy
                ? () {
                    _addToCart(p, v);
                    context.go('/cart');
                  }
                : null,
            child: Opacity(
              opacity: canBuy ? 1 : 0.5,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                alignment: Alignment.center,
                decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
                child: Text(canBuy ? 'BUY NOW' : 'SOLD OUT', style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
              ),
            ),
          ),
        ),
      ]),
    );
  }

  void _addToCart(EcomProduct p, ProductVariant v, {bool toast = false}) {
    EcomCart.I.add(CartItem.of(p, v));
    if (toast && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${p.name} added to cart'), duration: const Duration(seconds: 1)));
    }
  }

  /// Shares the product's own page on the store site — the same URL the website
  /// serves at `/shop/<slug>`, so whoever receives it lands on the real
  /// product rather than the app's internal route.
  Future<void> _share() async {
    final p = _p;
    if (p == null) return;
    final slug = p.slug.isNotEmpty ? p.slug : widget.id;
    final url = '${EcomApi.host}/shop/$slug';
    final v = _sel;
    final price = v.salePrice.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');
    final box = context.findRenderObject() as RenderBox?;
    await SharePlus.instance.share(
      ShareParams(
        text: '${p.name} — ₹$price\n$url',
        subject: p.name,
        // iPad needs an anchor for the share sheet; harmless elsewhere.
        sharePositionOrigin: box == null ? null : box.localToGlobal(Offset.zero) & box.size,
      ),
    );
  }

  Future<void> _toggleWishlist() async {
    if (!EcomAuth.I.isLoggedIn) {
      context.push('/login');
      return;
    }
    try {
      await Wishlist.I.toggle(_sel.id, product: _p);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ecomError(e, 'Could not update wishlist'))));
      }
    }
  }
}
