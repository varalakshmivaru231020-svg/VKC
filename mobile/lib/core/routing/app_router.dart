import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../widgets/main_shell.dart";
import "../widgets/placeholder_screen.dart";
import "../../features/account/presentation/account_screen.dart";
import "../../features/account/presentation/profile_screen.dart";
import "../../features/addresses/presentation/addresses_screen.dart";
import "../../features/auth/data/auth_controller.dart";
import "../../features/auth/presentation/login_screen.dart";
import "../../features/auth/presentation/otp_screen.dart";
import "../../features/cart/presentation/cart_screen.dart";
import "../../features/checkout/presentation/checkout_screen.dart";
import "../../features/checkout/presentation/order_success_screen.dart";
import "../../features/home/presentation/home_screen.dart";
import "../../features/onboarding/presentation/onboarding_screen.dart";
import "../../features/orders/presentation/order_detail_screen.dart";
import "../../features/orders/presentation/orders_screen.dart";
import "../../features/product_detail/presentation/product_detail_screen.dart";
import "../../features/search/presentation/search_screen.dart";
import "../../features/shop/presentation/shop_screen.dart";
import "../../features/wallet/presentation/wallet_screen.dart";
import "../../features/wishlist/presentation/wishlist_screen.dart";
import "../../features/splash/presentation/splash_screen.dart";
import "auth_listenable.dart";
import "route_paths.dart";

/// Routes that require an authenticated user. Unauthenticated taps redirect
/// to /login with a `?from=` query so we can return after sign-in (Phase 5).
const _authRequiredPrefixes = <String>[
  "/checkout",
  "/account",
];

/// Application router. Uses StatefulShellRoute so each tab keeps its own
/// nav stack (industry-standard for ecommerce apps with bottom nav).
final goRouterProvider = Provider<GoRouter>((ref) {
  final authListenable = ref.watch(authChangeNotifierProvider);

  return GoRouter(
    initialLocation: RoutePaths.splash,
    debugLogDiagnostics: false,
    refreshListenable: authListenable,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final loc  = state.matchedLocation;

      // While bootstrapping (validating stored token), keep showing splash.
      if (auth.initializing) {
        return loc == RoutePaths.splash ? null : RoutePaths.splash;
      }

      // Authed users on auth pages → home.
      final atAuthPage = loc == RoutePaths.login || loc == RoutePaths.otp;
      if (auth.isLoggedIn && atAuthPage) return RoutePaths.home;

      // Guests trying to hit a protected route → login.
      final needsAuth = _authRequiredPrefixes.any((p) => loc == p || loc.startsWith("$p/"));
      if (!auth.isLoggedIn && needsAuth) {
        return "${RoutePaths.login}?from=${Uri.encodeComponent(loc)}";
      }

      return null;
    },
    routes: [
      GoRoute(path: RoutePaths.splash,     builder: (_, __) => const SplashScreen()),
      GoRoute(path: RoutePaths.onboarding, builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: RoutePaths.login,      builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: RoutePaths.otp,
        builder: (_, state) {
          final extra = (state.extra as Map?)?.cast<String, dynamic>() ?? const {};
          return OtpScreen(args: OtpScreenArgs(
            phone:   extra["phone"]   as String? ?? "",
            isNew:   extra["isNew"]   == true,
            devCode: extra["devCode"] as String?,
          ));
        },
      ),

      // Bottom-nav shell with 5 branches
      StatefulShellRoute.indexedStack(
        builder: (_, __, navigationShell) => MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: RoutePaths.home,
              builder: (_, __) => const HomeScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: RoutePaths.shop,
              builder: (_, __) => const ShopScreen(),
              routes: [
                GoRoute(
                  path: ":slug",
                  builder: (_, state) => ProductDetailScreen(slug: state.pathParameters["slug"]!),
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: RoutePaths.wishlist,
              builder: (_, __) => const WishlistScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: RoutePaths.cart,
              builder: (_, __) => const CartScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: RoutePaths.account,
              builder: (_, __) => const AccountScreen(),
              routes: [
                GoRoute(path: "profile",   builder: (_, __) => const ProfileScreen()),
                GoRoute(path: "addresses", builder: (_, __) => const AddressesScreen()),
                GoRoute(path: "orders",    builder: (_, __) => const OrdersScreen(), routes: [
                  GoRoute(path: ":id",     builder: (_, state) => OrderDetailScreen(orderId: state.pathParameters["id"]!)),
                ]),
                GoRoute(path: "wallet",    builder: (_, __) => const WalletScreen()),
              ],
            ),
          ]),
        ],
      ),

      GoRoute(path: RoutePaths.checkout,     builder: (_, __) => const CheckoutScreen()),
      GoRoute(
        path: RoutePaths.orderSuccess,
        builder: (_, state) => OrderSuccessScreen(orderNumber: (state.extra as String?) ?? ""),
      ),
      GoRoute(path: RoutePaths.search,       builder: (_, __) => const SearchScreen()),
      GoRoute(
        path: "/category/:slug",
        builder: (_, state) => ShopScreen(
          categorySlug: state.pathParameters["slug"]!,
          title: state.pathParameters["slug"]!.replaceAll("-", " ").split(" ").map((w) => w.isEmpty ? w : w[0].toUpperCase() + w.substring(1)).join(" "),
        ),
      ),
      GoRoute(path: RoutePaths.trackOrder,   builder: (_, __) => const PlaceholderScreen(title: "Track order",  note: "Phase 5")),
      GoRoute(path: RoutePaths.blogs,        builder: (_, __) => const PlaceholderScreen(title: "Blogs",        note: "Phase 5")),
    ],
  );
});
