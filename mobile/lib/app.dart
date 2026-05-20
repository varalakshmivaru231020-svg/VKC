import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "core/network/connectivity_service.dart";
import "core/routing/app_router.dart";
import "core/theme/app_theme.dart";
import "features/splash/data/app_config_repository.dart";

/// Root widget. Theme is built dynamically from `AppConfig` once it loads;
/// before that we render with the default brand tokens so the splash screen
/// already looks on-brand.
class VijaylakshmiApp extends ConsumerWidget {
  const VijaylakshmiApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(goRouterProvider);
    final configAsync = ref.watch(appConfigProvider);

    final theme = configAsync.maybeWhen(
      data: (cfg) => AppThemeBuilder.build(
        colors:      cfg.theme.colors,
        headingFont: cfg.theme.headingFont,
        bodyFont:    cfg.theme.bodyFont,
      ),
      orElse: () => AppThemeBuilder.build(),
    );

    return MaterialApp.router(
      title: configAsync.asData?.value.site.name ?? "Vijaylakshmi Sarees",
      debugShowCheckedModeBanner: false,
      theme: theme,
      routerConfig: router,
      builder: (context, child) => _ConnectivityOverlay(child: child ?? const SizedBox.shrink()),
    );
  }
}

/// Renders an offline banner at the bottom whenever the device loses
/// connectivity. Sits above any sticky bottom-nav from the route.
class _ConnectivityOverlay extends ConsumerWidget {
  const _ConnectivityOverlay({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(connectivityStatusProvider);
    final offline = status.maybeWhen(data: (s) => s == NetStatus.offline, orElse: () => false);

    return Stack(
      children: [
        child,
        if (offline)
          Positioned(
            left: 0, right: 0, bottom: 0,
            child: SafeArea(
              child: Container(
                color: Colors.black87,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                child: const Row(
                  children: [
                    Icon(Icons.wifi_off_rounded, color: Colors.white, size: 16),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text("You're offline — some features may not work",
                          style: TextStyle(color: Colors.white, fontSize: 12)),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
