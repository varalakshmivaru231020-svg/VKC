# Vijaylakshmi Sarees — Mobile App

Flutter app (Android + iOS) for the Vijaylakshmi Sarees ecommerce site.
Talks to the same Next.js backend at `https://vijaylakshmi.bestprime.live` via the `/api/v1/*` endpoints.

## Stack

| Concern         | Library                                    |
|-----------------|--------------------------------------------|
| State / DI      | `flutter_riverpod`                         |
| Routing         | `go_router` (StatefulShellRoute)           |
| Network         | `dio` + interceptors (auth, error, logger) |
| Models          | `freezed` + `json_serializable`            |
| Token storage   | `flutter_secure_storage`                   |
| Cache           | `hive` + `shared_preferences`              |
| Images          | `cached_network_image` + `shimmer`         |
| Pagination      | `infinite_scroll_pagination`               |
| Pin entry       | `pinput`                                   |
| Payments        | `razorpay_flutter`                         |
| Connectivity    | `connectivity_plus`                        |

## Architecture

Clean Architecture, feature-first.

```
lib/
├── core/                # api, config, errors, network, routing, storage, theme, widgets
└── features/<feature>/  # data/, domain/, presentation/
```

Bootstrap order on app launch:

1. `main.dart` — initialise Hive + SharedPreferences
2. `app.dart` — render `MaterialApp.router` with default theme
3. `SplashScreen` — fetch `/api/v1/app-config`
4. App theme rebuilds dynamically once config arrives (colors, fonts)
5. Navigate to onboarding (first launch) or home

## Run

```bash
cd vijaylakshmi_ecom/mobile

flutter pub get
dart run build_runner build -d           # generate freezed/json_serializable code

# Dev (points at local backend)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000

# Prod
flutter run --dart-define=API_BASE_URL=https://vijaylakshmi.bestprime.live
```

> Use `10.0.2.2` for the Android emulator to reach the host machine. iOS sim uses `localhost`.

## Backend dependency

Mobile relies entirely on `/api/v1/*` endpoints in `vijaylakshmi_ecom/web`:

| Endpoint                                          | Purpose                                 |
|---------------------------------------------------|-----------------------------------------|
| `GET  /api/v1/app-config`                         | Theme, site, payments, firebase, version|
| `POST /api/v1/auth/otp/send`                      | OTP send (test code is `123456`)        |
| `POST /api/v1/auth/otp/verify`                    | OTP verify → returns access+refresh JWT |
| `POST /api/v1/auth/refresh`                       | Refresh access token                    |
| `POST /api/v1/auth/logout`                        | Stateless logout                        |
| `GET  /api/v1/auth/me`                            | Current user                            |
| `GET  /api/v1/categories`                         | Category tree                           |
| `GET  /api/v1/products`                           | Listing (filters/sort/pagination)       |
| `GET  /api/v1/products/{slug}`                    | Detail + related                        |
| `GET  /api/v1/products/{slug}/reviews`            | Product reviews                         |
| `GET  /api/v1/hero-slides` `/banners` `/popups`   | Marketing surfaces                      |
| `GET  /api/v1/blogs`, `/api/v1/blogs/{slug}`      | Blog content                            |
| `GET  /api/v1/coupons`, `POST .../validate`       | Coupons                                 |
| `GET/PATCH /api/v1/profile`                       | Current user profile                    |
| `GET/POST /api/v1/addresses`                      | Address book                            |
| `PATCH/DELETE /api/v1/addresses/{id}`             | Edit/remove address                     |
| `GET/POST/DELETE /api/v1/wishlist`                | Wishlist                                |
| `GET /api/v1/orders` `/orders/{id}`               | Orders list/detail                      |
| `POST /api/v1/orders/{id}/cancel` `.../return`    | Lifecycle actions                       |
| `GET  /api/v1/wallet`                             | Wallet balance + txns                   |
| `POST /api/v1/checkout`                           | Place order                             |
| `POST /api/v1/checkout/razorpay/verify`           | Verify payment signature                |
| `GET  /api/v1/track/{orderNumber}`                | Public order tracking                   |

## Phase status

- [x] Phase 0 — Backend `/api/v1/*` endpoints
- [x] Phase 1 — Flutter scaffolding
- [x] Phase 2 — Splash → Onboarding → OTP login → session
- [x] Phase 3 — Home, Shop, PDP, Search, Wishlist
- [x] Phase 4 — Cart, Checkout, Razorpay, Order success
- [x] Phase 5 — Account, Profile, Addresses, Orders + cancel/return/exchange, Wallet
- [x] Phase 6 — Native splash + launcher icons (placeholders), connectivity banner
- [ ] Phase 7 — Push notifs, deep links, analytics, Sentry, real icons, store submission

## Toolchain pinned

- Gradle wrapper: 8.9
- Android Gradle Plugin: 8.5.0
- Kotlin: 1.9.22
- Java: 17 (use Android Studio's bundled JDK 21 to invoke Gradle: `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`)
- shared_preferences pinned to 2.2.3 / shared_preferences_android 2.2.1 (newer versions break Flutter 3.22's auto-generated Java plugin registrant)

## Run

```bash
cd vijaylakshmi_ecom/mobile

# 1. Make sure Flutter uses Android Studio's bundled JDK
flutter config --jdk-dir="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

flutter pub get

# Dev (points at local backend)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000

# Prod (default)
flutter run
```

## What's working end-to-end

- App boots with native splash → fetches `/api/v1/app-config` → theme rebuilds dynamically (admin-controlled colors/fonts)
- Onboarding (3-page intro) on first launch only
- Phone + OTP login (test code is `123456`) → JWT access+refresh tokens stored in flutter_secure_storage → silent refresh on 401
- Bottom-nav shell (Home, Shop, Wishlist, Cart, Account) with cart-count badge
- Home: announcement bar, hero carousel, categories strip, featured products
- Shop: paginated grid, sort sheet, filter sheet (price range + in-stock)
- PDP: image carousel, variant picker, qty stepper, accordions, related products, sticky Add-to-bag/Buy-now bar, wishlist toggle
- Search with debounced query
- Wishlist (server-synced) with add/remove
- Cart (local persistent) with qty editing and checkout entry
- Checkout: address picker, payment method, server `POST /checkout`, Razorpay launch + signature verification
- Order success screen with order number
- Account hub with avatar, links, logout
- Profile edit
- Address book CRUD
- Orders list + detail with cancel + return + exchange flows
- Wallet balance + transaction history
- Connectivity banner shows when offline
- All errors typed (`Failure`) with branded `AppErrorView`

## Phase 7 — what's left before store

- Real launcher icon + splash assets (replace `assets/icon/*.png` placeholders)
- Firebase push notifications (config already fetched via `app-config`)
- Sentry / Firebase Crashlytics integration
- Deep link routing (already supported by go_router; needs intent filters in `AndroidManifest.xml` and Universal Links plist on iOS)
- Real ProGuard / R8 release build + signing keystore
- Production app config in admin (logo, social links, Razorpay live key, Firebase config)
- Play Store + App Store listings, screenshots, descriptions

## Asset placeholders

Add when ready:

- `assets/icon/app_icon.png`     — 1024×1024 launcher icon
- `assets/icon/app_icon_fg.png`  — 1024×1024 foreground for Android adaptive icon
- `assets/icon/splash_logo.png`  — splash logo (centered, ~512px square)

Then run:

```bash
dart run flutter_launcher_icons
dart run flutter_native_splash:create
```
