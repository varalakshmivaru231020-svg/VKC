import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/utils/formatters.dart";
import "../../../core/widgets/app_image.dart";
import "../../cart/data/cart_controller.dart";
import "../../cart/data/cart_models.dart";
import "../data/product_models.dart";

/// Lightweight quick-look sheet for a product. Triggered by long-press on a
/// `ProductCard`. Shows the first image, name, price, and shortcuts to the
/// full PDP, Add-to-bag, and (eventually) wishlist.
Future<void> showQuickViewSheet(BuildContext context, Product product) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
    builder: (_) => _QuickViewSheet(product: product),
  );
}

class _QuickViewSheet extends ConsumerWidget {
  const _QuickViewSheet({required this.product});
  final Product product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme  = Theme.of(context);
    final colors = context.appColors;
    final v = product.primaryVariant;
    final image = v.images.isNotEmpty ? v.images.first.url : null;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36, height: 4,
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(color: colors.parchment, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 130, height: 170,
                  child: AppImage(url: image, borderRadius: BorderRadius.circular(8)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (product.fabric != null)
                        Text(product.fabric!.toUpperCase(),
                            style: theme.textTheme.labelSmall?.copyWith(letterSpacing: 1.2, color: colors.textMuted)),
                      const SizedBox(height: 4),
                      Text(product.name,
                          style: theme.textTheme.titleMedium, maxLines: 3, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 8),
                      Wrap(spacing: 6, runSpacing: 4, crossAxisAlignment: WrapCrossAlignment.center, children: [
                        Text(formatINR(v.salePrice),
                            style: theme.textTheme.titleLarge?.copyWith(
                              color: theme.colorScheme.primary, fontStyle: FontStyle.italic, fontWeight: FontWeight.w600,
                            )),
                        if (v.hasDiscount)
                          Text(formatINR(v.originalPrice),
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colors.textMuted, decoration: TextDecoration.lineThrough,
                              )),
                        if (v.hasDiscount)
                          Text("${v.discountPercent}% off",
                              style: theme.textTheme.labelSmall?.copyWith(color: colors.success, fontWeight: FontWeight.w600)),
                      ]),
                      if (v.colorName.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text("Colour: ${v.colorName}",
                            style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    context.push(RoutePaths.productDetail(product.slug));
                  },
                  child: const Text("View details"),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.shopping_bag_outlined, size: 18),
                  label: const Text("Add to bag"),
                  onPressed: v.availableQty <= 0
                      ? null
                      : () async {
                          await ref.read(cartControllerProvider.notifier).add(CartItem(
                            productId: product.id, variantId: v.id,
                            productName: product.name, variantColor: v.colorName,
                            sareeCode: v.sareeCode, quantity: 1,
                            salePrice: v.salePrice, originalPrice: v.originalPrice,
                            stockQty: v.stockQty, imageUrl: image,
                          ));
                          if (context.mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                              content: const Text("Added to cart"),
                              behavior: SnackBarBehavior.floating,
                              action: SnackBarAction(label: "View", onPressed: () => context.go(RoutePaths.cart)),
                            ));
                          }
                        },
                ),
              ),
            ]),
          ],
        ),
      ),
    );
  }
}
