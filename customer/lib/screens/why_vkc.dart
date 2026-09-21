import 'dart:math' as math;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../theme.dart';

/// The website's palette for this section, literal on purpose — the section has
/// to read as VKC green, sage and gold even though the rest of the app runs on
/// burnt jaggery.
class _W {
  static const green = Color(0xFF14432F);
  static const greenDeep = Color(0xFF0E3324);
  static const gold = Color(0xFFB9872A);
  static const eyebrow = Color(0xFFD9A100);
  static const goldBright = Color(0xFFF2B632);
  static const goldLite = Color(0xFFE9C46A);
  static const ivory = Color(0xFFFBF6EA);
  static const paper = Color(0xFFFFFDF8);
  static const line = Color(0xFFE6DFCC);
  static const iconWell = Color(0xFFEFEBDD);
  static const ink = Color(0xFF173526);
  static const ink2 = Color(0xFF55645A);
}

const _reasons = <({IconData icon, String title, String body})>[
  (icon: Icons.eco_outlined, title: '100% Natural & Chemical-Free Products', body: 'No chemicals, preservatives or artificial colours at any stage — just cane, heat and time.'),
  (icon: Icons.agriculture_outlined, title: 'Direct Farmer Partnerships', body: 'We buy straight from Mandya growers at fair prices, so more of every rupee reaches the field.'),
  (icon: Icons.factory_outlined, title: 'Sustainable & Modern Processing', body: 'Energy-efficient, high-recovery machinery paired with time-honoured jaggery know-how.'),
  (icon: Icons.verified_user_outlined, title: 'Trusted Since 1988', body: 'Three decades of purity and integrity, one batch at a time.'),
];

/// "Why choose vkcgoldikshu" — the same section as the website's home page:
/// the heading, the farmer, the four reasons (tap one to light it up), Read our
/// story, then the cane-fields story and the year it began.
///
/// The picture is the composition that ships with the app. A picture uploaded
/// in Admin → Banners at "Home — Why VKC centre image" replaces it, as on the
/// website: a transparent PNG/WebP stands free over the drawn circle; a JPEG,
/// which has a rectangular background, is held inside the circle instead.
class WhyVkcSection extends StatefulWidget {
  final String? imageUrl;
  final VoidCallback onReadStory;
  const WhyVkcSection({super.key, this.imageUrl, required this.onReadStory});
  @override
  State<WhyVkcSection> createState() => _WhyVkcSectionState();
}

class _WhyVkcSectionState extends State<WhyVkcSection> {
  int _active = 0;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [_W.paper, _W.ivory]),
      ),
      padding: const EdgeInsets.fromLTRB(20, 34, 20, 40),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('WHY VKC', style: VkText.upper(12, color: _W.eyebrow, letter: 0.22)),
            const SizedBox(height: 8),
            Semantics(
              header: true,
              child: Text.rich(
                TextSpan(children: const [
                  TextSpan(text: 'Why choose '),
                  TextSpan(text: 'vkcgoldikshu', style: TextStyle(fontStyle: FontStyle.italic)),
                ]),
                style: VkText.display(36, weight: FontWeight.w500, color: VkColors.ink, height: 1.08),
              ),
            ),
            const SizedBox(height: 22),
            Center(
              child: LayoutBuilder(builder: (context, box) {
                final w = math.min(box.maxWidth * 0.9, 330.0);
                return SizedBox(
                  width: w,
                  child: AspectRatio(
                    aspectRatio: widget.imageUrl == null ? 584 / 804 : 10 / 13,
                    child: Semantics(image: true, label: 'A Mandya sugarcane farmer holding freshly cut cane', child: _Portrait(url: widget.imageUrl)),
                  ),
                );
              }),
            ),
            const SizedBox(height: 22),
            for (var i = 0; i < _reasons.length; i++) ...[
              _ReasonCard(index: i, on: i == _active, onTap: () => setState(() => _active = i)),
              const SizedBox(height: 11),
            ],
            const SizedBox(height: 6),
            _ReadStory(onTap: widget.onReadStory),
            const SizedBox(height: 34),
            const _LeafRule(maxWidth: 270),
            const SizedBox(height: 18),
            Text('From the Cane Fields to Your Family.', style: VkText.display(30, weight: FontWeight.w500, color: VkColors.ink, height: 1.12)),
            const SizedBox(height: 12),
            Text(
              'At VKC Gold Ikshu, we preserve the goodness of naturally grown sugarcane through careful processing and time-honoured craftsmanship. From our roots in Mandya to your home, every product is created with purity, care and consistency.',
              style: VkText.body(14.5, color: VkColors.muted, height: 1.7),
            ),
            const SizedBox(height: 28),
            const _YearMark(),
          ]),
        ),
      ),
    );
  }
}

/// The farmer: bundled by default, replaceable from the admin panel.
class _Portrait extends StatelessWidget {
  final String? url;
  const _Portrait({this.url});

  static const _asset = 'assets/brand/why-farmer.webp';
  static final _jpeg = RegExp(r'\.jpe?g(\?.*)?$', caseSensitive: false);

  @override
  Widget build(BuildContext context) {
    final bundled = Image.asset(_asset, fit: BoxFit.contain, filterQuality: FilterQuality.medium);
    final u = url;
    if (u == null || u.isEmpty) return bundled;
    final photo = _jpeg.hasMatch(u);
    return LayoutBuilder(builder: (context, box) {
      final w = box.maxWidth, h = box.maxHeight;
      final image = CachedNetworkImage(
        imageUrl: u,
        fit: photo ? BoxFit.cover : BoxFit.contain,
        alignment: photo ? Alignment.topCenter : Alignment.bottomCenter,
        fadeInDuration: VkMotion.base,
        placeholder: (_, __) => const SizedBox.shrink(),
        // A dead upload must never leave the section without its picture.
        errorWidget: (_, __, ___) => bundled,
      );
      return Stack(fit: StackFit.expand, children: [
        CustomPaint(painter: _CirclePainter()),
        if (photo)
          Positioned(left: w * 0.08, top: h * 0.20, width: w * 0.84, height: h * 0.66, child: ClipOval(child: image))
        else
          Positioned.fill(child: image),
      ]);
    });
  }
}

/// The rough watercolour circle and the gold brush stroke, in the website's
/// 500 x 650 drawing space.
class _CirclePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 500, size.height / 650);
    const c = Offset(250, 350);
    canvas.drawCircle(c, 246, Paint()..style = PaintingStyle.stroke..strokeWidth = 9..color = const Color(0xBFC3D8AE));
    final r = Rect.fromCircle(center: c, radius: 226);
    canvas.drawCircle(
      c,
      226,
      Paint()
        ..shader = const RadialGradient(
          center: Alignment(0, -0.16),
          radius: 0.95,
          colors: [Color(0xFFEEF4E2), Color(0xFFD6E5C6), Color(0xFFBDD3A6)],
          stops: [0, 0.65, 1],
        ).createShader(r),
    );
    final brush = Paint()..style = PaintingStyle.stroke..strokeCap = StrokeCap.round..color = _W.goldBright;
    canvas.drawPath(Path()..moveTo(300, 590)..cubicTo(360, 560, 420, 500, 462, 420), brush..strokeWidth = 46);
    canvas.drawPath(Path()..moveTo(120, 600)..cubicTo(150, 590, 180, 575, 205, 556), brush..strokeWidth = 14);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

/// One reason. Green and lit when active, white otherwise; the number rides
/// above the title so the words get the width.
class _ReasonCard extends StatelessWidget {
  final int index;
  final bool on;
  final VoidCallback onTap;
  const _ReasonCard({required this.index, required this.on, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final r = _reasons[index];
    return Semantics(
      button: true,
      selected: on,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
        decoration: BoxDecoration(
          gradient: on ? const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [_W.green, _W.greenDeep]) : null,
          color: on ? null : const Color(0xE6FFFDF8),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: on ? _W.green : _W.line),
          boxShadow: [
            BoxShadow(color: (on ? _W.greenDeep : _W.green).withValues(alpha: on ? 0.42 : 0.14), blurRadius: on ? 22 : 12, offset: Offset(0, on ? 12 : 6), spreadRadius: -8),
          ],
        ),
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 320),
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(shape: BoxShape.circle, color: on ? Colors.white.withValues(alpha: 0.13) : _W.iconWell),
                  child: Icon(r.icon, size: 20, color: on ? const Color(0xFFF4F7EE) : _W.green),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('0${index + 1}', style: VkText.body(11, weight: FontWeight.w500, color: on ? _W.goldLite : _W.gold, height: 1).copyWith(letterSpacing: 1.6)),
                    const SizedBox(height: 5),
                    Text(r.title, style: VkText.body(14.5, weight: FontWeight.w600, color: on ? Colors.white : _W.ink, height: 1.25)),
                    const SizedBox(height: 4),
                    Text(r.body, style: VkText.body(12, color: on ? Colors.white.withValues(alpha: 0.82) : _W.ink2, height: 1.45)),
                  ]),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

class _ReadStory extends StatelessWidget {
  final VoidCallback onTap;
  const _ReadStory({required this.onTap});
  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 48),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Text('Read our story', style: VkText.body(15, color: _W.gold).copyWith(decoration: TextDecoration.underline, decorationColor: _W.gold, decorationThickness: 1)),
              const SizedBox(width: 12),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: _W.gold, width: 1.5)),
                child: const Icon(Icons.arrow_forward_rounded, size: 16, color: _W.gold),
              ),
            ]),
          ),
        ),
      );
}

/// A line, a leaf, a line.
class _LeafRule extends StatelessWidget {
  final double maxWidth;
  const _LeafRule({required this.maxWidth});
  @override
  Widget build(BuildContext context) => ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: Row(children: [
          Expanded(child: Container(height: 1, color: _W.gold)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Transform.rotate(angle: -0.21, child: const Icon(Icons.eco_outlined, size: 24, color: _W.green)),
          ),
          Expanded(child: Container(height: 1, color: _W.gold)),
        ]),
      );
}

/// A large, faint 1988 with TRUSTED SINCE across it and a leaf rule beneath.
class _YearMark extends StatelessWidget {
  const _YearMark();
  @override
  Widget build(BuildContext context) => Align(
        alignment: Alignment.centerLeft,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 300),
          child: Column(children: [
            Stack(alignment: Alignment.center, children: [
              Text('1988', style: VkText.display(92, weight: FontWeight.w700, color: _W.goldLite.withValues(alpha: 0.42), height: 0.9)),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Container(width: 18, height: 1, color: _W.gold),
                  const SizedBox(width: 12),
                  Text('TRUSTED SINCE', style: VkText.body(12.5, color: VkColors.ink).copyWith(letterSpacing: 3.4)),
                  const SizedBox(width: 12),
                  Container(width: 18, height: 1, color: _W.gold),
                ]),
              ),
            ]),
            const SizedBox(height: 8),
            const _LeafRule(maxWidth: 190),
          ]),
        ),
      );
}
