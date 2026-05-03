import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:smooth_page_indicator/smooth_page_indicator.dart";

import "../../../core/routing/route_paths.dart";
import "../../../core/storage/local_prefs.dart";
import "../../../core/theme/theme_extension.dart";

class _Slide {
  final IconData icon;
  final String title;
  final String body;
  const _Slide({required this.icon, required this.title, required this.body});
}

const _slides = [
  _Slide(
    icon: Icons.local_florist_rounded,
    title: "Curated for the modern woman",
    body: "Handwoven sarees from across India — Kanjivaram, Banarasi, Patola, Chanderi, and more.",
  ),
  _Slide(
    icon: Icons.verified_rounded,
    title: "100% genuine, direct from weavers",
    body: "Every saree is sourced from authentic weaver families and quality-checked before despatch.",
  ),
  _Slide(
    icon: Icons.local_shipping_rounded,
    title: "Fast, free shipping",
    body: "Free shipping above ₹2,999 across India and easy 7-day returns on every order.",
  ),
];

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await ref.read(localPrefsProvider).setOnboardingComplete(true);
    if (!mounted) return;
    context.go(RoutePaths.home);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLast = _index == _slides.length - 1;
    final colors = context.appColors;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Skip
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _finish,
                child: const Text("Skip"),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (_, i) {
                  final s = _slides[i];
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(32, 24, 32, 24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 140, height: 140,
                          decoration: BoxDecoration(
                            color: colors.primary50,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(s.icon, size: 64, color: theme.colorScheme.primary),
                        ),
                        const SizedBox(height: 40),
                        Text(s.title,
                            textAlign: TextAlign.center,
                            style: theme.textTheme.headlineSmall),
                        const SizedBox(height: 16),
                        Text(s.body,
                            textAlign: TextAlign.center,
                            style: theme.textTheme.bodyMedium?.copyWith(color: colors.textMuted)),
                      ],
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
            SmoothPageIndicator(
              controller: _controller,
              count: _slides.length,
              effect: ExpandingDotsEffect(
                activeDotColor: theme.colorScheme.primary,
                dotColor: colors.parchment,
                dotHeight: 8, dotWidth: 8,
                expansionFactor: 3,
              ),
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (isLast) {
                      _finish();
                    } else {
                      _controller.nextPage(
                        duration: const Duration(milliseconds: 280),
                        curve: Curves.easeInOut,
                      );
                    }
                  },
                  child: Text(isLast ? "Get started" : "Next"),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
