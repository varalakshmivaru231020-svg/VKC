import "package:cached_network_image/cached_network_image.dart";
import "package:flutter/material.dart";
import "package:shimmer/shimmer.dart";

/// Wrapper around CachedNetworkImage with brand placeholders.
class AppImage extends StatelessWidget {
  const AppImage({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    this.borderRadius,
    this.placeholderColor,
  });

  final String? url;
  final BoxFit fit;
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;
  final Color? placeholderColor;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.circular(6);
    final fallbackBg = placeholderColor ?? Theme.of(context).dividerColor.withOpacity(0.4);

    final image = (url == null || url!.isEmpty)
        ? Container(width: width, height: height, color: fallbackBg, child: const Center(child: Icon(Icons.image_outlined, size: 24, color: Colors.white70)))
        : CachedNetworkImage(
            imageUrl: url!,
            fit: fit,
            width: width,
            height: height,
            placeholder: (_, __) => Shimmer.fromColors(
              baseColor: fallbackBg,
              highlightColor: fallbackBg.withOpacity(0.2),
              child: Container(width: width, height: height, color: fallbackBg),
            ),
            errorWidget: (_, __, ___) => Container(
              width: width, height: height, color: fallbackBg,
              child: const Center(child: Icon(Icons.broken_image_outlined, size: 24, color: Colors.white70)),
            ),
          );

    return ClipRRect(borderRadius: radius, child: image);
  }
}
