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
    final image  = v.images.isNotEmpty ? v.images.first.url : null;
    final swatch = _parseHex(v.colorHex);

    return InkWell(
      onTap: () => context.push(RoutePaths.productDetail(product.slug)),
      borderRadius: BorderRadius.circular(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 3 / 4,
            child: image != null && image.isNotEmpty
                ? AppImage(url: image, borderRadius: BorderRadius.circular(8))
                : _SwatchPlaceholder(color: swatch, label: v.colorName),
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
          Wrap(
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 6, runSpacing: 2,
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
                Text(
                  formatINR(v.originalPrice),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colors.textMuted,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),
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

class _SwatchPlaceholder extends StatelessWidget {
  const _SwatchPlaceholder({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withOpacity(0.18), color.withOpacity(0.36)],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
            ),
            if (label.isNotEmpty) ...[
              const SizedBox(height: 6),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(label, textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Colors.black.withOpacity(0.55), fontSize: 11, fontWeight: FontWeight.w500)),
              ),
            ],
          ],
        ),
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
