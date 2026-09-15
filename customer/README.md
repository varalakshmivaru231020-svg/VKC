# VKC Gold Ikshu — customer app (Android)

Native Flutter shopping app for [vkcgoldikshu.com](https://vkcgoldikshu.com). The
website and its admin panel are the source of truth for products, categories,
banners, blogs, gallery and the brand story; the app is the premium mobile
shopping experience on top of the same `/api/v1` backend.

## Startup

`Open APK → Home`. There is no splash route, no onboarding, no login gate.
The native launch window (`android/.../launch_background.xml`) shows the VKC
emblem on ivory only while the Flutter engine starts.

## Navigation

Bottom navigation: **Home · Categories · Shop · Cart · Profile**
(`StatefulShellRoute` in `lib/main.dart`; each tab keeps its own state).

| Route | Screen |
|---|---|
| `/home` | Hero banners, Shop by Category, New Arrivals, mid banners, Heritage, Why VKC, Blog, Testimonials, Gallery preview, trust strip |
| `/categories` | All categories with product counts |
| `/shop` | Full catalogue: category chips, sort, filters, infinite scroll |
| `/cart` | Cart, coupons/offers, price details, sticky checkout |
| `/profile` | Account card, orders, wishlist, addresses, Gallery, About Us, Leadership, Blog, Contact, sign in/out |
| `/search` | Recent searches, live suggestions, results grid |
| `/listing?cat=&q=&featured=1` | Product listing (category / search / featured) |
| `/product/:slug` | Product detail: gallery, options, quantity, description, reviews, related, Add to Cart / Buy Now |
| `/gallery` | Native gallery grid + full-screen viewer (pinch-zoom, swipe, video) |
| `/about`, `/leadership` | The website's own pages inside the app (WebView, site chrome hidden) |
| `/orders`, `/orders/:id`, `/orders/:id/invoice`, `/track-order` | Orders |
| `/wishlist`, `/addresses`, `/account/edit`, `/login`, `/notifications`, `/journal`, `/journal/:slug`, `/contact`, `/checkout`, `/order-success` | — |

## Code map

```
lib/
  main.dart                 app entry, bootstrap, router, shell + bottom nav
  theme.dart                design tokens: VkColors, VkText, VkRadii, VkSpace, VkMotion, vkTheme()
  widgets.dart              design system: BrandLogo, TopBar/TabHeader, NetImage (cached), ProductCard,
                            CategoryTile, PriceRow, buttons, chips, QtyStepper, StateView, skeletons, motion
  models.dart               Product (card model)
  ecom/ecom_env.dart        host + mediaUrl() (resolves /uploads/... paths)
  ecom/ecom_models.dart     API models (+ GalleryItem, Testimonial, AboutContent, reviews)
  ecom/ecom_api.dart        /api/v1 client, auth + token refresh, session caches
  ecom/ecom_cart.dart       persistent cart (shared_preferences) + server mirror
  ecom/ecom_wishlist.dart   shared wishlist state
  ecom/ecom_config.dart     StoreConfig from /app-config, payment methods
  ecom/recent_searches.dart recent search terms
  screens/                  one file per screen (see routes above)
assets/brand/logo.png       the static VKC emblem (never the admin upload)
```

## Backend endpoints used

All under `https://vkcgoldikshu.com/api/v1` unless noted.

`app-config`, `categories?flat=1` (now with `productCount`), `products`,
`products/:slug`, `products/:slug/reviews`, `hero-slides`, `banners`, `popups`,
`blogs`, `blogs/:slug`, `coupons`, `coupons/validate`, `cart`, `wishlist`,
`orders`, `orders/:id`, `orders/:id/cancel|return`, `track/:orderNumber`,
`addresses`, `profile`, `auth/otp/send|verify`, `auth/me|refresh|logout`,
`checkout`, `checkout/razorpay/verify`, and `/api/payment-config`.

**New in this version (deploy the website with the app):**

- `GET /api/v1/gallery` — native Gallery screen + Home preview
- `GET /api/v1/testimonials` — Home "What our customers say"
- `GET /api/v1/about` — Home "Our Heritage" block + returns window
- `GET /api/v1/categories` — adds `productCount`

The app hides those Home sections gracefully while the endpoints are not yet
deployed; Gallery shows its empty/error state.

## Build

```sh
flutter pub get
flutter analyze
flutter test
flutter build apk --release --split-per-abi   # build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
flutter build apk --release                   # universal APK
```

Point the app at a staging backend with
`--dart-define=ECOM_API_BASE=https://staging.example.com`.

Release signing still uses the debug keystore (see `android/app/build.gradle.kts`);
add a release `signingConfig` before publishing to the Play Store.
