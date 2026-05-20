import "package:carousel_slider/carousel_slider.dart";
import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:smooth_page_indicator/smooth_page_indicator.dart";

import "../../../core/errors/failures.dart";
import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/utils/formatters.dart";
import "../../../core/widgets/app_image.dart";
import "../../../core/widgets/state_widgets.dart";
import "../../auth/data/auth_controller.dart";
import "../../cart/data/cart_controller.dart";
import "../../cart/data/cart_models.dart";
import "../../shop/data/product_models.dart";
import "../../shop/data/product_repository.dart";
import "../../shop/presentation/product_card.dart";
import "../../wishlist/data/wishlist_repository.dart";

class ProductDetailScreen extends ConsumerWidget {
  const ProductDetailScreen({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(productDetailProvider(slug));

    return Scaffold(
      appBar: AppBar(
        actions: [
          detail.maybeWhen(
            data: (data) => _WishlistAction(productVariantIds: data.product.variants.map((v) => v.id).toList()),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: detail.when(
        loading: () => const AppLoading(),
        error: (e, _) {
          final f = e is Failure ? e : UnknownFailure(e.toString());
          return AppErrorView(failure: f, onRetry: () => ref.invalidate(productDetailProvider(slug)));
        },
        data: (data) => _DetailBody(product: data.product, related: data.related),
      ),
    );
  }
}

class _WishlistAction extends ConsumerWidget {
  const _WishlistAction({required this.productVariantIds});
  final List<String> productVariantIds;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (productVariantIds.isEmpty) return const SizedBox.shrink();
    final inList = ref.watch(wishlistVariantIdsProvider);
    final firstVariantId = productVariantIds.first;
    final isWishlisted = inList.contains(firstVariantId);

    return IconButton(
      tooltip: isWishlisted ? "Remove from wishlist" : "Add to wishlist",
      onPressed: () async {
        final auth = ref.read(authControllerProvider);
        if (!auth.isLoggedIn) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Log in to use the wishlist"), behavior: SnackBarBehavior.floating),
          );
          return;
        }
        try {
          final nowWishlisted = await ref.read(toggleWishlistProvider).call(
            variantId: firstVariantId, isWishlisted: isWishlisted,
          );
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(nowWishlisted ? "Added to wishlist" : "Removed from wishlist"),
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 2),
            ));
          }
        } on Failure catch (e) {
          if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
        }
      },
      icon: Icon(isWishlisted ? Icons.favorite : Icons.favorite_border,
          color: isWishlisted ? Theme.of(context).colorScheme.primary : null),
    );
  }
}

class _DetailBody extends ConsumerStatefulWidget {
  const _DetailBody({required this.product, required this.related});
  final Product product;
  final List<Product> related;

  @override
  ConsumerState<_DetailBody> createState() => _DetailBodyState();
}

class _DetailBodyState extends ConsumerState<_DetailBody> {
  late ProductVariant _variant;
  int _qty = 1;
  int _imageIndex = 0;
  String? _expandedSection = "details";

  @override
  void initState() {
    super.initState();
    _variant = widget.product.primaryVariant;
  }

  void _selectVariant(ProductVariant v) {
    setState(() {
      _variant = v;
      _qty = 1;
      _imageIndex = 0;
    });
  }

  Future<void> _addToCart() async {
    final v = _variant;
    final image = v.images.isNotEmpty ? v.images.first.url : null;
    await ref.read(cartControllerProvider.notifier).add(CartItem(
      productId:    widget.product.id,
      variantId:    v.id,
      productName:  widget.product.name,
      variantColor: v.colorName,
      sareeCode:    v.sareeCode,
      quantity:     _qty,
      salePrice:    v.salePrice,
      originalPrice: v.originalPrice,
      stockQty:     v.stockQty,
      imageUrl:     image,
    ));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text("Added to cart"),
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(label: "View cart", onPressed: () => context.go(RoutePaths.cart)),
      ),
    );
  }

  void _buyNow() {
    _addToCart();
    context.go(RoutePaths.checkout);
  }

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final colors = context.appColors;
    final p = widget.product;
    final v = _variant;
    final available = v.availableQty;
    final outOfStock = available <= 0;

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              // Image carousel
              _ImageCarousel(
                images: v.images,
                fallbackName: p.name,
                onPageChanged: (i) => setState(() => _imageIndex = i),
                index: _imageIndex,
              ),

              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (p.fabric != null || p.weaveType != null)
                      Wrap(
                        spacing: 8, runSpacing: 4,
                        children: [
                          if (p.fabric    != null) _Tag(p.fabric!),
                          if (p.weaveType != null) _Tag(p.weaveType!),
                        ],
                      ),
                    const SizedBox(height: 12),
                    Text(p.name, style: theme.textTheme.headlineSmall),
                    if (p.shortDesc != null && p.shortDesc!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(p.shortDesc!.replaceAll(RegExp(r"<[^>]*>"), ""),
                          style: theme.textTheme.bodyMedium?.copyWith(color: colors.textMuted)),
                    ],

                    const SizedBox(height: 16),
                    Divider(color: colors.parchment, height: 1),
                    const SizedBox(height: 16),

                    // Price
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(formatINR(v.salePrice),
                            style: theme.textTheme.headlineMedium?.copyWith(
                              color: theme.colorScheme.primary,
                              fontStyle: FontStyle.italic,
                              fontWeight: FontWeight.w600,
                            )),
                        if (v.hasDiscount) ...[
                          const SizedBox(width: 10),
                          Text(formatINR(v.originalPrice),
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: colors.textMuted,
                                decoration: TextDecoration.lineThrough,
                              )),
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: colors.success.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text("${v.discountPercent}% OFF",
                                style: theme.textTheme.labelSmall?.copyWith(
                                    color: colors.success, fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text("Inclusive of all taxes",
                        style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),

                    // Variants (colors)
                    if (p.variants.length > 1) ...[
                      const SizedBox(height: 20),
                      Text("Colour: ${v.colorName}", style: theme.textTheme.titleSmall),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 10, runSpacing: 10,
                        children: p.variants.map((vv) {
                          final selected = vv.id == v.id;
                          final hex = _parseHex(vv.colorHex);
                          return GestureDetector(
                            onTap: () => _selectVariant(vv),
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: selected ? theme.colorScheme.primary : colors.parchment,
                                  width: selected ? 2 : 1,
                                ),
                              ),
                              child: Container(
                                width: 32, height: 32,
                                decoration: BoxDecoration(
                                  color: hex,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],

                    // Stock + qty
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Icon(outOfStock ? Icons.cancel_outlined : Icons.check_circle_outline,
                            size: 16, color: outOfStock ? colors.textMuted : colors.success),
                        const SizedBox(width: 6),
                        Text(outOfStock ? "Out of stock" : "In stock",
                            style: theme.textTheme.bodySmall?.copyWith(
                                color: outOfStock ? colors.textMuted : colors.success)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (!outOfStock) _QtyStepper(
                      qty: _qty,
                      max: available,
                      onChanged: (n) => setState(() => _qty = n),
                    ),

                    // Trust strip
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: colors.cream,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          _TrustItem(icon: Icons.local_shipping_outlined, label: "Fast shipping"),
                          _TrustItem(icon: Icons.cached_rounded,        label: "7-day returns"),
                          _TrustItem(icon: Icons.shield_outlined,       label: "Secure pay"),
                        ],
                      ),
                    ),

                    // Expandable sections
                    const SizedBox(height: 24),
                    _Accordion(
                      title: "Product Details",
                      open: _expandedSection == "details",
                      onTap: () => setState(() => _expandedSection = _expandedSection == "details" ? null : "details"),
                      children: [
                        if (p.description != null && p.description!.isNotEmpty)
                          _kvLine(theme, colors, "Description", p.description!.replaceAll(RegExp(r"<[^>]*>"), "")),
                        if (p.fabric != null)         _kvLine(theme, colors, "Fabric",          p.fabric!),
                        if (p.weaveType != null)      _kvLine(theme, colors, "Weave",           p.weaveType!),
                        if (p.regionOfOrigin != null) _kvLine(theme, colors, "Origin",          p.regionOfOrigin!),
                        if (v.sareeCode != null)      _kvLine(theme, colors, "Saree Code",      v.sareeCode!),
                        for (final attr in p.attributes)
                          if (attr.values.isNotEmpty)
                            _kvLine(theme, colors, attr.attributeName, attr.values.join(", ")),
                      ],
                    ),
                    if (p.careInstructions != null && p.careInstructions!.isNotEmpty)
                      _Accordion(
                        title: "Care Instructions",
                        open: _expandedSection == "care",
                        onTap: () => setState(() => _expandedSection = _expandedSection == "care" ? null : "care"),
                        children: [
                          Text(p.careInstructions!.replaceAll(RegExp(r"<[^>]*>"), ""),
                              style: theme.textTheme.bodyMedium),
                        ],
                      ),
                    _Accordion(
                      title: "Delivery & Returns",
                      open: _expandedSection == "delivery",
                      onTap: () => setState(() => _expandedSection = _expandedSection == "delivery" ? null : "delivery"),
                      children: [
                        Text("• Free shipping on orders above ₹2,999\n"
                             "• Standard delivery in 4–7 business days\n"
                             "• Easy 7-day returns",
                            style: theme.textTheme.bodyMedium),
                      ],
                    ),
                  ],
                ),
              ),

              // Related products
              if (widget.related.isNotEmpty) ...[
                const SizedBox(height: 24),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text("You may also like", style: theme.textTheme.titleLarge),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 320,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: widget.related.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (_, i) => SizedBox(
                      width: 160,
                      child: ProductCard(product: widget.related[i]),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ],
          ),
        ),

        // Sticky bottom action bar
        _BottomActions(
          outOfStock: outOfStock,
          onAddToCart: outOfStock ? null : _addToCart,
          onBuyNow:    outOfStock ? null : _buyNow,
        ),
      ],
    );
  }

  Widget _kvLine(ThemeData theme, AppColorsExtension colors, String key, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(key, style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
          ),
          Expanded(child: Text(value, style: theme.textTheme.bodyMedium)),
        ],
      ),
    );
  }
}

Color _parseHex(String? hex) {
  if (hex == null || hex.isEmpty) return Colors.grey.shade400;
  var h = hex.replaceAll("#", "").trim();
  if (h.length == 6) h = "FF$h";
  return Color(int.tryParse(h, radix: 16) ?? 0xFFCCCCCC);
}

class _ImageCarousel extends StatelessWidget {
  const _ImageCarousel({
    required this.images, required this.fallbackName,
    required this.onPageChanged, required this.index,
  });
  final List<ProductImage> images;
  final String fallbackName;
  final ValueChanged<int> onPageChanged;
  final int index;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    if (images.isEmpty) {
      return Container(
        color: colors.cream,
        height: 360,
        child: Center(
          child: Text(fallbackName,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(color: colors.textMuted)),
        ),
      );
    }
    return Stack(
      children: [
        CarouselSlider.builder(
          itemCount: images.length,
          itemBuilder: (_, i, __) => AppImage(url: images[i].url, borderRadius: BorderRadius.zero, height: 420, width: double.infinity),
          options: CarouselOptions(
            height: 420,
            viewportFraction: 1,
            enableInfiniteScroll: false,
            onPageChanged: (i, _) => onPageChanged(i),
          ),
        ),
        if (images.length > 1)
          Positioned(
            bottom: 12, left: 0, right: 0,
            child: Center(
              child: AnimatedSmoothIndicator(
                activeIndex: index,
                count: images.length,
                effect: ExpandingDotsEffect(
                  activeDotColor: Theme.of(context).colorScheme.primary,
                  dotColor: Colors.white.withOpacity(0.6),
                  dotHeight: 6, dotWidth: 6, expansionFactor: 3,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag(this.text);
  final String text;
  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: colors.cream,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: colors.parchment),
      ),
      child: Text(text.toUpperCase(),
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 1.4, color: colors.textMuted)),
    );
  }
}

class _QtyStepper extends StatelessWidget {
  const _QtyStepper({required this.qty, required this.max, required this.onChanged});
  final int qty, max;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: colors.parchment),
        borderRadius: BorderRadius.circular(6),
      ),
      child: IntrinsicWidth(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _stepBtn(Icons.remove, qty > 1 ? () => onChanged(qty - 1) : null),
            Container(
              width: 44, height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                border: Border.symmetric(vertical: BorderSide(color: colors.parchment)),
              ),
              child: Text("$qty"),
            ),
            _stepBtn(Icons.add, qty < max ? () => onChanged(qty + 1) : null),
          ],
        ),
      ),
    );
  }

  Widget _stepBtn(IconData icon, VoidCallback? onPressed) => SizedBox(
    width: 40, height: 40,
    child: IconButton(
      onPressed: onPressed,
      iconSize: 18,
      padding: EdgeInsets.zero,
      icon: Icon(icon),
    ),
  );
}

class _TrustItem extends StatelessWidget {
  const _TrustItem({required this.icon, required this.label});
  final IconData icon;
  final String label;
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 22, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 4),
          Text(label, style: Theme.of(context).textTheme.bodySmall, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _Accordion extends StatelessWidget {
  const _Accordion({required this.title, required this.open, required this.onTap, required this.children});
  final String title;
  final bool open;
  final VoidCallback onTap;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(border: Border.all(color: colors.parchment), borderRadius: BorderRadius.circular(6)),
      child: Column(
        children: [
          InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(6),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              child: Row(
                children: [
                  Expanded(child: Text(title, style: Theme.of(context).textTheme.titleSmall)),
                  Icon(open ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded, color: colors.textMuted),
                ],
              ),
            ),
          ),
          if (open)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
            ),
        ],
      ),
    );
  }
}

class _BottomActions extends StatelessWidget {
  const _BottomActions({required this.outOfStock, this.onAddToCart, this.onBuyNow});
  final bool outOfStock;
  final VoidCallback? onAddToCart, onBuyNow;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    return SafeArea(
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: colors.parchment)),
        ),
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onAddToCart,
                icon: const Icon(Icons.shopping_bag_outlined, size: 18),
                label: Text(outOfStock ? "Sold out" : "Add to bag"),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: onBuyNow,
                icon: const Icon(Icons.bolt_rounded, size: 18),
                label: const Text("Buy now"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
