import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';
import 'ecom/ecom_api.dart';
import 'ecom/ecom_cart.dart';
import 'ecom/ecom_models.dart';
import 'ecom/ecom_wishlist.dart';
import 'models.dart';
import 'theme.dart';

// ─────────────────────────────────────────────────────────────────────────────
// VKC Gold Ikshu design system — the reusable pieces every screen is built
// from. Nothing in here knows about a particular screen; screens compose
// these and never restyle them.
// ─────────────────────────────────────────────────────────────────────────────

/// "12,345" — every rupee figure in the app is grouped the same way.
String inr(num v) => v.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');

/// Plain text from the rich-text the admin editor saves.
String stripHtml(String? s) => (s ?? '')
    .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
    .replaceAll(RegExp(r'</p>\s*<p>', caseSensitive: false), '\n\n')
    .replaceAll(RegExp(r'<[^>]*>'), ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll(RegExp(r'[ \t]+'), ' ')
    .replaceAll(RegExp(r' *\n *'), '\n')
    .replaceAll(RegExp(r'\n{3,}'), '\n\n')
    .trim();

/// Opens a link outside the app (browser, WhatsApp, dialer, mail). Tells the
/// customer when the phone has nothing that can handle it.
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

/// A brief note in the bar above the bottom navigation: an optional icon,
/// one line of text (cut with an ellipsis, never wrapped) and an optional
/// action. Three seconds, then gone.
void toast(BuildContext context, String message, {String? action, VoidCallback? onAction, IconData? icon}) {
  if (!context.mounted) return;
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Row(children: [
        if (icon != null) ...[Icon(icon, size: 18, color: VkColors.cream), const SizedBox(width: 10)],
        Expanded(child: Text(message, maxLines: 1, overflow: TextOverflow.ellipsis)),
      ]),
      padding: EdgeInsets.only(left: 18, right: action == null ? 18 : 6, top: action == null ? 16 : 6, bottom: action == null ? 16 : 6),
      duration: const Duration(seconds: 3),
      dismissDirection: DismissDirection.down,
      action: action == null
          ? null
          : SnackBarAction(label: action, textColor: VkColors.saffron, onPressed: onAction ?? () {}),
    ));
}

// ── Brand ────────────────────────────────────────────────────────────────────

/// The static VKC Gold Ikshu emblem (bundled, never the admin upload) with an
/// optional wordmark. [animate] plays a soft fade-and-settle on first build —
/// used once, on the Home header.
class BrandLogo extends StatefulWidget {
  final double height;
  final bool wordmark;
  final bool animate;
  final Color? color;
  const BrandLogo({super.key, this.height = 40, this.wordmark = true, this.animate = false, this.color});

  @override
  State<BrandLogo> createState() => _BrandLogoState();
}

class _BrandLogoState extends State<BrandLogo> {
  bool _in = false;

  @override
  void initState() {
    super.initState();
    if (widget.animate) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _in = true);
      });
    } else {
      _in = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.color ?? VkColors.ink;
    final row = Row(mainAxisSize: MainAxisSize.min, children: [
      Image.asset('assets/brand/logo.png', height: widget.height, width: widget.height, fit: BoxFit.contain,
          semanticLabel: 'VKC Gold Ikshu'),
      if (widget.wordmark) ...[
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          Text('VKC Gold Ikshu', style: VkText.display(widget.height * 0.5, color: c, height: 1.0)),
          const SizedBox(height: 2),
          Text('PURE CANE JAGGERY · MANDYA', style: VkText.upper(widget.height * 0.18, color: c.withValues(alpha: 0.6), letter: 0.16)),
        ]),
      ],
    ]);
    if (!widget.animate) return row;
    return AnimatedOpacity(
      opacity: _in ? 1 : 0,
      duration: const Duration(milliseconds: 520),
      curve: Curves.easeOut,
      child: AnimatedScale(
        scale: _in ? 1 : 0.94,
        duration: const Duration(milliseconds: 620),
        curve: VkMotion.curve,
        alignment: Alignment.centerLeft,
        child: row,
      ),
    );
  }
}

// ── Loading + images ─────────────────────────────────────────────────────────

/// A shimmering placeholder block — used while images/content load.
class Skeleton extends StatelessWidget {
  final double? width, height;
  final double radius;
  const Skeleton({super.key, this.width, this.height, this.radius = VkRadii.sm});
  @override
  Widget build(BuildContext context) => Shimmer.fromColors(
        baseColor: VkColors.cream,
        highlightColor: VkColors.paper,
        period: const Duration(milliseconds: 1400),
        child: Container(
          width: width,
          height: height,
          decoration: BoxDecoration(color: VkColors.cream, borderRadius: BorderRadius.circular(radius)),
        ),
      );
}

/// The soft brand tile shown wherever a photo is missing.
class PlaceholderTile extends StatelessWidget {
  final double radius;
  final IconData icon;
  final int seed;
  const PlaceholderTile({super.key, this.radius = VkRadii.md, this.icon = Icons.spa_outlined, this.seed = 0});

  static const _tones = [
    [Color(0xFFFBF1DE), Color(0xFFF0DCB6)],
    [Color(0xFFFFF0CC), Color(0xFFF3D89A)],
    [Color(0xFFEBF5E9), Color(0xFFCFE3C8)],
    [Color(0xFFFBE8D9), Color(0xFFF0CDB0)],
    [Color(0xFFF3E3C4), Color(0xFFE1C79B)],
    [Color(0xFFFDF5EE), Color(0xFFF3DCC5)],
  ];

  @override
  Widget build(BuildContext context) {
    final t = _tones[seed % _tones.length];
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: t),
      ),
      alignment: Alignment.center,
      child: Icon(icon, size: 26, color: VkColors.primaryDeep.withValues(alpha: 0.28)),
    );
  }
}

/// Network image with disk + memory caching, a shimmer while loading and a
/// brand tile on failure — the single place image loading is handled, so
/// cards, banners and galleries never flash or jump.
class NetImage extends StatelessWidget {
  final String? url;
  final double radius;
  final BoxFit fit;
  final Alignment alignment;
  final int seed;
  final IconData placeholderIcon;
  const NetImage({
    super.key,
    this.url,
    this.radius = VkRadii.md,
    this.fit = BoxFit.cover,
    this.alignment = Alignment.center,
    this.seed = 0,
    this.placeholderIcon = Icons.spa_outlined,
  });

  @override
  Widget build(BuildContext context) {
    final u = url;
    if (u == null || u.isEmpty) return PlaceholderTile(radius: radius, seed: seed, icon: placeholderIcon);
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: LayoutBuilder(
        builder: (context, box) {
          // Decode at the size actually painted: a 2000px photo decoded into a
          // 170px card costs ~16MB of image cache and a long frame.
          final w = box.hasBoundedWidth ? box.maxWidth : 0.0;
          final cacheWidth = w > 0 ? (w * MediaQuery.devicePixelRatioOf(context)).round() : null;
          return CachedNetworkImage(
            imageUrl: u,
            fit: fit,
            alignment: alignment,
            width: double.infinity,
            height: double.infinity,
            memCacheWidth: cacheWidth,
            fadeInDuration: VkMotion.base,
            fadeOutDuration: VkMotion.fast,
            placeholder: (_, __) => const Skeleton(radius: 0),
            errorWidget: (_, __, ___) => PlaceholderTile(radius: 0, seed: seed, icon: placeholderIcon),
          );
        },
      ),
    );
  }
}

/// Product photo, or the brand tile when the store has not added one.
class ProductImage extends StatelessWidget {
  final Product p;
  final double radius;
  const ProductImage({super.key, required this.p, this.radius = VkRadii.md});
  @override
  Widget build(BuildContext context) => NetImage(url: p.image, radius: radius, seed: p.palette);
}

// ── Chrome ───────────────────────────────────────────────────────────────────

/// Native app header: round back button, centred title, optional actions.
class TopBar extends StatelessWidget {
  final String? title;
  final VoidCallback? onBack;
  final List<Widget> actions;
  final bool transparent;
  const TopBar({super.key, this.title, this.onBack, this.actions = const [], this.transparent = false});

  /// A circular action for the right side of the bar.
  static Widget action(IconData icon, VoidCallback onTap, {String? tooltip, Widget? badge}) => Semantics(
        button: true,
        label: tooltip,
        child: InkResponse(
          onTap: onTap,
          radius: 24,
          child: SizedBox(
            width: 44,
            height: 44,
            child: Stack(alignment: Alignment.center, clipBehavior: Clip.none, children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: VkColors.paper, shape: BoxShape.circle, border: Border.all(color: VkColors.rule)),
                child: Icon(icon, size: 18, color: VkColors.ink),
              ),
              if (badge != null) Positioned(top: 0, right: 0, child: badge),
            ]),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        decoration: BoxDecoration(
          color: transparent ? Colors.transparent : VkColors.canvas,
          border: transparent ? null : const Border(bottom: BorderSide(color: VkColors.rule)),
        ),
        child: Row(children: [
          SizedBox(
            width: 44,
            child: onBack == null ? null : action(Icons.arrow_back_rounded, onBack!, tooltip: 'Back'),
          ),
          Expanded(
            child: title == null
                ? const SizedBox()
                : Text(title!, textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.display(21)),
          ),
          SizedBox(
            width: actions.isEmpty ? 44 : null,
            child: Row(mainAxisSize: MainAxisSize.min, mainAxisAlignment: MainAxisAlignment.end, children: actions),
          ),
        ]),
      );
}

/// A tab's own header: big title on the left, actions on the right. Used by
/// the Categories, Shop, Cart and Profile tabs so they read as one family.
class TabHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final List<Widget> actions;
  const TabHeader({super.key, required this.title, this.subtitle, this.actions = const []});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(VkSpace.page, 14, 12, 6),
        child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: VkText.display(28, height: 1.05)),
              if (subtitle != null) ...[
                const SizedBox(height: 3),
                Text(subtitle!, style: VkText.body(12.5, color: VkColors.muted)),
              ],
            ]),
          ),
          ...actions,
        ]),
      );
}

/// Section title with an optional kicker and a trailing action.
class SectionHead extends StatelessWidget {
  final String? kicker;
  final String title;
  final String? action;
  final VoidCallback? onAction;
  final EdgeInsets padding;
  const SectionHead({
    super.key,
    this.kicker,
    required this.title,
    this.action,
    this.onAction,
    this.padding = const EdgeInsets.fromLTRB(VkSpace.page, VkSpace.section, VkSpace.page, 14),
  });
  @override
  Widget build(BuildContext context) => Padding(
        padding: padding,
        child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (kicker != null) ...[
                Text(kicker!.toUpperCase(), style: VkText.upper(9, color: VkColors.primary, letter: 0.2)),
                const SizedBox(height: 4),
              ],
              Text(title, style: VkText.display(23, height: 1.05)),
            ]),
          ),
          if (action != null)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                minimumSize: const Size(44, 36),
                foregroundColor: VkColors.primary,
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Text(action!, style: VkText.ui(12, weight: FontWeight.w600, color: VkColors.primary)),
                const SizedBox(width: 2),
                const Icon(Icons.chevron_right_rounded, size: 18, color: VkColors.primary),
              ]),
            ),
        ]),
      );
}

/// Thin double rule — the house divider.
class DoubleRule extends StatelessWidget {
  final EdgeInsets margin;
  const DoubleRule({super.key, this.margin = const EdgeInsets.symmetric(horizontal: 20)});
  @override
  Widget build(BuildContext context) => Padding(
        padding: margin,
        child: Column(mainAxisSize: MainAxisSize.min, children: const [
          SizedBox(height: 1, child: ColoredBox(color: VkColors.rule)),
          SizedBox(height: 2),
          SizedBox(height: 1, child: ColoredBox(color: VkColors.rule)),
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
          children: List.generate(count, (_) => Container(width: 3, height: 1, color: VkColors.rule)),
        );
      });
}

/// Small tracked pill label — "NEW", "SOLD OUT", "FEATURED".
class VkBadge extends StatelessWidget {
  final String text;
  final Color color;
  final Color textColor;
  const VkBadge(this.text, {super.key, this.color = VkColors.ink, this.textColor = Colors.white});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(VkRadii.xs)),
        child: Text(text.toUpperCase(), style: VkText.upper(8.5, color: textColor, letter: 0.1, weight: FontWeight.w700)),
      );
}

/// Selectable pill used for filters, sorts and search suggestions.
class VkChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final IconData? icon;
  final VoidCallback? onRemove;
  const VkChip({super.key, required this.label, this.selected = false, this.onTap, this.icon, this.onRemove});
  @override
  Widget build(BuildContext context) => Material(
        color: selected ? VkColors.ink : VkColors.paper,
        shape: StadiumBorder(side: BorderSide(color: selected ? VkColors.ink : VkColors.rule2)),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: EdgeInsets.fromLTRB(icon == null ? 14 : 11, 9, onRemove == null ? 14 : 8, 9),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              if (icon != null) ...[
                Icon(icon, size: 14, color: selected ? Colors.white : VkColors.muted),
                const SizedBox(width: 6),
              ],
              Text(label, style: VkText.ui(12, weight: selected ? FontWeight.w600 : FontWeight.w500, color: selected ? Colors.white : VkColors.ink)),
              if (onRemove != null) ...[
                const SizedBox(width: 4),
                InkResponse(
                  onTap: onRemove,
                  radius: 14,
                  child: Icon(Icons.close_rounded, size: 14, color: selected ? Colors.white70 : VkColors.muted2),
                ),
              ],
            ]),
          ),
        ),
      );
}

/// Five stars, filled to [rating].
class RatingStars extends StatelessWidget {
  final double rating;
  final double size;
  const RatingStars({super.key, required this.rating, this.size = 14});
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        for (var i = 1; i <= 5; i++)
          Icon(
            rating >= i ? Icons.star_rounded : (rating >= i - 0.5 ? Icons.star_half_rounded : Icons.star_outline_rounded),
            size: size,
            color: VkColors.amber,
          ),
      ]);
}

// ── Motion ───────────────────────────────────────────────────────────────────

/// Subtle press feedback: the child settles to 97% while touched.
class PressScale extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final double scale;
  const PressScale({super.key, required this.child, this.onTap, this.onLongPress, this.scale = 0.97});
  @override
  State<PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<PressScale> {
  bool _down = false;
  @override
  Widget build(BuildContext context) => GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: widget.onTap == null ? null : (_) => setState(() => _down = true),
        onTapUp: (_) => setState(() => _down = false),
        onTapCancel: () => setState(() => _down = false),
        onTap: widget.onTap,
        onLongPress: widget.onLongPress,
        child: AnimatedScale(
          scale: _down ? widget.scale : 1,
          duration: VkMotion.fast,
          curve: Curves.easeOut,
          child: widget.child,
        ),
      );
}

/// Soft entrance: fades in and rises a few pixels, once, after [delay].
class FadeSlideIn extends StatefulWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;
  final double offset;
  const FadeSlideIn({super.key, required this.child, this.delay = Duration.zero, this.duration = VkMotion.slow, this.offset = 10});
  @override
  State<FadeSlideIn> createState() => _FadeSlideInState();
}

class _FadeSlideInState extends State<FadeSlideIn> {
  bool _in = false;
  @override
  void initState() {
    super.initState();
    Future<void>.delayed(widget.delay, () {
      if (mounted) setState(() => _in = true);
    });
  }

  @override
  Widget build(BuildContext context) => AnimatedOpacity(
        opacity: _in ? 1 : 0,
        duration: widget.duration,
        curve: Curves.easeOut,
        child: AnimatedSlide(
          offset: _in ? Offset.zero : Offset(0, widget.offset / 100),
          duration: widget.duration,
          curve: VkMotion.curve,
          child: widget.child,
        ),
      );
}

// ── Buttons ──────────────────────────────────────────────────────────────────

/// The one filled CTA. Full-width by default; pass [expanded] false to hug.
class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final bool loading;
  final bool expanded;
  final double height;
  final Color color;
  final Color textColor;
  const PrimaryButton({
    super.key,
    required this.label,
    this.onTap,
    this.icon,
    this.loading = false,
    this.expanded = true,
    this.height = 52,
    this.color = VkColors.primary,
    this.textColor = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null && !loading;
    final child = Row(mainAxisSize: MainAxisSize.min, mainAxisAlignment: MainAxisAlignment.center, children: [
      if (loading)
        SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: textColor))
      else ...[
        if (icon != null) ...[Icon(icon, size: 17, color: textColor), const SizedBox(width: 8)],
        Text(label.toUpperCase(), style: VkText.ui(12.5, weight: FontWeight.w600, color: textColor, letter: 0.08)),
      ],
    ]);
    return AnimatedOpacity(
      opacity: enabled ? 1 : 0.55,
      duration: VkMotion.base,
      child: Material(
        color: color,
        borderRadius: BorderRadius.circular(VkRadii.md),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: enabled ? onTap : null,
          splashColor: Colors.white24,
          child: Container(
            height: height,
            width: expanded ? double.infinity : null,
            padding: const EdgeInsets.symmetric(horizontal: 22),
            alignment: Alignment.center,
            child: child,
          ),
        ),
      ),
    );
  }
}

/// Secondary CTA: outlined on paper.
class OutlineButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final bool expanded;
  final double height;
  final Color color;
  const OutlineButton({
    super.key,
    required this.label,
    this.onTap,
    this.icon,
    this.expanded = true,
    this.height = 52,
    this.color = VkColors.ink,
  });
  @override
  Widget build(BuildContext context) => Material(
        color: VkColors.paper,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(VkRadii.md), side: BorderSide(color: color.withValues(alpha: 0.35))),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Container(
            height: height,
            width: expanded ? double.infinity : null,
            padding: const EdgeInsets.symmetric(horizontal: 18),
            alignment: Alignment.center,
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              if (icon != null) ...[Icon(icon, size: 17, color: color), const SizedBox(width: 8)],
              Text(label.toUpperCase(), style: VkText.ui(12.5, weight: FontWeight.w600, color: color, letter: 0.08)),
            ]),
          ),
        ),
      );
}

/// − [n] + stepper. [max] caps at stock.
class QtyStepper extends StatelessWidget {
  final int value;
  final int min;
  final int max;
  final ValueChanged<int> onChanged;
  final bool compact;
  const QtyStepper({super.key, required this.value, required this.onChanged, this.min = 1, this.max = 99, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final h = compact ? 32.0 : 40.0;
    Widget btn(IconData ic, bool enabled, VoidCallback onTap) => SizedBox(
          width: h,
          height: h,
          child: InkWell(
            onTap: enabled ? onTap : null,
            child: Icon(ic, size: compact ? 15 : 17, color: enabled ? VkColors.ink : VkColors.muted2),
          ),
        );
    return Material(
      color: VkColors.paper,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(VkRadii.sm), side: const BorderSide(color: VkColors.rule2)),
      clipBehavior: Clip.antiAlias,
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        btn(Icons.remove_rounded, value > min, () => onChanged(value - 1)),
        SizedBox(
          width: compact ? 28 : 34,
          child: Text('$value', textAlign: TextAlign.center, style: VkText.ui(compact ? 13 : 14, weight: FontWeight.w600)),
        ),
        btn(Icons.add_rounded, value < max, () => onChanged(value + 1)),
      ]),
    );
  }
}

// ── States ───────────────────────────────────────────────────────────────────

/// Empty / offline / error states share one layout so they read as one app.
class StateView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? body;
  final String? cta;
  final VoidCallback? onCta;
  final String? secondary;
  final VoidCallback? onSecondary;
  const StateView({
    super.key,
    required this.icon,
    required this.title,
    this.body,
    this.cta,
    this.onCta,
    this.secondary,
    this.onSecondary,
  });

  /// The state for a failed request: offline copy for transport errors,
  /// generic copy for everything else. Raw API errors never reach the screen.
  factory StateView.error(Object? error, {required VoidCallback onRetry, String? title}) {
    final offline = error != null && isOffline(error);
    return StateView(
      icon: offline ? Icons.wifi_off_rounded : Icons.error_outline_rounded,
      title: title ?? (offline ? "You're offline" : 'Something went wrong'),
      body: offline ? 'Check your connection and try again.' : 'Please try again in a moment.',
      cta: 'Try again',
      onCta: onRetry,
    );
  }

  @override
  Widget build(BuildContext context) => Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(32, 32, 32, 48),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 76,
              height: 76,
              decoration: const BoxDecoration(color: VkColors.cream, shape: BoxShape.circle),
              child: Icon(icon, size: 32, color: VkColors.primary),
            ),
            const SizedBox(height: 18),
            Text(title, textAlign: TextAlign.center, style: VkText.display(24)),
            if (body != null) ...[
              const SizedBox(height: 8),
              Text(body!, textAlign: TextAlign.center, style: VkText.body(13.5, color: VkColors.muted, height: 1.55)),
            ],
            if (cta != null) ...[
              const SizedBox(height: 22),
              PrimaryButton(label: cta!, onTap: onCta, expanded: false, height: 46),
            ],
            if (secondary != null) ...[
              const SizedBox(height: 6),
              TextButton(onPressed: onSecondary, child: Text(secondary!, style: VkText.ui(12.5, color: VkColors.muted))),
            ],
          ]),
        ),
      );
}

// ── Skeleton loaders ─────────────────────────────────────────────────────────

/// Product-grid placeholder — same 2-up geometry as the real grid.
class ProductGridSkeleton extends StatelessWidget {
  final int count;
  final EdgeInsets padding;
  const ProductGridSkeleton({super.key, this.count = 4, this.padding = const EdgeInsets.fromLTRB(20, 14, 20, 14)});
  @override
  Widget build(BuildContext context) => LayoutBuilder(
        builder: (context, box) => GridView.builder(
          gridDelegate: productGridDelegate(context, box.maxWidth - padding.horizontal),
          padding: padding,
          physics: const NeverScrollableScrollPhysics(),
          shrinkWrap: true,
          itemCount: count,
          itemBuilder: (_, __) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
            AspectRatio(aspectRatio: 1, child: Skeleton(radius: VkRadii.md)),
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

/// Thumbnail + two lines, for order/notification style lists.
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
          if (thumb > 0) ...[Skeleton(width: thumb, height: thumb), const SizedBox(width: 12)],
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

// ── Price ────────────────────────────────────────────────────────────────────

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

  /// Adds "N% OFF" after the struck-through MRP. Opt-in.
  final bool showDiscount;
  const PriceRow({super.key, required this.value, this.mrp, this.size = 14, this.white = false, this.showDiscount = false});
  @override
  Widget build(BuildContext context) {
    final off = showDiscount ? discountPercent(value, mrp) : null;
    // Shrink rather than overflow on narrow tiles.
    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: Alignment.centerLeft,
      child: Row(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
        Text('₹${inr(value)}', style: VkText.ui(size, weight: FontWeight.w600, color: white ? Colors.white : VkColors.ink)),
        if (mrp != null && mrp! > value) ...[
          const SizedBox(width: 7),
          Text('₹${inr(mrp!)}',
              style: VkText.body(size * 0.74, color: white ? Colors.white54 : VkColors.muted2).copyWith(decoration: TextDecoration.lineThrough)),
        ],
        if (off != null) ...[
          const SizedBox(width: 7),
          Text('$off% OFF', style: VkText.ui(size * 0.72, weight: FontWeight.w700, color: white ? Colors.white : VkColors.leaf, letter: 0.04)),
        ],
      ]),
    );
  }
}

// ── Wishlist + cart actions ──────────────────────────────────────────────────

/// Toggles [product] in the shared wishlist, sending guests to sign in first
/// — every heart in the app routes through here, so one tap means one call.
Future<void> toggleWishlist(BuildContext context, Product product) async {
  if (!EcomAuth.I.isLoggedIn) {
    context.push('/login');
    return;
  }
  final variantId = product.variantId;
  if (variantId == null) {
    toast(context, 'This item can’t be saved right now');
    return;
  }
  try {
    final on = await Wishlist.I.toggle(variantId, product: product.source);
    if (context.mounted && on) {
      final router = GoRouter.of(context);
      toast(context, 'Saved to wishlist', icon: Icons.favorite_rounded, action: 'VIEW', onAction: () => router.push('/wishlist'));
    }
  } catch (e) {
    if (context.mounted) toast(context, ecomError(e, 'Could not update wishlist'));
  }
}

/// Adds one of [product]'s display variant to the cart from a card, with the
/// confirmation and the badge bounce. Returns whether anything was added.
bool quickAddToCart(BuildContext context, Product product) {
  final src = product.source;
  if (src == null) return false;
  final v = src.variants.where((x) => x.id == product.variantId).firstOrNull ?? src.displayVariant;
  if (v.id.isEmpty) return false;
  if (v.availableQty <= 0) {
    toast(context, 'Out of stock right now');
    return false;
  }
  final ok = EcomCart.I.add(CartItem.of(src, v));
  if (!ok) {
    toast(context, 'Only ${v.availableQty} left in stock');
    return false;
  }
  final router = GoRouter.of(context);
  toast(context, 'Added to cart', icon: Icons.check_circle_rounded, action: 'VIEW CART', onAction: () => router.go('/cart'));
  return true;
}

/// Heart button with the little pop when it fills.
class WishHeart extends StatelessWidget {
  final bool on;
  final VoidCallback? onTap;
  final double size;
  final bool onImage;
  const WishHeart({super.key, required this.on, this.onTap, this.size = 32, this.onImage = true});
  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        label: on ? 'Remove from wishlist' : 'Add to wishlist',
        child: GestureDetector(
          onTap: onTap,
          behavior: HitTestBehavior.opaque,
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: onImage ? VkColors.paper.withValues(alpha: 0.94) : VkColors.paper,
              shape: BoxShape.circle,
              border: onImage ? null : Border.all(color: VkColors.rule2),
              boxShadow: onImage ? [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 6, offset: const Offset(0, 2))] : null,
            ),
            child: TweenAnimationBuilder<double>(
              key: ValueKey(on),
              tween: Tween(begin: on ? 0.6 : 1.0, end: 1.0),
              duration: const Duration(milliseconds: 380),
              curve: Curves.elasticOut,
              builder: (_, s, child) => Transform.scale(scale: s, child: child),
              child: Icon(on ? Icons.favorite_rounded : Icons.favorite_outline_rounded,
                  size: size * 0.5, color: on ? VkColors.sale : VkColors.ink),
            ),
          ),
        ),
      );
}

/// Cart icon with a count that bounces whenever something is added.
class CartIconBadge extends StatefulWidget {
  final IconData icon;
  final Color color;
  final double size;
  const CartIconBadge({super.key, this.icon = Icons.shopping_bag_outlined, this.color = VkColors.ink, this.size = 22});
  @override
  State<CartIconBadge> createState() => _CartIconBadgeState();
}

class _CartIconBadgeState extends State<CartIconBadge> with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  late final Animation<double> _scale;
  int _seen = EcomCart.I.addEvents.value;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 420));
    _scale = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.35), weight: 40),
      TweenSequenceItem(tween: Tween(begin: 1.35, end: 1.0), weight: 60),
    ]).animate(CurvedAnimation(parent: _c, curve: Curves.easeOut));
    EcomCart.I.addEvents.addListener(_bump);
  }

  void _bump() {
    if (EcomCart.I.addEvents.value == _seen) return;
    _seen = EcomCart.I.addEvents.value;
    if (mounted) _c.forward(from: 0);
  }

  @override
  void dispose() {
    EcomCart.I.addEvents.removeListener(_bump);
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ValueListenableBuilder<List<CartItem>>(
        valueListenable: EcomCart.I.items,
        builder: (_, __, ___) {
          final n = EcomCart.I.count;
          return Stack(clipBehavior: Clip.none, alignment: Alignment.center, children: [
            Icon(widget.icon, size: widget.size, color: widget.color),
            if (n > 0)
              Positioned(
                top: -6,
                right: -9,
                child: ScaleTransition(
                  scale: _scale,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                    constraints: const BoxConstraints(minWidth: 17),
                    decoration: BoxDecoration(
                      color: VkColors.primary,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: VkColors.canvas, width: 1.5),
                    ),
                    child: Text(n > 99 ? '99+' : '$n',
                        textAlign: TextAlign.center, style: VkText.ui(9, weight: FontWeight.w700, color: Colors.white, letter: 0)),
                  ),
                ),
              ),
          ]);
        },
      );
}

// ── Product card ─────────────────────────────────────────────────────────────
// The card's text block is a fixed height so that every tile in a row is
// identical: with a flexible block the name wraps to one line on one card
// and two on its neighbour, and their prices land at different heights.

const double _kNameLineHeight = 1.3;
const double _kNameFontSize = 13;
const double _kCategoryFontSize = 9;
const double _kPriceFontSize = 14;

/// Height of everything below the image, at the current text scale.
double productCardTextHeight(BuildContext context) {
  final s = MediaQuery.textScalerOf(context);
  return 10 // gap under the image
      +
      s.scale(_kCategoryFontSize) * 1.4 // category
      +
      5 +
      s.scale(_kNameFontSize) * _kNameLineHeight * 2 // name, always two lines
      +
      7 +
      s.scale(_kPriceFontSize) * 1.45 // price row
      +
      // Slack for per-font ascent/descent rounding.
      4;
}

/// One grid geometry shared by every product grid, so Home, Shop, Search and
/// Wishlist can't drift apart. [gridWidth] is the width available to the grid.
SliverGridDelegateWithFixedCrossAxisCount productGridDelegate(
  BuildContext context,
  double gridWidth, {
  double spacing = 14,
}) {
  final tile = (gridWidth - spacing) / 2;
  return SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    mainAxisSpacing: spacing + 6,
    crossAxisSpacing: spacing,
    // Square image + the fixed text block.
    mainAxisExtent: tile + productCardTextHeight(context),
  );
}

/// The product card. Image, badges, wishlist, quick add, category, name,
/// price — the same everywhere a product appears.
class ProductCard extends StatelessWidget {
  final Product p;
  final VoidCallback? onTap;

  /// Leave null and the heart subscribes to [Wishlist] on its own; pass a
  /// value only where membership is already known (the wishlist screen).
  final bool? fav;
  final VoidCallback? onFav;

  /// Quick add-to-cart on the card. Null hides the button.
  final VoidCallback? onAdd;
  const ProductCard({super.key, required this.p, this.onTap, this.fav, this.onFav, this.onAdd});

  @override
  Widget build(BuildContext context) {
    final off = discountPercent(p.price, p.mrp);
    final scaler = MediaQuery.textScalerOf(context);
    return PressScale(
      onTap: onTap,
      scale: 0.98,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        AspectRatio(
          aspectRatio: 1,
          child: Stack(fit: StackFit.expand, children: [
            DecoratedBox(
              decoration: BoxDecoration(
                color: VkColors.paper,
                borderRadius: BorderRadius.circular(VkRadii.md),
                border: Border.all(color: VkColors.rule),
              ),
              child: Padding(padding: const EdgeInsets.all(1), child: ProductImage(p: p, radius: VkRadii.md - 1)),
            ),
            if (p.soldOut)
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: VkColors.canvas.withValues(alpha: 0.45),
                    borderRadius: BorderRadius.circular(VkRadii.md),
                  ),
                ),
              ),
            // Discount owns the top-left corner; NEW or the store's own label
            // takes the top-right so the two never collide.
            if (off != null)
              Positioned(left: 8, top: 8, child: VkBadge('$off% OFF', color: VkBrand.sale))
            else if (p.isNew)
              Positioned(left: 8, top: 8, child: VkBadge('New', color: VkColors.leaf)),
            if (p.soldOut)
              Positioned(
                left: 0,
                right: 0,
                bottom: 8,
                child: Center(child: VkBadge('Sold out', color: VkColors.soldOut)),
              ),
            if (onFav != null)
              Positioned(
                right: 6,
                top: 6,
                child: fav != null
                    ? WishHeart(on: fav!, onTap: onFav)
                    : ValueListenableBuilder<Set<String>>(
                        valueListenable: Wishlist.I.variantIds,
                        builder: (_, ids, __) => WishHeart(on: ids.contains(p.variantId), onTap: onFav),
                      ),
              ),
            if (onAdd != null && !p.soldOut)
              Positioned(
                right: 8,
                bottom: 8,
                child: _AddButton(onTap: onAdd!),
              ),
          ]),
        ),
        const SizedBox(height: 10),
        Text(p.category.toUpperCase(),
            maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.upper(_kCategoryFontSize, color: VkColors.muted2, letter: 0.12)),
        const SizedBox(height: 5),
        // Always two lines tall, so the price below lines up with the price on
        // the card beside it even when one name is short and the other wraps.
        SizedBox(
          height: scaler.scale(_kNameFontSize) * _kNameLineHeight * 2,
          child: Text(
            p.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: VkText.ui(_kNameFontSize, weight: FontWeight.w500).copyWith(height: _kNameLineHeight),
          ),
        ),
        const SizedBox(height: 7),
        PriceRow(value: p.price, mrp: p.mrp, size: _kPriceFontSize),
      ]),
    );
  }
}

/// Round quick-add button: a 44px burnt-saffron circle with a cart-plus icon.
/// After a tap it shows a tick for a moment, then returns to the cart icon.
class _AddButton extends StatefulWidget {
  final VoidCallback onTap;
  const _AddButton({required this.onTap});
  @override
  State<_AddButton> createState() => _AddButtonState();
}

class _AddButtonState extends State<_AddButton> {
  bool _pressed = false;
  bool _added = false;
  Timer? _reset;

  @override
  void dispose() {
    _reset?.cancel();
    super.dispose();
  }

  void _tap() {
    widget.onTap();
    _reset?.cancel();
    setState(() => _added = true);
    _reset = Timer(const Duration(milliseconds: 1400), () {
      if (mounted) setState(() => _added = false);
    });
  }

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        label: 'Add to cart',
        child: GestureDetector(
          onTapDown: (_) => setState(() => _pressed = true),
          onTapUp: (_) => setState(() => _pressed = false),
          onTapCancel: () => setState(() => _pressed = false),
          onTap: _tap,
          behavior: HitTestBehavior.opaque,
          child: AnimatedContainer(
            duration: VkMotion.fast,
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: _pressed ? VkColors.primaryDeep : VkColors.primary,
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: VkColors.primaryDeep.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4))],
            ),
            child: AnimatedSwitcher(
              duration: VkMotion.base,
              transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
              child: Icon(_added ? Icons.check_rounded : Icons.add_shopping_cart_rounded, key: ValueKey(_added), size: 20, color: Colors.white),
            ),
          ),
        ),
      );
}

/// A category as a round photograph with its name beneath — the same
/// treatment the website's Shop by Categories uses.
class CategoryTile extends StatelessWidget {
  final EcomCategory category;
  final VoidCallback onTap;
  final double width;
  const CategoryTile({super.key, required this.category, required this.onTap, this.width = 88});
  @override
  Widget build(BuildContext context) => PressScale(
        onTap: onTap,
        child: SizedBox(
          width: width,
          child: Column(children: [
            Container(
              width: width,
              height: width,
              decoration: BoxDecoration(
                color: VkColors.cream,
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: VkColors.ink.withValues(alpha: 0.08), blurRadius: 14, offset: const Offset(0, 6))],
              ),
              clipBehavior: Clip.antiAlias,
              child: NetImage(url: category.imageUrl, radius: 0, seed: paletteFor(category.slug), placeholderIcon: Icons.grass_rounded),
            ),
            const SizedBox(height: 9),
            Text(category.name,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: VkText.ui(11.5, weight: FontWeight.w600, height: 1.25)),
          ]),
        ),
      );
}
