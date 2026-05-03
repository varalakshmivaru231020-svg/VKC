import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/errors/failures.dart";
import "../../../core/routing/route_paths.dart";
import "../../../core/storage/local_prefs.dart";
import "../../../core/widgets/state_widgets.dart";
import "../../auth/data/auth_controller.dart";
import "../data/app_config_repository.dart";

/// Bootstraps the app on cold start:
/// 1. Fetches `/app-config` so theme + branding are ready.
/// 2. Restores the auth session if a token is stored.
/// 3. Routes to onboarding (first launch), login (logged out), or home.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  bool _navigated = false;

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);

    // Trigger auth bootstrap once we have config (or even in parallel — both are
    // independent). Using a listen so we don't kick off the work in build().
    ref.listen(appConfigProvider, (_, __) async {
      await ref.read(authControllerProvider.notifier).bootstrap();
      if (mounted) _maybeNavigate();
    });

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: config.when(
            loading: () => const _Branded(),
            error: (e, _) {
              final failure = e is Failure ? e : UnknownFailure(e.toString());
              return AppErrorView(
                failure: failure,
                onRetry: () => ref.invalidate(appConfigProvider),
              );
            },
            data: (_) => const _Branded(),
          ),
        ),
      ),
    );
  }

  void _maybeNavigate() {
    if (_navigated) return;
    final auth = ref.read(authControllerProvider);
    if (auth.initializing) return;

    final prefs = ref.read(localPrefsProvider);
    final String next;
    if (!prefs.onboardingComplete) {
      next = RoutePaths.onboarding;
    } else {
      next = RoutePaths.home; // Logged-in or guest both land on Home
    }
    _navigated = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.go(next);
    });
  }
}

class _Branded extends StatelessWidget {
  const _Branded();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          "Vijaylakshmi Sarees",
          style: Theme.of(context).textTheme.headlineSmall,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        const SizedBox(
          width: 28, height: 28,
          child: CircularProgressIndicator(strokeWidth: 2.5),
        ),
      ],
    );
  }
}
