import "package:flutter/material.dart";
import "package:go_router/go_router.dart";

import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/utils/formatters.dart";
import "../../../core/widgets/app_image.dart";
import "../data/product_models.dart";

class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.product});
  final Product product;

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final colors = context.appColors;
    final v = product.primaryVariant;
    final image = v.images.isNotEmpty ? v.images.first.url : null;

    return InkWell(
      onTap: () => context.push(RoutePaths.productDetail(product.slug)),
      borderRadius: BorderRadius.circular(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 3 / 4,
            child: AppImage(url: image, borderRadius: BorderRadius.circular(8)),
          ),
          const SizedBox(height: 8),
          Text(
            product.name,
            style: theme.textTheme.titleSmall,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (product.fabric != null) ...[
            const SizedBox(height: 2),
            Text(
              product.fabric!,
              style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                formatINR(v.salePrice),
                style: theme.textTheme.titleMedium?.copyWith(
                  color: theme.colorScheme.primary,
                  fontStyle: FontStyle.italic,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (v.hasDiscount) ...[
                const SizedBox(width: 6),
                Text(
                  formatINR(v.originalPrice),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colors.textMuted,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  "${v.discountPercent}% off",
                  style: theme.textTheme.labelSmall?.copyWith(color: colors.success, fontWeight: FontWeight.w600),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
