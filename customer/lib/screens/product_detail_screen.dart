import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';

import '../ecom/ecom_adapter.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_cart.dart';
import '../ecom/ecom_models.dart';
import '../ecom/ecom_wishlist.dart';
import '../theme.dart';
import '../widgets.dart';

/// Product detail, bound to `/v1/products/:slug` (+ its reviews).
class ProductScreen extends StatefulWidget {
  final String id; // slug
  const ProductScreen({super.key, required this.id});
  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  EcomProduct? _p;
  List<EcomProduct> _related = const [];
  ReviewPage? _reviews;
  bool _loading = true;
  Object? _error;

  int _variant = 0;
  int _img = 0;
  int _qty = 1;
  bool _expanded = false;
  bool _justAdded = false;
  final _pager = PageController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _pager.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final (product, related) = await EcomApi.I.productBySlug(widget.id);
      if (!mounted) return;
      // Land on the first variant that is actually buyable.
      final firstInStock = product.variants.indexWhere((v) => v.availableQty > 0);
      setState(() {
        _p = product;
        _related = related;
        _variant = firstInStock < 0 ? 0 : firstInStock;
        _qty = 1;
        _loading = false;
      });
      _loadReviews(product.slug.isNotEmpty ? product.slug : widget.id);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  Future<void> _loadReviews(String slug) async {
    try {
      final r = await EcomApi.I.reviews(slug, limit: 3);
      if (mounted) setState(() => _reviews = r);
    } catch (_) {
      // Reviews are a bonus; the page is complete without them.
    }
  }

  /// The chosen variant, clamped so a reload with fewer variants can't index
  /// out of range.
  ProductVariant get _sel {
    final vs = _p!.variants;
    if (vs.isEmpty) return _p!.primaryVariant;
    return vs[_variant.clamp(0, vs.length - 1)];
  }

  List<String> get _images {
    final own = _sel.images.map((i) => i.url).toList();
    return own.isNotEmpty ? own : _p!.allImages;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(backgroundColor: VkColors.canvas, body: DetailSkeleton(heroHeight: 380));
    }
    final p = _p;
    if (_error != null || p == null) {
      return Scaffold(
        backgroundColor: VkColors.canvas,
        body: SafeArea(
          child: Column(children: [
            TopBar(title: 'Product', onBack: () => context.canPop() ? context.pop() : context.go('/shop')),
            Expanded(child: StateView.error(_error, onRetry: _load, title: "Couldn't load this product")),
          ]),
        ),
      );
    }

    final v = _sel;
    final images = _images;
    final canBuy = v.availableQty > 0;
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    return Scaffold(
      backgroundColor: VkColors.canvas,
      body: Stack(children: [
        ListView(
          padding: EdgeInsets.only(bottom: 96 + bottomInset),
          children: [
            _gallery(images),
            _titleBlock(p, v),
            if (_showVariants(p)) _variants(p),
            _quantity(v),
            const DoubleRule(margin: EdgeInsets.fromLTRB(20, 20, 20, 0)),
            _description(p),
            _details(p, v),
            if ((_reviews?.total ?? 0) > 0) _reviewsBlock(_reviews!),
            if (_related.isNotEmpty) ...[
              const SectionHead(kicker: 'Pairs well with', title: 'You might also like'),
              _relatedRow(),
            ],
            const SizedBox(height: 12),
          ],
        ),
        Positioned(
          top: MediaQuery.paddingOf(context).top + 8,
          left: 12,
          right: 12,
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            TopBar.action(Icons.arrow_back_rounded, () => context.canPop() ? context.pop() : context.go('/shop'), tooltip: 'Back'),
            Row(children: [
              TopBar.action(Icons.ios_share_rounded, _share, tooltip: 'Share'),
              ValueListenableBuilder<Set<String>>(
                valueListenable: Wishlist.I.variantIds,
                builder: (_, ids, __) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: WishHeart(on: ids.contains(v.id), onTap: _toggleWishlist, size: 40, onImage: false),
                ),
              ),
              InkResponse(
                onTap: () => context.go('/cart'),
                radius: 24,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(color: VkColors.paper, shape: BoxShape.circle, border: Border.all(color: VkColors.rule)),
                  child: const Center(child: CartIconBadge(size: 19)),
                ),
              ),
            ]),
          ]),
        ),
        Positioned(left: 0, right: 0, bottom: 0, child: _cta(p, v, canBuy)),
      ]),
    );
  }

  // ── Gallery ───────────────────────────────────────────────────────────────
  Widget _gallery(List<String> images) {
    final width = MediaQuery.sizeOf(context).width;
    return SizedBox(
      height: width,
      child: Stack(children: [
        Positioned.fill(
          child: ColoredBox(
            color: VkColors.paper,
            child: images.isEmpty
                ? const PlaceholderTile(radius: 0)
                : PageView.builder(
                    controller: _pager,
                    itemCount: images.length,
                    onPageChanged: (i) => setState(() => _img = i),
                    itemBuilder: (_, i) => Hero(
                      tag: i == 0 ? 'product-${_p!.slug}' : 'product-${_p!.slug}-$i',
                      child: NetImage(url: images[i], radius: 0, fit: BoxFit.cover),
                    ),
                  ),
          ),
        ),
        if (images.length > 1)
          Positioned(
            left: 0,
            right: 0,
            bottom: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(images.length, (i) {
                return AnimatedContainer(
                  duration: VkMotion.base,
                  curve: VkMotion.curve,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == _img ? 20 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: i == _img ? VkColors.primary : VkColors.ink.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(3),
                  ),
                );
              }),
            ),
          ),
      ]),
    );
  }

  // ── Title / price / stock ────────────────────────────────────────────────
  Widget _titleBlock(EcomProduct p, ProductVariant v) {
    final reviews = _reviews;
    final left = v.availableQty;
    final String stockText;
    final Color stockColor;
    if (left <= 0) {
      stockText = 'Out of stock';
      stockColor = VkColors.error;
    } else if (left <= 5) {
      stockText = 'Only $left left';
      stockColor = VkColors.warning;
    } else {
      stockText = 'In stock';
      stockColor = VkColors.leaf;
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          if ((p.category?.name ?? '').isNotEmpty)
            Flexible(
              child: GestureDetector(
                onTap: () => context.push('/listing?cat=${p.category!.slug}&title=${Uri.encodeComponent(p.category!.name)}'),
                child: Text(p.category!.name.toUpperCase(),
                    maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.upper(9, color: VkColors.primary, letter: 0.18)),
              ),
            ),
          if (p.isNew) ...[const SizedBox(width: 8), const VkBadge('New', color: VkColors.leaf)],
        ]),
        const SizedBox(height: 8),
        Text(p.name, style: VkText.display(27, height: 1.1)),
        if (reviews != null && reviews.total > 0) ...[
          const SizedBox(height: 8),
          Row(children: [
            RatingStars(rating: reviews.average, size: 15),
            const SizedBox(width: 6),
            Text('${reviews.average.toStringAsFixed(1)} · ${reviews.total} review${reviews.total == 1 ? '' : 's'}',
                style: VkText.body(12, color: VkColors.muted)),
          ]),
        ],
        const SizedBox(height: 12),
        Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
          PriceRow(value: v.salePrice.toDouble(), mrp: v.hasDiscount ? v.originalPrice.toDouble() : null, size: 26),
          if (v.hasDiscount) ...[
            const SizedBox(width: 10),
            VkBadge('${v.discountPercent}% OFF', color: VkBrand.sale),
          ],
        ]),
        const SizedBox(height: 8),
        Row(children: [
          Container(width: 7, height: 7, decoration: BoxDecoration(color: stockColor, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text(stockText, style: VkText.ui(11.5, weight: FontWeight.w600, color: stockColor)),
          const SizedBox(width: 8),
          Text('· Inclusive of all taxes', style: VkText.body(11.5, color: VkColors.muted2)),
        ]),
      ]),
    );
  }

  // ── Variants ─────────────────────────────────────────────────────────────
  bool _showVariants(EcomProduct p) => p.variants.length > 1 && p.variants.any((v) => v.label.isNotEmpty);

  Widget _variants(EcomProduct p) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('CHOOSE AN OPTION', style: VkText.upper(9, color: VkColors.muted, letter: 0.18)),
          const SizedBox(height: 10),
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (var i = 0; i < p.variants.length; i++) _variantChip(p.variants[i], i),
          ]),
        ]),
      );

  Widget _variantChip(ProductVariant vr, int i) {
    final on = i == _variant;
    final out = vr.availableQty <= 0;
    final label = vr.label.isNotEmpty ? vr.label : 'Option ${i + 1}';
    return Material(
      color: on ? VkColors.ink : VkColors.paper,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(VkRadii.sm),
        side: BorderSide(color: on ? VkColors.ink : VkColors.rule2),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => setState(() {
          _variant = i;
          _img = 0;
          _qty = 1;
          if (_pager.hasClients) _pager.jumpToPage(0);
        }),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Text(label,
                style: VkText.ui(12.5, weight: FontWeight.w600, color: on ? Colors.white : VkColors.ink)
                    .copyWith(decoration: out ? TextDecoration.lineThrough : null)),
            Text(
              out ? 'Sold out' : '₹${inr(vr.salePrice)}',
              style: VkText.body(11, color: on ? Colors.white70 : (out ? VkColors.error : VkColors.muted)),
            ),
          ]),
        ),
      ),
    );
  }

  // ── Quantity ─────────────────────────────────────────────────────────────
  Widget _quantity(ProductVariant v) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
        child: Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('QUANTITY', style: VkText.upper(9, color: VkColors.muted, letter: 0.18)),
              if (v.availableQty > 0 && v.availableQty < 10) ...[
                const SizedBox(height: 2),
                Text('Up to ${v.availableQty} available', style: VkText.body(11, color: VkColors.muted2)),
              ],
            ]),
          ),
          QtyStepper(
            value: _qty,
            max: v.availableQty > 0 ? v.availableQty : 1,
            onChanged: (n) => setState(() => _qty = n),
          ),
        ]),
      );

  // ── Description + details ────────────────────────────────────────────────
  Widget _description(EcomProduct p) {
    final full = stripHtml(p.description);
    final body = full.isNotEmpty ? full : stripHtml(p.shortDesc);
    if (body.isEmpty) return const SizedBox.shrink();
    final long = body.length > 260 || body.split('\n').length > 5;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('About this product', style: VkText.display(20)),
        const SizedBox(height: 8),
        AnimatedSize(
          duration: VkMotion.slow,
          curve: VkMotion.curve,
          alignment: Alignment.topCenter,
          child: Text(
            body,
            maxLines: _expanded || !long ? null : 5,
            overflow: _expanded || !long ? TextOverflow.visible : TextOverflow.ellipsis,
            style: VkText.body(13.5, color: VkColors.ink2, height: 1.65),
          ),
        ),
        if (long)
          TextButton(
            onPressed: () => setState(() => _expanded = !_expanded),
            style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(44, 36), alignment: Alignment.centerLeft),
            child: Text(_expanded ? 'Read less' : 'Read more', style: VkText.ui(12.5, weight: FontWeight.w600, color: VkColors.primary)),
          ),
      ]),
    );
  }

  Widget _details(EcomProduct p, ProductVariant v) {
    final specs = <(String, String?)>[
      ('Category', p.category?.name),
      ('Product code', v.sareeCode),
      ('Origin', p.regionOfOrigin),
      ('Storage & care', p.careInstructions),
    ].where((s) => (s.$2 ?? '').trim().isNotEmpty).toList();
    final tags = [...p.tags, ...p.occasions].where((t) => t.trim().isNotEmpty).toList();
    if (specs.isEmpty && tags.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: VkColors.paper, borderRadius: BorderRadius.circular(VkRadii.md), border: Border.all(color: VkColors.rule)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('DETAILS', style: VkText.upper(9, color: VkColors.muted, letter: 0.18)),
          const SizedBox(height: 10),
          for (final s in specs)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                SizedBox(width: 110, child: Text(s.$1, style: VkText.body(12, color: VkColors.muted))),
                Expanded(child: Text(s.$2!.trim(), style: VkText.ui(12.5, weight: FontWeight.w500, height: 1.4))),
              ]),
            ),
          if (tags.isNotEmpty)
            Wrap(spacing: 6, runSpacing: 6, children: [
              for (final t in tags)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                  decoration: BoxDecoration(color: VkColors.cream, borderRadius: BorderRadius.circular(999)),
                  child: Text(t, style: VkText.ui(10.5, color: VkColors.primaryDeep)),
                ),
            ]),
        ]),
      ),
    );
  }

  // ── Reviews ──────────────────────────────────────────────────────────────
  Widget _reviewsBlock(ReviewPage r) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Expanded(child: Text('Customer reviews', style: VkText.display(20))),
            Text(r.average.toStringAsFixed(1), style: VkText.display(26, color: VkColors.primary)),
            const SizedBox(width: 6),
            Padding(padding: const EdgeInsets.only(bottom: 5), child: RatingStars(rating: r.average, size: 14)),
          ]),
          const SizedBox(height: 10),
          for (final rv in r.reviews)
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: VkColors.paper, borderRadius: BorderRadius.circular(VkRadii.md), border: Border.all(color: VkColors.rule)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  RatingStars(rating: rv.rating.toDouble(), size: 13),
                  const SizedBox(width: 8),
                  Expanded(child: Text(rv.author, maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.ui(12, weight: FontWeight.w600))),
                  if (rv.createdAt != null)
                    Text(DateFormat('d MMM yyyy').format(rv.createdAt!.toLocal()), style: VkText.mono(10, color: VkColors.muted2)),
                ]),
                if ((rv.title ?? '').trim().isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(rv.title!.trim(), style: VkText.ui(13, weight: FontWeight.w600)),
                ],
                if ((rv.body ?? '').trim().isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(rv.body!.trim(), style: VkText.body(12.5, color: VkColors.ink2, height: 1.5)),
                ],
              ]),
            ),
        ]),
      );

  Widget _relatedRow() => SizedBox(
        height: 160 + productCardTextHeight(context),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: _related.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (_, i) {
            final rp = productFromEcom(_related[i]);
            return SizedBox(
              width: 160,
              child: ProductCard(
                key: ValueKey(rp.variantId ?? rp.id),
                p: rp,
                onFav: () => toggleWishlist(context, rp),
                onAdd: () => quickAddToCart(context, rp),
                onTap: () => context.push('/product/${rp.id}'),
              ),
            );
          },
        ),
      );

  // ── Sticky CTA ───────────────────────────────────────────────────────────
  Widget _cta(EcomProduct p, ProductVariant v, bool canBuy) => Container(
        decoration: BoxDecoration(
          color: VkColors.paper,
          border: const Border(top: BorderSide(color: VkColors.rule)),
          boxShadow: [BoxShadow(color: VkColors.ink.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, -4))],
        ),
        padding: EdgeInsets.fromLTRB(16, 12, 16, 12 + MediaQuery.paddingOf(context).bottom),
        child: Row(children: [
          Expanded(
            flex: 5,
            child: OutlineButton(
              label: _justAdded ? 'Added' : 'Add to cart',
              icon: _justAdded ? Icons.check_rounded : Icons.add_shopping_cart_rounded,
              color: _justAdded ? VkColors.leaf : VkColors.ink,
              onTap: canBuy ? () => _addToCart(p, v, toastIt: true) : null,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 6,
            child: PrimaryButton(
              label: canBuy ? 'Buy now' : 'Sold out',
              onTap: canBuy
                  ? () {
                      _addToCart(p, v);
                      context.go('/cart');
                    }
                  : null,
            ),
          ),
        ]),
      );

  void _addToCart(EcomProduct p, ProductVariant v, {bool toastIt = false}) {
    final ok = EcomCart.I.add(CartItem.of(p, v, quantity: _qty));
    if (!mounted) return;
    if (!ok) {
      toast(context, 'Only ${v.availableQty} left in stock');
      return;
    }
    if (toastIt) {
      setState(() => _justAdded = true);
      Future<void>.delayed(const Duration(milliseconds: 1400), () {
        if (mounted) setState(() => _justAdded = false);
      });
      final router = GoRouter.of(context);
      toast(context, '${p.name} added to cart', action: 'VIEW CART', onAction: () => router.go('/cart'));
    }
  }

  /// Shares the product's own page on the store site — the same URL the
  /// website serves at `/shop/<slug>`.
  Future<void> _share() async {
    final p = _p;
    if (p == null) return;
    final slug = p.slug.isNotEmpty ? p.slug : widget.id;
    final url = '${EcomApi.host}/shop/$slug';
    final box = context.findRenderObject() as RenderBox?;
    await SharePlus.instance.share(
      ShareParams(
        text: '${p.name} — ₹${inr(_sel.salePrice)}\n$url',
        subject: p.name,
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
      final on = await Wishlist.I.toggle(_sel.id, product: _p);
      if (mounted && on) {
        final router = GoRouter.of(context);
        toast(context, 'Saved to wishlist', action: 'VIEW', onAction: () => router.push('/wishlist'));
      }
    } catch (e) {
      if (mounted) toast(context, ecomError(e, 'Could not update wishlist'));
    }
  }
}
