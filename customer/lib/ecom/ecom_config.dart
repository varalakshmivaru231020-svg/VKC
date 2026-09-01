import 'package:flutter/foundation.dart';

import 'ecom_models.dart';

/// The store's own settings, as served by GET /v1/app-config — the same
/// record the website reads, so shipping rates, payment availability and the
/// contact block never drift from vkcgoldikshu.com.
///
/// [storeConfig] holds the last successful fetch; every getter falls back to
/// the shipped defaults, so screens can read it before the call lands.
class StoreConfig {
  final Map<String, dynamic> raw;
  const StoreConfig([this.raw = const {}]);

  Map<String, dynamic> _map(String key, [Map<String, dynamic>? from]) {
    final v = (from ?? raw)[key];
    return v is Map ? v.cast<String, dynamic>() : const {};
  }

  String _str(Map<String, dynamic> m, String k, [String fallback = '']) {
    final v = m[k];
    return v is String && v.trim().isNotEmpty ? v : fallback;
  }

  num _num(Map<String, dynamic> m, String k, num fallback) => (m[k] as num?) ?? fallback;

  // ── Site ──────────────────────────────────────────────────────────────────
  Map<String, dynamic> get site => _map('site');
  String get storeName => _str(site, 'name', 'VKC Gold');
  String get tagline => _str(site, 'tagline');
  String get logoUrl => _str(site, 'logoUrl');
  String get phone => _str(site, 'phone');
  String get email => _str(site, 'email');
  String get storeAddress => _str(site, 'address');

  Map<String, dynamic> get _announcement => _map('announcement', site);
  bool get announcementActive => _announcement['active'] == true && announcement.isNotEmpty;
  String get announcement => _str(_announcement, 'text');

  Map<String, dynamic> get social => _map('social', site);
  String get instagram => _str(social, 'instagram');
  String get facebook => _str(social, 'facebook');
  String get youtube => _str(social, 'youtube');
  String get whatsapp => _str(social, 'whatsapp');

  // ── Shipping ──────────────────────────────────────────────────────────────
  Map<String, dynamic> get _shipping => _map('shipping');
  num get freeShippingThreshold => _num(_shipping, 'freeShippingThreshold', 10000);
  num get firstSareeRate => _num(_shipping, 'firstSareeRate', 100);
  num get additionalSareeRate => _num(_shipping, 'additionalSareeRate', 50);
  String get deliveryTitle => _str(_shipping, 'deliveryTitle', 'Standard Delivery');
  String get deliveryNotes => _str(_shipping, 'deliveryNotes', '7 business days');

  /// Shipping for [itemCount] sarees at [subtotal], by the website's rule:
  /// free above the threshold or with a free-shipping coupon, else the first
  /// saree rate plus the additional rate for every saree after it.
  num shippingFor({required num subtotal, required int itemCount, bool freeShippingCoupon = false}) {
    if (itemCount <= 0 || subtotal <= 0) return 0;
    if (freeShippingCoupon || subtotal >= freeShippingThreshold) return 0;
    return firstSareeRate + (itemCount - 1) * additionalSareeRate;
  }

  // Payment availability deliberately does NOT live here. /v1/app-config's
  // `payment` block reads `payment_cod_enabled` and friends, a key namespace
  // the admin panel never writes, so it only ever reported its own defaults.
  // The store's real toggles come from [paymentMethods] below.

  // ── Legal ─────────────────────────────────────────────────────────────────
  Map<String, dynamic> get _legal => _map('legal');
  String get privacyUrl => _str(_legal, 'privacyUrl');
  String get termsUrl => _str(_legal, 'termsUrl');
  String get returnsPolicyUrl => _str(_legal, 'returnsPolicyUrl');
  String get shippingPolicyUrl => _str(_legal, 'shippingPolicyUrl');

  // ── App ───────────────────────────────────────────────────────────────────
  Map<String, dynamic> get _app => _map('app');
  bool get maintenanceMode => _app['maintenanceMode'] == true;
  String get maintenanceMessage => _str(_app, 'maintenanceMessage');
}

/// Replaced once /app-config lands at startup; screens that show store facts
/// listen to it so a late fetch still reaches them.
final ValueNotifier<StoreConfig> storeConfig = ValueNotifier<StoreConfig>(const StoreConfig());

/// The store's enabled payment methods (GET /api/payment-config), fetched at
/// launch so screens outside checkout — Home's delivery promises, for one —
/// only advertise what Admin → Settings → Payments actually has switched on.
/// Null until the first fetch lands; checkout re-reads it on every visit.
final ValueNotifier<PaymentMethods?> paymentMethods = ValueNotifier<PaymentMethods?>(null);
