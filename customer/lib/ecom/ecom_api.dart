import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'ecom_cart.dart';
import 'ecom_models.dart';
import 'ecom_wishlist.dart';

/// Auth state + token storage for the vkcgold_ecom `/v1` API.
/// Tokens persist in secure storage; [user] drives the logged-in UI.
class EcomAuth {
  EcomAuth._();
  static final EcomAuth I = EcomAuth._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  static const _kAccess = 'ecom_access_token';
  static const _kRefresh = 'ecom_refresh_token';
  static const _kUser = 'ecom_user';

  String? _access;
  String? _refresh;

  final ValueNotifier<EcomUser?> user = ValueNotifier<EcomUser?>(null);
  bool get isLoggedIn => _access != null && user.value != null;

  /// A stored token exists — true as soon as secure storage has been read,
  /// before /auth/me comes back. The splash uses this so a returning customer
  /// on a slow connection isn't sent through onboarding again.
  bool get hasStoredSession => _access != null;
  String? get accessToken => _access;
  /// Empty counts as absent — posting a blank token to /auth/refresh only
  /// earns a 401 that logs the customer out.
  String? get refreshToken => (_refresh?.isEmpty ?? true) ? null : _refresh;

  /// Restore the session on startup: tokens AND the customer's identity.
  ///
  /// isLoggedIn needs both a token and a user, so fetching the user over the
  /// network made every launch depend on that one call succeeding. With no
  /// connection the tokens survived but [user] stayed null, and the app showed
  /// a signed-in customer as "Guest" — the intermittent logout that only ever
  /// happened on a bad connection. The identity is now cached beside the
  /// tokens and restored offline; /auth/me becomes a background refresh, and
  /// only the server rejecting the token (401/403) ends the session.
  Future<void> load() async {
    _access = await _storage.read(key: _kAccess);
    _refresh = await _storage.read(key: _kRefresh);
    if (_access == null) return;

    final cached = await _storage.read(key: _kUser);
    if (cached != null && cached.isNotEmpty) {
      try {
        user.value = EcomUser.fromJson((jsonDecode(cached) as Map).cast<String, dynamic>());
      } catch (_) {
        // Unreadable cache — /auth/me below is the fallback.
      }
    }

    for (var attempt = 0; attempt < 3; attempt++) {
      try {
        final me = await EcomApi.I.me();
        user.value = me;
        await _cacheUser(me);
        return;
      } on DioException catch (e) {
        // 401/403 means the interceptor already spent the refresh token and
        // the session is genuinely over; the interceptor has cleared it.
        final code = e.response?.statusCode;
        if (code == 401 || code == 403) return;
        if (attempt == 2) return;
        await Future<void>.delayed(Duration(milliseconds: 700 * (attempt + 1)));
      } catch (_) {
        return;
      }
    }
  }

  Future<void> _cacheUser(EcomUser u) async {
    try {
      await _storage.write(key: _kUser, value: jsonEncode(u.toJson()));
    } catch (_) {
      // Losing the cache only costs the offline restore, never the session.
    }
  }

  Future<void> saveSession(AuthSession s) async {
    _access = s.accessToken;
    _refresh = s.refreshToken;
    await _storage.write(key: _kAccess, value: s.accessToken);
    await _storage.write(key: _kRefresh, value: s.refreshToken);
    user.value = s.user;
    await _cacheUser(s.user);
  }

  Future<void> saveTokens(String access, String? refresh) async {
    _access = access;
    await _storage.write(key: _kAccess, value: access);
    if (refresh != null) {
      _refresh = refresh;
      await _storage.write(key: _kRefresh, value: refresh);
    }
  }

  Future<void> clear() async {
    _access = null;
    _refresh = null;
    user.value = null;
    await _storage.delete(key: _kAccess);
    await _storage.delete(key: _kRefresh);
    await _storage.delete(key: _kUser);
  }
}

/// The server's own message for a failed call, so the customer sees why the
/// save/cancel/checkout was refused instead of a generic line. Falls back to
/// [fallback] for transport errors that carry no body.
String ecomError(Object e, String fallback) {
  if (e is DioException) {
    final data = e.response?.data;
    if (data is Map) {
      final msg = data['error'] ?? data['message'];
      if (msg is String && msg.trim().isNotEmpty) return msg;
    }
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return 'No connection. Check your network and try again.';
    }
  }
  return fallback;
}

/// Client for the vkcgold_ecom `/api/v1/*` ecommerce API.
class EcomApi {
  EcomApi._() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = EcomAuth.I.accessToken;
        if (token != null && !_isPublic(options.path)) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (e, handler) async {
        final path = e.requestOptions.path;
        // Skip the endpoints that mint tokens — refreshing there would loop.
        // /auth/me must NOT be skipped: it's the startup call whose 401 is
        // exactly what should spend the refresh token, otherwise a returning
        // customer is logged out on every launch.
        const noRefresh = ['/auth/refresh', '/auth/otp/'];
        if (e.response?.statusCode != 401 || noRefresh.any(path.contains)) {
          return handler.next(e);
        }
        final refreshed = await _refresh();
        if (!refreshed) {
          await EcomAuth.I.clear();
          return handler.next(e);
        }
        try {
          final opts = e.requestOptions;
          opts.headers['Authorization'] = 'Bearer ${EcomAuth.I.accessToken}';
          final r = await _bareDio.fetch(opts);
          return handler.resolve(r);
        } catch (_) {
          return handler.next(e);
        }
      },
    ));
  }
  static final EcomApi I = EcomApi._();

  /// Live ecom backend. Override for staging/local with
  /// --dart-define=ECOM_API_BASE=https://host  (path /api/v1 is appended).
  static const host = String.fromEnvironment('ECOM_API_BASE', defaultValue: 'https://vkcgoldikshu.com');
  static String get base => '$host/api/v1';

  final Dio _dio = Dio(BaseOptions(
    baseUrl: base,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
    sendTimeout: const Duration(seconds: 30),
    contentType: 'application/json',
  ));
  // No interceptors — used to retry a request after a token refresh.
  final Dio _bareDio = Dio(BaseOptions(baseUrl: base));

  static const _publicMarkers = [
    '/auth/otp/send', '/auth/otp/verify', '/auth/refresh',
    '/app-config', '/categories', '/products', '/hero-slides',
    '/banners', '/popups', '/blogs', '/coupons', '/track/',
  ];
  bool _isPublic(String path) => _publicMarkers.any(path.contains);

  Future<bool> _refresh() async {
    final rt = EcomAuth.I.refreshToken;
    if (rt == null) return false;
    try {
      final r = await _bareDio.post('/auth/refresh', data: {'refreshToken': rt});
      final access = r.data['accessToken'] as String?;
      if (access == null) return false;
      await EcomAuth.I.saveTokens(access, r.data['refreshToken'] as String?);
      return true;
    } catch (_) {
      return false;
    }
  }

  // ── Auth ────────────────────────────────────────────────────────────────
  /// Returns {isNew, devCode?}. devCode present only in dev/fixed-OTP mode.
  Future<Map<String, dynamic>> sendOtp(String phone) async {
    final r = await _dio.post('/auth/otp/send', data: {'phone': phone});
    return (r.data as Map).cast<String, dynamic>();
  }

  Future<AuthSession> verifyOtp(String phone, String otp, {String? name}) async {
    final r = await _dio.post('/auth/otp/verify', data: {
      'phone': phone,
      'otp': otp,
      if (name != null && name.trim().isNotEmpty) 'name': name.trim(),
    });
    final session = AuthSession.fromJson((r.data as Map).cast<String, dynamic>());
    await EcomAuth.I.saveSession(session);
    // Pull the account's saved products so the hearts are right immediately.
    Wishlist.I.loadQuietly();
    return session;
  }

  Future<EcomUser> me() async {
    final r = await _dio.get('/auth/me');
    return EcomUser.fromJson((r.data['user'] as Map).cast<String, dynamic>());
  }

  /// Customer profile (GET /profile) — the same record as /auth/me, plus
  /// whatever else the store keeps on the account.
  Future<Map<String, dynamic>> profile() async {
    final r = await _dio.get('/profile');
    final data = (r.data as Map).cast<String, dynamic>();
    return (data['user'] as Map?)?.cast<String, dynamic>() ?? data;
  }

  /// Save name / email changes (PATCH /profile). The phone is the login
  /// identity and is not editable here. Refreshes the in-app user on success.
  Future<EcomUser> updateProfile(Map<String, dynamic> fields) async {
    final r = await _dio.patch('/profile', data: fields);
    final data = (r.data as Map).cast<String, dynamic>();
    final user = EcomUser.fromJson(((data['user'] as Map?) ?? data).cast<String, dynamic>());
    EcomAuth.I.user.value = user;
    return user;
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {}
    await EcomAuth.I.clear();
    // Everything tied to the account goes with it. The cart matters most: it
    // syncs to /v1/cart on the next sign-in, so leaving it behind would push
    // one customer's basket into the next customer's account on a shared
    // phone.
    Wishlist.I.clear();
    EcomCart.I.clear();
  }

  // ── Catalog ─────────────────────────────────────────────────────────────
  Future<ProductPage> products({
    int page = 1,
    int limit = 20,
    String? sort,
    String? q,
    String? categorySlug,
    num? minPrice,
    num? maxPrice,
    bool? inStock,
    bool? isFeatured,
  }) async {
    final r = await _dio.get('/products', queryParameters: {
      'page': page,
      'limit': limit,
      if (sort != null) 'sort': sort,
      if (q != null && q.isNotEmpty) 'q': q,
      if (categorySlug != null) 'categorySlug': categorySlug,
      if (minPrice != null) 'minPrice': minPrice,
      if (maxPrice != null) 'maxPrice': maxPrice,
      if (inStock == true) 'inStock': 'true',
      if (isFeatured == true) 'isFeatured': 'true',
    });
    return ProductPage.fromJson((r.data as Map).cast<String, dynamic>());
  }

  /// Product detail by slug → (product, related).
  Future<(EcomProduct, List<EcomProduct>)> productBySlug(String slug) async {
    final r = await _dio.get('/products/$slug');
    final data = (r.data as Map).cast<String, dynamic>();
    final product = EcomProduct.fromJson((data['product'] as Map).cast<String, dynamic>());
    final related = (data['related'] as List? ?? const [])
        .map((p) => EcomProduct.fromJson((p as Map).cast<String, dynamic>()))
        .toList();
    return (product, related);
  }

  /// Categories, cached for the session.
  ///
  /// Home and Shop each fetched this on every visit, so moving between the two
  /// tabs re-downloaded the same list repeatedly and left both waiting on the
  /// network before they could draw. The store's weaves change rarely, so a
  /// short cache removes the duplicate calls and makes the second visit
  /// instant. Pull-to-refresh passes [force] to go back to the server.
  static final Map<bool, List<EcomCategory>> _catCache = {};
  static DateTime? _catCachedAt;
  static const _catTtl = Duration(minutes: 10);

  Future<List<EcomCategory>> categories({bool flat = false, bool force = false}) async {
    final fresh = _catCachedAt != null && DateTime.now().difference(_catCachedAt!) < _catTtl;
    final hit = _catCache[flat];
    if (!force && fresh && hit != null) return hit;
    final r = await _dio.get('/categories', queryParameters: {if (flat) 'flat': 1});
    final list = (r.data['categories'] as List? ?? const [])
        .map((c) => EcomCategory.fromJson((c as Map).cast<String, dynamic>()))
        .toList();
    _catCache[flat] = list;
    _catCachedAt = DateTime.now();
    return list;
  }

  /// Store bootstrap config incl. the admin theme. GET /app-config
  Future<Map<String, dynamic>?> appConfig() async {
    try {
      final r = await _dio.get('/app-config');
      return (r.data as Map).cast<String, dynamic>();
    } catch (_) {
      return null;
    }
  }

  /// Hero slides, cached like [categories] — the banner is store artwork that
  /// changes on a campaign, not per visit, so re-fetching it every time Home
  /// mounts only delayed the first paint.
  static List<HeroSlide>? _heroCache;
  static DateTime? _heroCachedAt;

  Future<List<HeroSlide>> heroSlides({bool force = false}) async {
    final fresh = _heroCachedAt != null && DateTime.now().difference(_heroCachedAt!) < _catTtl;
    final hit = _heroCache;
    if (!force && fresh && hit != null) return hit;
    final r = await _dio.get('/hero-slides');
    final list = (r.data['slides'] ?? r.data['heroSlides'] ?? []) as List;
    final slides = list.map((s) => HeroSlide.fromJson((s as Map).cast<String, dynamic>())).toList();
    _heroCache = slides;
    _heroCachedAt = DateTime.now();
    return slides;
  }

  // ── Editorial ───────────────────────────────────────────────────────────
  /// Journal posts (GET /blogs).
  Future<List<BlogPost>> blogs({int page = 1, int limit = 10}) async {
    final r = await _dio.get('/blogs', queryParameters: {'page': page, 'limit': limit});
    return (r.data['blogs'] as List? ?? const [])
        .map((b) => BlogPost.fromJson((b as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<BlogPost> blogBySlug(String slug) async {
    final r = await _dio.get('/blogs/$slug');
    final data = (r.data as Map).cast<String, dynamic>();
    return BlogPost.fromJson(((data['blog'] as Map?) ?? data).cast<String, dynamic>());
  }

  /// Merchandising banners (GET /banners), optionally for one slot.
  Future<List<Banner>> banners({String? position}) async {
    final r = await _dio.get('/banners', queryParameters: {if (position != null) 'position': position});
    final list = (r.data['banners'] as List? ?? const [])
        .map((b) => Banner.fromJson((b as Map).cast<String, dynamic>()))
        .where((b) => position == null || b.position == position)
        .toList();
    list.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    return list;
  }

  /// Promotional popups (GET /popups) — already filtered to active ones.
  Future<List<Popup>> popups() async {
    final r = await _dio.get('/popups');
    return (r.data['popups'] as List? ?? const [])
        .map((p) => Popup.fromJson((p as Map).cast<String, dynamic>()))
        .where((p) => p.isLive)
        .toList();
  }

  /// Book a video shopping call (POST /video-booking).
  Future<void> bookVideoCall({
    required String name,
    required String phone,
    required String preferredDate,
    required String preferredTime,
    String? notes,
  }) async {
    await _dio.post('/video-booking', data: {
      'name': name,
      'phone': phone,
      'preferredDate': preferredDate,
      'preferredTime': preferredTime,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
  }

  Future<CouponResult> validateCoupon(String code, num subtotal) async {
    final r = await _dio.post('/coupons/validate', data: {'code': code, 'subtotal': subtotal});
    return CouponResult.fromJson((r.data as Map).cast<String, dynamic>());
  }

  /// Public list of active coupons. GET /coupons
  Future<List<Map<String, dynamic>>> coupons() async {
    try {
      final r = await _dio.get('/coupons');
      final list = (r.data['coupons'] ?? []) as List;
      return list.map((e) => (e as Map).cast<String, dynamic>()).toList();
    } catch (_) {
      return [];
    }
  }

  // ── Cart sync ─────────────────────────────────────────────────────────────
  Future<void> syncCart(List<CartItem> items) async {
    await _dio.post('/cart', data: {'items': items.map((i) => {'productId': i.productId, 'variantId': i.variantId, 'quantity': i.quantity}).toList()});
  }

  // ── Payment methods ─────────────────────────────────────────────────────
  /// Which payment methods the store has switched on, straight from the
  /// website's own endpoint (GET /api/payment-config).
  ///
  /// This is the SAME source the website checkout reads, so Admin → Settings →
  /// Payments is the single source of truth for both. Note it sits at /api,
  /// not /api/v1 — /v1/app-config carries a `payment` block that reads a
  /// different key namespace (`payment_cod_enabled` and friends) which the
  /// admin panel never writes, so it always reported its own defaults and the
  /// admin's real toggles had no effect on the app.
  Future<PaymentMethods> paymentMethods() async {
    final r = await _bareDio.get('$host/api/payment-config');
    return PaymentMethods.fromJson((r.data as Map).cast<String, dynamic>());
  }

  /// Confirms a Razorpay payment server-side (signature check) and marks the
  /// order paid. POST /v1/checkout/razorpay/verify.
  Future<void> verifyRazorpay({
    required String orderId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    await _dio.post('/checkout/razorpay/verify', data: {
      'orderId': orderId,
      'razorpayOrderId': razorpayOrderId,
      'razorpayPaymentId': razorpayPaymentId,
      'razorpaySignature': razorpaySignature,
    });
  }

  // ── Checkout ────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> checkout({
    required Address address,
    required String paymentMethod,
    required List<CartItem> items,
    num shippingAmount = 0,
    num discountAmount = 0,
    String? couponCode,
    num walletAmount = 0,
    String? notes,
  }) async {
    final r = await _dio.post('/checkout', data: {
      'address': address.toJson(),
      'paymentMethod': paymentMethod,
      'shippingAmount': shippingAmount,
      'discountAmount': discountAmount,
      'couponCode': couponCode,
      'walletAmount': walletAmount,
      'items': items.map((i) => i.toJson()).toList(),
      'notes': notes,
    });
    return (r.data as Map).cast<String, dynamic>();
  }

  // ── Orders ──────────────────────────────────────────────────────────────
  Future<List<EcomOrder>> orders({int page = 1, int limit = 20, String? status}) async {
    final r = await _dio.get('/orders', queryParameters: {
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
    });
    return (r.data['orders'] as List? ?? const [])
        .map((o) => EcomOrder.fromJson((o as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<EcomOrder> orderById(String id) async {
    final r = await _dio.get('/orders/$id');
    return EcomOrder.fromJson((r.data['order'] as Map).cast<String, dynamic>());
  }

  /// Public tracking by order number.
  Future<EcomOrder> track(String orderNumber) async {
    final r = await _dio.get('/track/$orderNumber');
    return EcomOrder.fromJson((r.data['order'] as Map).cast<String, dynamic>());
  }

  Future<void> cancelOrder(String id, String reason, {String? remark}) async {
    await _dio.post('/orders/$id/cancel', data: {'reason': reason, if (remark != null) 'remark': remark, 'refundMethod': 'SOURCE'});
  }

  /// Request a return on a delivered order. Same body shape as cancel — the
  /// server's own message is surfaced verbatim if it wants more.
  Future<void> returnOrder(String id, String reason, {String? remark}) async {
    await _dio.post('/orders/$id/return', data: {
      'reason': reason,
      if (remark != null && remark.isNotEmpty) 'remark': remark,
      'refundMethod': 'SOURCE',
    });
  }

  // ── Addresses ─────────────────────────────────────────────────────────────
  Future<List<Address>> addresses() async {
    final r = await _dio.get('/addresses');
    return (r.data['addresses'] as List? ?? const [])
        .map((a) => Address.fromJson((a as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<Address> addAddress(Map<String, dynamic> fields) async {
    final r = await _dio.post('/addresses', data: fields);
    return Address.fromJson((r.data['address'] as Map).cast<String, dynamic>());
  }

  Future<Address> updateAddress(String id, Map<String, dynamic> fields) async {
    final r = await _dio.patch('/addresses/$id', data: fields);
    return Address.fromJson((r.data['address'] as Map).cast<String, dynamic>());
  }

  Future<void> deleteAddress(String id) async => _dio.delete('/addresses/$id');

  /// Promote an address to the customer's default. Sends the whole record so
  /// the call holds whether the endpoint accepts a partial patch or expects a
  /// complete address; the server owns un-defaulting the previous one.
  Future<Address> setDefaultAddress(Address a) =>
      updateAddress(a.id, {...a.toJson(), 'isDefault': true});

  // ── Wishlist (keyed by variantId) ─────────────────────────────────────────
  /// Saved variants with the product each one belongs to. The variant id is
  /// kept, not just the product, because it's the key add/remove work in.
  Future<List<WishlistEntry>> wishlist() async {
    final r = await _dio.get('/wishlist');
    // Each item wraps a variant that carries the full product.
    return (r.data['items'] as List? ?? const [])
        .map((it) {
          final variant = ((it as Map)['variant'] as Map?)?.cast<String, dynamic>() ?? const {};
          final product = (variant['product'] as Map?)?.cast<String, dynamic>();
          return WishlistEntry(
            variantId: (variant['id'] as String?) ?? (it['variantId'] as String?) ?? '',
            product: EcomProduct.fromJson((product ?? const {}).cast<String, dynamic>()),
          );
        })
        .where((e) => e.product.id.isNotEmpty && e.variantId.isNotEmpty)
        .toList();
  }

  /// Store wallet balance (₹). GET /wallet
  Future<num> walletBalance() async {
    final r = await _dio.get('/wallet');
    return (r.data['balance'] as num?) ?? 0;
  }

  /// Wallet balance plus its ledger, when the store returns one — the same
  /// call as [walletBalance], read whole.
  Future<({num balance, List<Map<String, dynamic>> entries})> wallet() async {
    final r = await _dio.get('/wallet');
    final data = (r.data as Map).cast<String, dynamic>();
    final raw = (data['transactions'] ?? data['entries'] ?? data['history'] ?? const []) as List;
    return (
      balance: (data['balance'] as num?) ?? 0,
      entries: raw.map((e) => (e as Map).cast<String, dynamic>()).toList(),
    );
  }

  Future<void> addWishlist(String variantId) async => _dio.post('/wishlist', data: {'variantId': variantId});
  Future<void> removeWishlist(String variantId) async => _dio.delete('/wishlist', queryParameters: {'variantId': variantId});
}
