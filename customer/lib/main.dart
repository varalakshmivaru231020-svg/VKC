import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import 'ecom/ecom_api.dart';
import 'ecom/ecom_cart.dart';
import 'ecom/ecom_config.dart';
import 'ecom/ecom_wishlist.dart';
import 'ecom/recent_searches.dart';
import 'screens/address_screens.dart';
import 'screens/auth_screens.dart';
import 'screens/cart_screens.dart';
import 'screens/categories_screen.dart';
import 'screens/content_screens.dart';
import 'screens/ecom_order_detail_screen.dart';
import 'screens/gallery_screen.dart';
import 'screens/home_screen.dart';
import 'screens/invoice_screen.dart';
import 'screens/orders_screen.dart';
import 'screens/product_detail_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/profile_screens.dart';
import 'screens/search_screen.dart';
import 'screens/shop_screen.dart';
import 'screens/track_order_screen.dart';
import 'screens/wishlist_screen.dart';
import 'theme.dart';
import 'widgets.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    systemNavigationBarColor: VkColors.paper,
    systemNavigationBarIconBrightness: Brightness.dark,
  ));
  // Nothing is awaited: the app opens on Home immediately and every screen
  // draws from its own loading state while these land in the background.
  _bootstrap();
  runApp(const VkcApp());
}

Future<void> _bootstrap() async {
  // The basket and search history live on the phone.
  EcomCart.I.load();
  RecentSearches.I.load();
  // A restored session brings its wishlist with it, so hearts are already
  // filled in on the first screen the customer sees; the local basket is
  // mirrored up to the account.
  EcomAuth.I.load().then((_) {
    Wishlist.I.loadQuietly();
    EcomCart.I.syncNow();
  });
  // Home's catalogue fetch starts now so the first paint is usually from
  // memory rather than the network.
  HomeRepo.I.prewarm();
  _loadPaymentMethods();
  // /app-config carries shipping rates, contact details and legal links.
  // Retry a few times with backoff so a transient hiccup doesn't cost the
  // session the store's real numbers.
  for (var attempt = 0; attempt < 3; attempt++) {
    final cfg = await EcomApi.I.appConfig();
    if (cfg != null && cfg.isNotEmpty) {
      storeConfig.value = StoreConfig(cfg);
      return;
    }
    await Future<void>.delayed(Duration(milliseconds: 800 * (attempt + 1)));
  }
}

Future<void> _loadPaymentMethods() async {
  try {
    paymentMethods.value = await EcomApi.I.paymentMethods();
  } catch (_) {
    // Checkout re-reads it; a failure here just means no early answer.
  }
}

final _rootKey = GlobalKey<NavigatorState>();

/// Tab roots. Anything else is a full-screen page pushed over the shell.
const shellRoutes = {'/home', '/categories', '/shop', '/cart', '/profile'};

final _router = GoRouter(
  navigatorKey: _rootKey,
  // The app opens on Home. There is no splash route, no onboarding and no
  // login gate — a first launch and the hundredth look the same.
  initialLocation: '/home',
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, shell) => AppShell(shell: shell),
      branches: [
        StatefulShellBranch(routes: [GoRoute(path: '/home', builder: (_, __) => const HomeScreen())]),
        StatefulShellBranch(routes: [GoRoute(path: '/categories', builder: (_, __) => const CategoriesScreen())]),
        StatefulShellBranch(routes: [GoRoute(path: '/shop', builder: (_, __) => const ShopScreen())]),
        StatefulShellBranch(routes: [GoRoute(path: '/cart', builder: (_, __) => const CartScreen())]),
        StatefulShellBranch(routes: [GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen())]),
      ],
    ),
    // ── Full-screen pages (root navigator, no bottom nav) ────────────────
    GoRoute(path: '/login', parentNavigatorKey: _rootKey, builder: (_, __) => const LoginScreen()),
    GoRoute(
      path: '/search',
      parentNavigatorKey: _rootKey,
      builder: (_, s) => SearchScreen(initialQuery: s.uri.queryParameters['q']),
    ),
    GoRoute(
      path: '/listing',
      parentNavigatorKey: _rootKey,
      builder: (_, s) => ListingScreen(
        cat: s.uri.queryParameters['cat'],
        q: s.uri.queryParameters['q'],
        featured: s.uri.queryParameters['featured'] == '1',
        title: s.uri.queryParameters['title'],
      ),
    ),
    GoRoute(path: '/product/:id', parentNavigatorKey: _rootKey, builder: (_, s) => ProductScreen(id: s.pathParameters['id']!)),
    GoRoute(path: '/wishlist', parentNavigatorKey: _rootKey, builder: (_, __) => const WishlistScreen()),
    GoRoute(path: '/notifications', parentNavigatorKey: _rootKey, builder: (_, __) => const NotificationsScreen()),
    // Orders + invoice (auth)
    GoRoute(path: '/orders', parentNavigatorKey: _rootKey, builder: (_, __) => const OrdersScreen()),
    GoRoute(path: '/orders/:id', parentNavigatorKey: _rootKey, builder: (_, s) => EcomOrderDetailScreen(id: s.pathParameters['id']!)),
    GoRoute(path: '/orders/:id/invoice', parentNavigatorKey: _rootKey, builder: (_, s) => InvoiceScreen(orderId: s.pathParameters['id']!)),
    // Public order tracking by order number (no sign-in)
    GoRoute(
      path: '/track-order',
      parentNavigatorKey: _rootKey,
      builder: (_, s) => TrackOrderScreen(orderNumber: s.uri.queryParameters['order']),
    ),
    // Account
    GoRoute(path: '/addresses', parentNavigatorKey: _rootKey, builder: (_, __) => const AddressBookScreen()),
    GoRoute(path: '/account/edit', parentNavigatorKey: _rootKey, builder: (_, __) => const EditProfileScreen()),
    // Editorial + store pages
    GoRoute(path: '/journal', parentNavigatorKey: _rootKey, builder: (_, __) => const BlogListScreen()),
    GoRoute(path: '/journal/:slug', parentNavigatorKey: _rootKey, builder: (_, s) => BlogDetailScreen(slug: s.pathParameters['slug']!)),
    GoRoute(path: '/gallery', parentNavigatorKey: _rootKey, builder: (_, __) => const GalleryScreen()),
    // About Us and Leadership are the website's own pages, shown in-app so the
    // story reads exactly as it does on vkcgoldikshu.com and is edited once.
    GoRoute(path: '/about', parentNavigatorKey: _rootKey, builder: (_, __) => const WebPageScreen(title: 'About Us', path: '/about')),
    GoRoute(path: '/leadership', parentNavigatorKey: _rootKey, builder: (_, __) => const WebPageScreen(title: 'Leadership', path: '/leadership')),
    GoRoute(path: '/contact', parentNavigatorKey: _rootKey, builder: (_, __) => const ContactScreen()),
    GoRoute(
      path: '/pages/:page',
      parentNavigatorKey: _rootKey,
      builder: (_, s) => WebPageScreen(
        title: s.uri.queryParameters['title'] ?? 'VKC Gold Ikshu',
        path: '/${s.pathParameters['page']}',
      ),
    ),
    // Checkout flow
    GoRoute(path: '/checkout', parentNavigatorKey: _rootKey, builder: (_, __) => const CheckoutScreen()),
    GoRoute(
      path: '/order-success',
      parentNavigatorKey: _rootKey,
      builder: (_, s) => OrderSuccessScreen(orderNumber: s.uri.queryParameters['order'] ?? ''),
    ),
  ],
);

class VkcApp extends StatelessWidget {
  const VkcApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp.router(
        title: 'VKC Gold Ikshu',
        debugShowCheckedModeBanner: false,
        theme: vkTheme(),
        routerConfig: _router,
        builder: (context, child) => MediaQuery(
          // Respect the system font size but cap it so the layout holds.
          data: MediaQuery.of(context).copyWith(
            textScaler: MediaQuery.textScalerOf(context).clamp(minScaleFactor: 0.9, maxScaleFactor: 1.3),
          ),
          child: child ?? const SizedBox.shrink(),
        ),
      );
}

/// The five-tab shell. Each tab keeps its own navigation state and scroll
/// position; the system back button returns to Home before leaving the app.
class AppShell extends StatelessWidget {
  final StatefulNavigationShell shell;
  const AppShell({super.key, required this.shell});

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: shell.currentIndex == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) shell.goBranch(0);
      },
      child: Scaffold(
        backgroundColor: VkColors.canvas,
        body: SafeArea(bottom: false, child: shell),
        bottomNavigationBar: VkBottomNav(
          index: shell.currentIndex,
          onSelect: (i) => shell.goBranch(i, initialLocation: i == shell.currentIndex),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon, active;
  final String label;
  const _NavItem(this.icon, this.active, this.label);
}

const _navItems = [
  _NavItem(Icons.home_outlined, Icons.home_rounded, 'Home'),
  _NavItem(Icons.grid_view_outlined, Icons.grid_view_rounded, 'Categories'),
  _NavItem(Icons.storefront_outlined, Icons.storefront_rounded, 'Shop'),
  _NavItem(Icons.shopping_bag_outlined, Icons.shopping_bag_rounded, 'Cart'),
  _NavItem(Icons.person_outline_rounded, Icons.person_rounded, 'Profile'),
];

/// Home | Categories | Shop | Cart | Profile.
class VkBottomNav extends StatelessWidget {
  final int index;
  final ValueChanged<int> onSelect;
  const VkBottomNav({super.key, required this.index, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: VkColors.paper,
        border: const Border(top: BorderSide(color: VkColors.rule)),
        boxShadow: [BoxShadow(color: VkColors.ink.withValues(alpha: 0.05), blurRadius: 14, offset: const Offset(0, -4))],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 62,
          child: Row(children: [
            for (var i = 0; i < _navItems.length; i++) Expanded(child: _tab(context, i)),
          ]),
        ),
      ),
    );
  }

  Widget _tab(BuildContext context, int i) {
    final item = _navItems[i];
    final active = index == i;
    final color = active ? VkColors.primary : VkColors.muted;
    final Widget icon = i == 3
        ? CartIconBadge(icon: active ? item.active : item.icon, color: color, size: 23)
        : Icon(active ? item.active : item.icon, size: 23, color: color);
    return Semantics(
      button: true,
      selected: active,
      label: item.label,
      child: InkResponse(
        onTap: () => onSelect(i),
        radius: 34,
        highlightShape: BoxShape.rectangle,
        containedInkWell: true,
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          AnimatedContainer(
            duration: VkMotion.base,
            curve: VkMotion.curve,
            width: active ? 44 : 32,
            height: 28,
            decoration: BoxDecoration(
              color: active ? VkColors.primarySoft : Colors.transparent,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Center(
              child: AnimatedSwitcher(
                duration: VkMotion.base,
                transitionBuilder: (c, a) => ScaleTransition(scale: Tween(begin: 0.85, end: 1.0).animate(a), child: FadeTransition(opacity: a, child: c)),
                child: KeyedSubtree(key: ValueKey(active), child: icon),
              ),
            ),
          ),
          const SizedBox(height: 3),
          Text(item.label,
              style: VkText.ui(10, weight: active ? FontWeight.w600 : FontWeight.w500, color: color, letter: 0.02)),
        ]),
      ),
    );
  }
}
