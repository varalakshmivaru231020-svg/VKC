/// Centralised path constants. Keep all route strings here so refactors are
/// safe (no scattered string literals).
class RoutePaths {
  static const splash      = "/splash";
  static const onboarding  = "/onboarding";

  // Auth
  static const login       = "/login";
  static const otp         = "/login/otp";

  // Main shell (with bottom nav)
  static const home        = "/";
  static const shop        = "/shop";
  static const wishlist    = "/wishlist";
  static const cart        = "/cart";
  static const account     = "/account";

  // Detail screens
  static String productDetail(String slug) => "/shop/$slug";
  static String category(String slug)      => "/category/$slug";
  static const search        = "/search";
  static const checkout      = "/checkout";
  static const orderSuccess  = "/order-success";
  static const trackOrder    = "/track";

  // Account sub-screens
  static const profile       = "/account/profile";
  static const addresses     = "/account/addresses";
  static const orders        = "/account/orders";
  static String orderDetail(String id) => "/account/orders/$id";
  static const wallet        = "/account/wallet";
  static const blogs         = "/blogs";
  static String blogDetail(String slug) => "/blogs/$slug";
}
