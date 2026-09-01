import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'theme.dart';
import 'screens/live_list_screen.dart';
import 'screens/live_stream_screen.dart';
import 'screens/orders_screen.dart';
import 'screens/order_tracking_screen.dart';
import 'screens/ecom_order_detail_screen.dart';
import 'screens/account_screens.dart';
import 'screens/shop_screens.dart';
import 'screens/product_screens.dart';
import 'screens/product_detail_screen.dart';
import 'screens/cart_screens.dart';
import 'widgets.dart';
import 'screens/address_screens.dart';
import 'screens/invoice_screen.dart';
import 'screens/profile_screens.dart';
import 'screens/content_screens.dart';
import 'screens/track_order_screen.dart';
import 'screens/auth_screens.dart';
import 'ecom/ecom_api.dart';
import 'ecom/ecom_cart.dart';
import 'ecom/ecom_config.dart';
import 'ecom/ecom_wishlist.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Last known store palette, straight from disk, before the first frame — so
  // the app never opens in the shipped defaults and then changes colour.
  await loadCachedTheme();
  // Pull the store's admin theme + persisted auth in the background; the splash
  // (2.4s) covers the fetch, and the app rebuilds via themeVersion when applied.
  _bootstrap();
  runApp(const VkcApp());
}

Future<void> _loadPaymentMethods() async {
  try {
    paymentMethods.value = await EcomApi.I.paymentMethods();
  } catch (_) {
    // Checkout re-reads it; a failure here just means no early answer.
  }
}

Future<void> _bootstrap() async {
  // A restored session brings its wishlist with it, so hearts are already
  // filled in on the first screen the customer sees.
  EcomAuth.I.load().then((_) => Wishlist.I.loadQuietly());
  // Home's catalogue, categories and banner, fetched under the splash instead
  // of after it — the splash is dead time the network may as well use.
  prewarmHome();
  // The store's enabled payment methods, from the same endpoint the website
  // checkout reads, so nothing advertises a method the admin has switched off.
  _loadPaymentMethods();
  // /app-config is fetched once at launch; a single failed or slow call used to
  // leave the store on the default palette for the whole session. Retry a few
  // times with backoff so a transient hiccup doesn't cost the admin theme.
  for (var attempt = 0; attempt < 3; attempt++) {
    final cfg = await EcomApi.I.appConfig();
    if (cfg != null && cfg.isNotEmpty) {
      // Shipping rates, payment availability and the contact block all come
      // from the same document — publish it before theming so screens built
      // during the splash already read the store's real numbers.
      storeConfig.value = StoreConfig(cfg);
    }
    final theme = (cfg?['theme'] as Map?)?.cast<String, dynamic>();
    final colors = (theme?['colors'] as Map?)?.cast<String, dynamic>();
    if (colors != null && colors.isNotEmpty) {
      applyAdminTheme(colors);
      return;
    }
    await Future<void>.delayed(Duration(milliseconds: 800 * (attempt + 1)));
  }
}

final _router = GoRouter(
  initialLocation: '/splash',
  routes: [
    // Onboarding + auth (full-screen, no bottom nav)
    GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
    GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    ShellRoute(
      builder: (context, state, child) => _Shell(location: state.uri.path, child: child),
      routes: [
        GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/shop', builder: (_, __) => const CategoryScreen()),
        GoRoute(path: '/live', builder: (_, __) => const LiveListScreen()),
        GoRoute(path: '/cart', builder: (_, __) => const CartScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        GoRoute(path: '/orders', builder: (_, __) => const OrdersScreen()),
        GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
        GoRoute(path: '/wishlist', builder: (_, __) => const WishlistScreen()),
      ],
    ),
    // Full-screen live view (no bottom nav)
    GoRoute(path: '/live/:id', builder: (_, s) => LiveStreamScreen(liveId: s.pathParameters['id']!)),
    // Ecom order detail + invoice (auth)
    GoRoute(path: '/orders/:id', builder: (_, s) => EcomOrderDetailScreen(id: s.pathParameters['id']!)),
    GoRoute(path: '/orders/:id/invoice', builder: (_, s) => InvoiceScreen(orderId: s.pathParameters['id']!)),
    // Public order tracking by order number (no sign-in)
    GoRoute(
      path: '/track-order',
      builder: (_, s) => TrackOrderScreen(orderNumber: s.uri.queryParameters['order']),
    ),
    // Live-order tracking (VL Group, phone-gated) — separate path to avoid
    // colliding with the ecom /orders/:id route.
    GoRoute(
      path: '/live-order/:orderNumber',
      builder: (_, s) => OrderTrackingScreen(
        orderNumber: s.pathParameters['orderNumber']!,
        phone: s.uri.queryParameters['phone'] ?? '',
      ),
    ),
    // Product listing + detail (full-screen, own sticky bars)
    GoRoute(
      path: '/listing',
      builder: (_, s) => ListingScreen(
        cat: s.uri.queryParameters['cat'],
        q: s.uri.queryParameters['q'],
        autofocus: s.uri.queryParameters['focus'] == '1',
        featured: s.uri.queryParameters['featured'] == '1',
      ),
    ),
    GoRoute(path: '/product/:id', builder: (_, s) => ProductScreen(id: s.pathParameters['id']!)),
    // Address book (full-screen; pushed from Profile and from checkout)
    GoRoute(path: '/addresses', builder: (_, __) => const AddressBookScreen()),
    // Account pages pushed from Profile
    GoRoute(path: '/profile/edit', builder: (_, __) => const EditProfileScreen()),
    GoRoute(path: '/wallet', builder: (_, __) => const WalletScreen()),
    GoRoute(path: '/reviews', builder: (_, __) => const ReviewsScreen()),
    // Editorial + store pages
    GoRoute(path: '/journal', builder: (_, __) => const BlogListScreen()),
    GoRoute(path: '/journal/:slug', builder: (_, s) => BlogDetailScreen(slug: s.pathParameters['slug']!)),
    GoRoute(path: '/about', builder: (_, __) => const AboutScreen()),
    GoRoute(path: '/contact', builder: (_, __) => const ContactScreen()),
    GoRoute(path: '/video-booking', builder: (_, __) => const VideoBookingScreen()),
    // Website pages the mobile API doesn't serve (gallery, stories, policies)
    GoRoute(
      path: '/pages/:page',
      builder: (_, s) => WebPageScreen(
        title: s.uri.queryParameters['title'] ?? 'VKC Gold',
        path: '/${s.pathParameters['page']}',
      ),
    ),
    // Checkout flow (full-screen)
    GoRoute(path: '/checkout', builder: (_, __) => const CheckoutScreen()),
    GoRoute(path: '/order-success', builder: (_, s) => OrderSuccessScreen(orderNumber: s.uri.queryParameters['order'] ?? '')),
  ],
);

class VkcApp extends StatelessWidget {
  const VkcApp({super.key});
  @override
  Widget build(BuildContext context) => ValueListenableBuilder<int>(
        valueListenable: themeVersion,
        builder: (context, _, __) => MaterialApp.router(
          title: 'VKC Gold',
          debugShowCheckedModeBanner: false,
          theme: vlTheme(),
          routerConfig: _router,
        ),
      );
}

class _Shell extends StatelessWidget {
  final Widget child;
  final String location;
  const _Shell({required this.child, required this.location});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VlColors.canvas,
      // Keep every bottom-nav screen below the status bar/notch (the bottom
      // inset is handled by the nav bar itself).
      body: SafeArea(bottom: false, child: child),
      // Video Shopping is one tap from anywhere in the shell. Cart is the one
      // exception — its sticky CHECKOUT bar owns the bottom of the screen.
      floatingActionButton: location == '/cart' ? null : const VideoCallFab(),
      bottomNavigationBar: _BottomNav(location: location),
    );
  }
}

/// Bottom nav with the center red Live FAB (ports BottomNav).
class _BottomNav extends StatelessWidget {
  final String location;
  const _BottomNav({required this.location});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(color: VlColors.paper, border: Border(top: BorderSide(color: VlColors.rule))),
      child: SafeArea(
        top: false,
        child: SizedBox(
          // Tall enough for the center Live FAB column (54 circle + 4 gap +
          // label); Transform.translate lifts it visually but it still has to
          // fit the row's height.
          height: 74,
          child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            _item(context, Icons.home_outlined, 'Home', '/home'),
            _item(context, Icons.grid_view_outlined, 'Shop', '/shop'),
            _liveFab(context),
            _item(context, Icons.shopping_bag_outlined, 'Cart', '/cart', badge: true),
            _item(context, Icons.person_outline, 'Profile', '/profile'),
          ]),
        ),
      ),
    );
  }

  Widget _item(BuildContext context, IconData ic, String label, String path, {bool badge = false}) {
    final active = location == path;
    return Expanded(
      child: InkResponse(
        onTap: () => context.go(path),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            badge
                ? ValueListenableBuilder(
                    valueListenable: EcomCart.I.items,
                    builder: (context, _, __) {
                      final n = EcomCart.I.count;
                      return Stack(clipBehavior: Clip.none, children: [
                        Icon(ic, size: 22, color: active ? VlColors.red : VlColors.muted),
                        if (n > 0)
                          Positioned(
                            top: -5,
                            right: -8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(999)),
                              constraints: const BoxConstraints(minWidth: 16),
                              child: Text('$n', textAlign: TextAlign.center, style: VlText.ui(9, weight: FontWeight.w700, color: Colors.white)),
                            ),
                          ),
                      ]);
                    },
                  )
                : Icon(ic, size: 22, color: active ? VlColors.red : VlColors.muted),
            const SizedBox(height: 4),
            Text(label,
                style: VlText.ui(10,
                    weight: active ? FontWeight.w600 : FontWeight.w400,
                    color: active ? VlColors.red : VlColors.muted,
                    letter: 0.08)),
            const SizedBox(height: 2),
            Container(width: 4, height: 4, decoration: BoxDecoration(color: active ? VlColors.red : Colors.transparent, shape: BoxShape.circle)),
          ]),
        ),
      ),
    );
  }

  Widget _liveFab(BuildContext context) {
    return Expanded(
      child: InkResponse(
        onTap: () => context.go('/live'),
        child: Transform.translate(
          offset: const Offset(0, -18),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: VlColors.red,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(color: VlColors.red.withValues(alpha: 0.35), blurRadius: 22, offset: const Offset(0, 8)),
                  BoxShadow(color: VlColors.paper, blurRadius: 0, spreadRadius: 6),
                ],
              ),
              child: const Icon(Icons.play_arrow, size: 24, color: Colors.white),
            ),
            const SizedBox(height: 4),
            Text('LIVE', style: VlText.ui(9, weight: FontWeight.w600, color: VlColors.red, letter: 0.16)),
          ]),
        ),
      ),
    );
  }
}
