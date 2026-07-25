import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../routing/route_paths.dart";
import "../../features/cart/data/cart_controller.dart";

/// Bottom-nav shell host. The `child` is the active branch's page, provided
/// by go_router's StatefulShellRoute.
class MainShell extends ConsumerWidget {
  const MainShell({super.key, required this.navigationShell});
  final StatefulNavigationShell navigationShell;

  static const _tabs = [
    _Tab(label: "Home",     icon: Icons.home_outlined,         active: Icons.home_rounded,         path: RoutePaths.home),
    _Tab(label: "Shop",     icon: Icons.storefront_outlined,   active: Icons.storefront_rounded,   path: RoutePaths.shop),
    _Tab(label: "Wishlist", icon: Icons.favorite_outline,      active: Icons.favorite,             path: RoutePaths.wishlist),
    _Tab(label: "Cart",     icon: Icons.shopping_bag_outlined, active: Icons.shopping_bag_rounded, path: RoutePaths.cart),
    _Tab(label: "Account",  icon: Icons.person_outline,        active: Icons.person,               path: RoutePaths.account),
  ];

  static const _cartTabIndex = 3;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartCount = ref.watch(cartCountProvider);

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (i) => navigationShell.goBranch(i, initialLocation: i == navigationShell.currentIndex),
        items: [
          for (var i = 0; i < _tabs.length; i++)
            BottomNavigationBarItem(
              icon: _badged(Icon(_tabs[i].icon),  showCount: i == _cartTabIndex && cartCount > 0, count: cartCount),
              activeIcon: _badged(Icon(_tabs[i].active), showCount: i == _cartTabIndex && cartCount > 0, count: cartCount),
              label: _tabs[i].label,
            ),
        ],
      ),
    );
  }

  Widget _badged(Icon icon, {required bool showCount, required int count}) {
    if (!showCount) return icon;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        icon,
        Positioned(
          right: -6, top: -4,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
            decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(8)),
            constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
            child: Text(
              count > 99 ? "99+" : "$count",
              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ],
    );
  }
}

class _Tab {
  final String label, path;
  final IconData icon, active;
  const _Tab({required this.label, required this.icon, required this.active, required this.path});
}
