import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';
import 'ecom/ecom_api.dart';
import 'ecom/ecom_wishlist.dart';
import 'theme.dart';
import 'models.dart';

/// Opens a link outside the app (browser, WhatsApp, dialer, mail). Tells the
/// customer when the phone has nothing that can handle it, rather than
/// swallowing the tap.
Future<void> openExternal(BuildContext context, String url) async {
  final uri = Uri.tryParse(url.trim());
  if (uri == null || url.trim().isEmpty) return;
  var opened = false;
  try {
    opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
  } catch (_) {
    opened = false;
  }
  if (!opened && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nothing on this phone can open that link')));
  }
}

/// A shimmering placeholder block — used while images/content load.
class Skeleton extends StatelessWidget {
  final double? width, height;
  final double radius;
  const Skeleton({super.key, this.width, this.height, this.radius = VlRadii.sm});
  @override
  Widget build(BuildContext context) => Shimmer.fromColors(
        baseColor: VlColors.cream,
        highlightColor: VlColors.paper,
        child: Container(
          width: width,
          height: height,
          decoration: BoxDecoration(color: VlColors.cream, borderRadius: BorderRadius.circular(radius)),
        ),
      );
}

/// Network image with a shimmer while loading and a graceful fallback — the
/// single place image loading is handled, so cards/heroes don't flash or jump.
class NetImage extends StatelessWidget {
  final String? url;
  final int palette;
  final double radius;
  final BoxFit fit;
  const NetImage({super.key, this.url, this.palette = 0, this.radius = VlRadii.md, this.fit = BoxFit.cover});
  @override
  Widget build(BuildContext context) {
    if (url == null || url!.isEmpty) return Silk(palette: palette, radius: radius);
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: LayoutBuilder(
        builder: (context, box) {
          // Decode at the size actually painted. The store's photos arrive far
          // larger than the cell showing them — a 2000px saree decoded into a
          // 168px card costs ~16MB of image cache and a long frame, which is
          // what made the first Home scroll stutter.
          final w = box.hasBoundedWidth ? box.maxWidth : 0.0;
          final cacheWidth = w > 0 ? (w * MediaQuery.devicePixelRatioOf(context)).round() : null;
          return Image.network(
            url!,
            fit: fit,
            width: double.infinity,
            height: double.infinity,
            cacheWidth: cacheWidth,
            gaplessPlayback: true,
            loadingBuilder: (context, child, progress) {
              if (progress == null) return child;
              return const Skeleton(radius: 0);
            },
            errorBuilder: (_, __, ___) => Silk(palette: palette, radius: 0),
          );
        },
      ),
    );
  }
}

/// Vertical-stripe silk fabric placeholder (ports the `.silk` CSS).
class Silk extends StatelessWidget {
  final int palette;
  final double radius;
  final String? label;
  final String? sku;
  final Widget? child;
  const Silk({super.key, this.palette = 0, this.radius = VlRadii.md, this.label, this.sku, this.child});

  @override
  Widget build(BuildContext context) {
    final p = paletteAt(palette);
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: CustomPaint(
        painter: _SilkPainter(p.top, p.bot),
        child: Stack(children: [
          Positioned.fill(child: Container()),
          if (sku != null)
            Positioned(
              right: 8,
              top: 8,
              child: _pill(sku!),
            ),
          if (label != null)
            Positioned(
              left: 10,
              bottom: 10,
              child: _pill(label!),
            ),
          if (child != null) Positioned.fill(child: child!),
        ]),
      ),
    );
  }

  Widget _pill(String t) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
        decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.22), borderRadius: BorderRadius.circular(3)),
        child: Text(t, style: VlText.mono(8, color: Colors.white.withValues(alpha: 0.75))),
      );
}

class _SilkPainter extends CustomPainter {
  final Color top, bot;
  _SilkPainter(this.top, this.bot);
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    canvas.drawRect(
        rect, Paint()..shader = LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [top, bot]).createShader(rect));
    // fine vertical silk warp stripes
    final line = Paint()..color = Colors.white.withValues(alpha: 0.06);
    for (double x = 0; x < size.width; x += 6) {
      canvas.drawRect(Rect.fromLTWH(x + 4, 0, 2, size.height), line);
    }
    // soft top-left sheen
    canvas.drawRect(
        rect,
        Paint()
          ..shader = RadialGradient(
            center: const Alignment(-0.4, -0.2),
            radius: 1.1,
            colors: [Colors.white.withValues(alpha: 0.14), Colors.transparent],
          ).createShader(rect));
  }

  @override
  bool shouldRepaint(covariant _SilkPainter old) => old.top != top || old.bot != bot;
}

/// Real product photo when available, else the Silk fabric placeholder.
class ProductImage extends StatelessWidget {
  final Product p;
  final double radius;
  final bool showSku;
  const ProductImage({super.key, required this.p, this.radius = VlRadii.md, this.showSku = true});
  @override
  Widget build(BuildContext context) {
    if (p.image == null) return Silk(palette: p.palette, radius: radius, sku: showSku ? p.id : null);
    return NetImage(url: p.image, palette: p.palette, radius: radius);
  }
}

/// Small rotated diamond (`.lozenge`).
class Lozenge extends StatelessWidget {
  final Color? color;
  final double size;
  const Lozenge({super.key, this.color, this.size = 6});
  @override
  Widget build(BuildContext context) =>
      Transform.rotate(angle: 0.785398, child: Container(width: size, height: size, color: color ?? VlColors.red));
}

/// Double thin rule divider.
class DoubleRule extends StatelessWidget {
  final EdgeInsets margin;
  const DoubleRule({super.key, this.margin = const EdgeInsets.symmetric(horizontal: 20)});
  @override
  Widget build(BuildContext context) => Padding(
        padding: margin,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(height: 1, color: VlColors.rule),
          const SizedBox(height: 2),
          Container(height: 1, color: VlColors.rule),
        ]),
      );
}

/// Single dashed horizontal rule.
class DashedRule extends StatelessWidget {
  const DashedRule({super.key});
  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (context, c) {
        final count = (c.maxWidth / 6).floor();
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(count, (_) => Container(width: 3, height: 1, color: VlColors.rule)),
        );
      });
}

/// LIVE pill with pulsing dot.
class LiveBadge extends StatelessWidget {
  const LiveBadge({super.key});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(4)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 6, height: 6, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text('LIVE', style: VlText.ui(10, weight: FontWeight.w700, color: Colors.white, letter: 0.16)),
        ]),
      );
}

/// Frosted glass chip used across the stream overlay.
class GlassChip extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;
  const GlassChip({super.key, required this.child, this.padding = const EdgeInsets.symmetric(horizontal: 10, vertical: 4)});
  @override
  Widget build(BuildContext context) => Container(
        padding: padding,
        decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(4)),
        child: child,
      );
}

/// Editorial top bar.
class TopBar extends StatelessWidget {
  final String? title;
  final VoidCallback? onBack;
  final List<Widget> actions;
  const TopBar({super.key, this.title, this.onBack, this.actions = const []});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
            color: VlColors.canvas, border: Border(bottom: BorderSide(color: VlColors.rule))),
        child: Row(children: [
          SizedBox(
            width: 36,
            child: onBack == null
                ? null
                : InkResponse(
                    onTap: onBack,
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                          shape: BoxShape.circle, border: Border.all(color: VlColors.rule2)),
                      child: Icon(Icons.arrow_back, size: 16, color: VlColors.ink),
                    ),
                  ),
          ),
          Expanded(
              child: title == null
                  ? const SizedBox()
                  : Text(title!, textAlign: TextAlign.center, style: VlText.display(18))),
          SizedBox(width: 36, child: Row(mainAxisAlignment: MainAxisAlignment.end, children: actions)),
        ]),
      );
}

/// Price row ₹value with struck-through mrp.
/// Whole-percent saving off the MRP, or null when there is nothing to shout
/// about. Computed from the real figures — never stored, never assumed.
int? discountPercent(double price, double? mrp) {
  if (mrp == null || mrp <= 0 || price <= 0 || mrp <= price) return null;
  final pct = ((mrp - price) / mrp * 100).round();
  return pct <= 0 ? null : pct;
}

class PriceRow extends StatelessWidget {
  final double value;
  final double? mrp;
  final double size;
  final bool white;

  /// Adds "N% OFF" after the struck-through MRP. Opt-in, so the cart lines and
  /// the product page keep the plain price they already show.
  final bool showDiscount;
  const PriceRow({super.key, required this.value, this.mrp, this.size = 14, this.white = false, this.showDiscount = false});
  @override
  Widget build(BuildContext context) {
    String group(double v) => v.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');
    final f = group(value);
    final off = showDiscount ? discountPercent(value, mrp) : null;
    // Shrink rather than overflow: a five-figure price beside a five-figure MRP
    // is wider than half a narrow phone, and the row used to run off the tile
    // and clip the last element mid-character.
    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: Alignment.centerLeft,
      child: _row(f, group, off),
    );
  }

  Widget _row(String f, String Function(double) group, int? off) {
    return Row(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
      Text('₹$f', style: VlText.ui(size, weight: FontWeight.w600, color: white ? Colors.white : VlColors.ink)),
      if (mrp != null) ...[
        const SizedBox(width: 8),
        Text('₹${group(mrp!)}',
            style: VlText.body(size * 0.72, color: white ? Colors.white54 : VlColors.muted2)
                .copyWith(decoration: TextDecoration.lineThrough)),
      ],
      if (off != null) ...[
        const SizedBox(width: 8),
        Text('$off% OFF',
            style: VlText.ui(size * 0.72, weight: FontWeight.w700, color: white ? Colors.white : VlColors.green, letter: 0.04)),
      ],
    ]);
  }
}

/// Section header with number, kicker, title + optional action (ports SectionHead).
/// A section title. Deliberately has no number field — sections used to be
/// stamped "01 / 02 / 03", which dated the design and broke the moment a
/// section was added, removed or hidden because the store had no data for it.
class SectionHead extends StatelessWidget {
  final Widget? kicker;
  final String title;
  final String? action;
  final VoidCallback? onAction;
  const SectionHead({super.key, this.kicker, required this.title, this.action, this.onAction});
  @override
  Widget build(BuildContext context) => Padding(
        // Top padding is load-bearing: with none, a section title sat flush
        // against the row above it and the two sections read as one block.
        padding: const EdgeInsets.fromLTRB(20, 28, 20, 16),
        child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (kicker != null)
                DefaultTextStyle(
                  style: VlText.upper(9, color: VlColors.red, letter: 0.2),
                  child: kicker!,
                ),
              const SizedBox(height: 3),
              Text(title, style: VlText.display(20)),
            ]),
          ),
          if (action != null)
            GestureDetector(
              onTap: onAction,
              child: Text(action!, style: VlText.ui(11, weight: FontWeight.w500, color: VlColors.red)),
            ),
        ]),
      );
}

/// The one divider that closes a section, with the one spacing every section
/// uses. New sections get the house rhythm by using this instead of choosing
/// their own margins — which is how Home ended up with three different gaps.
class SectionDivider extends StatelessWidget {
  const SectionDivider({super.key});
  @override
  Widget build(BuildContext context) => const DoubleRule(margin: EdgeInsets.fromLTRB(20, 26, 20, 0));
}

// ── Skeleton loaders ─────────────────────────────────────────────────────────
// One set of shapes, reused everywhere, so no API-driven screen ever shows a
// blank page while it waits.

/// Product-grid placeholder — same 2-up geometry as the real grid.
class ProductGridSkeleton extends StatelessWidget {
  final int count;
  final EdgeInsets padding;
  const ProductGridSkeleton({super.key, this.count = 4, this.padding = const EdgeInsets.fromLTRB(20, 14, 20, 14)});
  @override
  Widget build(BuildContext context) => GridView.count(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 0.56,
        padding: padding,
        physics: const NeverScrollableScrollPhysics(),
        children: List.generate(
          count,
          (_) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
            Expanded(child: Skeleton(radius: VlRadii.md)),
            SizedBox(height: 10),
            Skeleton(width: 70, height: 8),
            SizedBox(height: 7),
            Skeleton(height: 12),
            SizedBox(height: 7),
            Skeleton(width: 90, height: 12),
          ]),
        ),
      );
}

/// Thumbnail + two lines, for order/notification/wallet style lists.
class ListRowsSkeleton extends StatelessWidget {
  final int count;
  final double thumb;
  final EdgeInsets padding;
  const ListRowsSkeleton({
    super.key,
    this.count = 5,
    this.thumb = 56,
    this.padding = const EdgeInsets.fromLTRB(20, 16, 20, 20),
  });
  @override
  Widget build(BuildContext context) => ListView.separated(
        padding: padding,
        itemCount: count,
        physics: const NeverScrollableScrollPhysics(),
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (_, __) => Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Skeleton(width: thumb, height: thumb * 1.2),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
              Skeleton(width: 90, height: 8),
              SizedBox(height: 8),
              Skeleton(height: 12),
              SizedBox(height: 7),
              Skeleton(width: 140, height: 11),
            ]),
          ),
        ]),
      );
}

/// Stacked text blocks, for detail/editorial screens.
class DetailSkeleton extends StatelessWidget {
  final double heroHeight;
  const DetailSkeleton({super.key, this.heroHeight = 300});
  @override
  Widget build(BuildContext context) => ListView(
        padding: EdgeInsets.zero,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          Skeleton(height: heroHeight, radius: 0),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
              Skeleton(width: 120, height: 9),
              SizedBox(height: 12),
              Skeleton(height: 22),
              SizedBox(height: 10),
              Skeleton(width: 160, height: 22),
              SizedBox(height: 22),
              Skeleton(height: 12),
              SizedBox(height: 8),
              Skeleton(height: 12),
              SizedBox(height: 8),
              Skeleton(width: 220, height: 12),
            ]),
          ),
        ],
      );
}

/// Floating action button for Video Shopping — a 56dp circle in the store's
/// darkest ink with a white camera glyph and no label, opening the in-app
/// booking screen. Given to a Scaffold as its `floatingActionButton`, so it
/// clears the bottom nav and the safe area on its own; screens with their own
/// sticky footer pass [liftAbove] to sit above it.
class VideoCallFab extends StatefulWidget {
  /// Height of a sticky bar this screen draws at the bottom of its body.
  final double liftAbove;
  const VideoCallFab({super.key, this.liftAbove = 0});

  @override
  State<VideoCallFab> createState() => _VideoCallFabState();
}

class _VideoCallFabState extends State<VideoCallFab> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: widget.liftAbove),
      child: Semantics(
        button: true,
        label: 'Book a video shopping call',
        child: AnimatedScale(
          scale: _pressed ? 0.92 : 1,
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOut,
          child: DecoratedBox(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.28), blurRadius: 16, offset: const Offset(0, 6)),
                BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 4, offset: const Offset(0, 1)),
              ],
            ),
            child: Material(
              color: VlColors.ink,
              shape: const CircleBorder(),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                customBorder: const CircleBorder(),
                splashColor: Colors.white24,
                highlightColor: Colors.white10,
                onTapDown: (_) => setState(() => _pressed = true),
                onTapCancel: () => setState(() => _pressed = false),
                onTap: () {
                  setState(() => _pressed = false);
                  context.push('/video-booking');
                },
                child: const SizedBox(
                  width: 56,
                  height: 56,
                  child: Icon(Icons.videocam_rounded, size: 26, color: Colors.white),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Toggles [product] in the shared wishlist, sending guests to sign in first
/// — every heart in the app routes through here, so one tap means one call.
Future<void> toggleWishlist(BuildContext context, Product product) async {
  if (!EcomAuth.I.isLoggedIn) {
    context.push('/login');
    return;
  }
  final variantId = product.variantId;
  if (variantId == null) {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('This saree can’t be saved right now')));
    return;
  }
  try {
    await Wishlist.I.toggle(variantId);
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ecomError(e, 'Could not update wishlist'))));
    }
  }
}

// ── Product card geometry ────────────────────────────────────────────────────
// The card's text block is a fixed height so that every tile in a row is
// identical. Without this the name wraps to one line on one card and two on
// its neighbour, and with an Expanded image the leftover space went to the
// picture — so two cards side by side had visibly different image heights and
// their prices sat at different y positions. That misalignment is what made
// neighbouring cards read as one merged block.

/// Line height forced on the product name so two lines are always the same
/// height, whatever the name is.
const double _kNameLineHeight = 1.3;
const double _kNameFontSize = 13;
const double _kWeaveFontSize = 9;
const double _kPriceFontSize = 14;

/// Height of everything below the image, at the current text scale.
double productCardTextHeight(BuildContext context) {
  final s = MediaQuery.textScalerOf(context);
  return 10 // gap under the image
      +
      s.scale(_kWeaveFontSize) * 1.35 // category
      +
      5 +
      s.scale(_kNameFontSize) * _kNameLineHeight * 2 // name, always two lines
      +
      7 +
      s.scale(_kPriceFontSize) * 1.45 // price row
      +
      // Slack. Real line heights come from the font's own ascent/descent, which
      // differ per family and per platform, so the arithmetic above lands a
      // fraction of a pixel short on some devices — and a fraction is enough
      // for Flutter to paint the overflow stripes.
      4;
}

/// One grid geometry shared by every product grid, so Home, the listing and
/// the wishlist can't drift apart.
///
/// [gridWidth] is the width actually available to the grid — pass it from a
/// LayoutBuilder rather than reading the screen width, because the two differ
/// wherever the grid sits inside padding, and guessing the padding is how a
/// tile ends up 300px taller than the cell it has to fit in.
SliverGridDelegateWithFixedCrossAxisCount productGridDelegate(
  BuildContext context,
  double gridWidth, {
  double spacing = 16,
}) {
  final tile = (gridWidth - spacing) / 2;
  return SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    mainAxisSpacing: spacing,
    crossAxisSpacing: spacing,
    // 4:5 image + the fixed text block.
    mainAxisExtent: tile * 1.25 + productCardTextHeight(context),
  );
}

/// Product grid card (ports ProductCard), with optional wishlist heart.
class ProductCard extends StatelessWidget {
  final Product p;
  final VoidCallback? onTap;

  /// Leave null and the heart subscribes to [Wishlist] on its own.
  ///
  /// Callers used to wrap a whole grid in a ValueListenableBuilder, so one tap
  /// on one heart rebuilt every card on the screen — images, prices and all.
  /// Scoping the listener to the icon means a tap repaints 30×30 logical
  /// pixels. Pass a value only where membership is already known (the wishlist
  /// screen, where every card is by definition a favourite).
  final bool? fav;
  final VoidCallback? onFav;
  const ProductCard({super.key, required this.p, this.onTap, this.fav, this.onFav});
  @override
  Widget build(BuildContext context) {
    final off = discountPercent(p.price, p.mrp);
    final scaler = MediaQuery.textScalerOf(context);
    return GestureDetector(
      onTap: onTap,
      // Opaque background: without one, a translucent gap between tiles let the
      // eye run two cards together.
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Fixed 4:5, so every image in a row is exactly the same height no
        // matter how long its neighbour's name is.
        AspectRatio(
          aspectRatio: 4 / 5,
          child: Stack(fit: StackFit.expand, children: [
            ProductImage(p: p),
            // Discount always owns the top-left corner, on every card, in the
            // store's red. This is the one badge a shopper scans for.
            if (off != null)
              Positioned(
                left: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: VlBrand.sale,
                    borderRadius: BorderRadius.circular(4),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.22), blurRadius: 6, offset: const Offset(0, 2))],
                  ),
                  child: Text('$off% OFF',
                      style: VlText.ui(9.5, weight: FontWeight.w700, color: Colors.white, letter: 0.08)),
                ),
              ),
            // The store's own label moves to the opposite corner so it can
            // never sit on top of the discount.
            if (p.badge != null)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: VlColors.paper.withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(p.badge!.toUpperCase(), style: VlText.upper(8, color: VlColors.redDeep, letter: 0.12)),
                ),
              ),
            if (onFav != null)
              Positioned(
                right: 8,
                bottom: 8,
                child: GestureDetector(
                  onTap: onFav,
                  child: Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: VlColors.paper.withValues(alpha: 0.92),
                      shape: BoxShape.circle,
                    ),
                    child: fav != null
                        ? _heart(fav!)
                        : ValueListenableBuilder<Set<String>>(
                            valueListenable: Wishlist.I.variantIds,
                            builder: (_, ids, __) => _heart(ids.contains(p.variantId)),
                          ),
                  ),
                ),
              ),
          ]),
        ),
        const SizedBox(height: 10),
        Text(p.weave.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: VlText.mono(_kWeaveFontSize, color: VlColors.muted2, letter: 0.16)),
        const SizedBox(height: 5),
        // Always two lines tall, so the price below lines up with the price on
        // the card beside it even when one name is short and the other wraps.
        SizedBox(
          height: scaler.scale(_kNameFontSize) * _kNameLineHeight * 2,
          child: Text(
            p.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: VlText.ui(_kNameFontSize, weight: FontWeight.w500).copyWith(height: _kNameLineHeight),
          ),
        ),
        const SizedBox(height: 7),
        // Current price and the struck MRP only. The percentage lives on the
        // image badge — carrying it here too was what pushed the row past the
        // tile's width and left "8%…" clipped mid-word.
        PriceRow(value: p.price, mrp: p.mrp, size: _kPriceFontSize),
      ]),
    );
  }

  Widget _heart(bool on) => Icon(on ? Icons.favorite : Icons.favorite_border, size: 15, color: on ? VlColors.red : VlColors.ink);
}
