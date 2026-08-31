import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'ecom_api.dart';
import 'ecom_config.dart';
import 'ecom_models.dart';

/// In-memory cart of ecom [CartItem]s (matches the /checkout item shape).
/// Best-effort syncs to /v1/cart when the customer is logged in.
class EcomCart {
  EcomCart._();
  static final EcomCart I = EcomCart._();

  final ValueNotifier<List<CartItem>> items = ValueNotifier<List<CartItem>>([]);

  /// Applied coupon (validated against the current subtotal), if any.
  final ValueNotifier<CouponResult?> appliedCoupon = ValueNotifier<CouponResult?>(null);
  CouponResult? get coupon => appliedCoupon.value;
  set coupon(CouponResult? c) => appliedCoupon.value = c;

  /// Re-checks the applied coupon against the current subtotal and drops it if
  /// the store no longer honours it — a coupon earned at ₹8,000 must not keep
  /// discounting a cart the customer has since emptied down to ₹2,000.
  /// Returns the message to show when it was dropped, else null.
  Future<String?> revalidateCoupon() async {
    final c = coupon;
    if (c == null) return null;
    if (items.value.isEmpty) {
      coupon = null;
      return null;
    }
    try {
      final res = await EcomApi.I.validateCoupon(c.code, subtotal);
      if (res.valid) {
        coupon = res;
        return null;
      }
      coupon = null;
      return '${c.code} no longer applies to this cart';
    } on DioException catch (e) {
      // Only a refusal clears the coupon; a network blip must not silently
      // raise the customer's total.
      if (e.response?.statusCode == null || e.response!.statusCode! < 400) return null;
      coupon = null;
      return ecomError(e, '${c.code} no longer applies to this cart');
    } catch (_) {
      return null;
    }
  }

  int get count => items.value.fold(0, (s, i) => s + i.quantity);
  num get subtotal => items.value.fold<num>(0, (s, i) => s + i.salePrice * i.quantity);
  num get savings => items.value.fold<num>(0, (s, i) => s + (i.originalPrice - i.salePrice) * i.quantity);

  /// Coupon discount on the subtotal (free-shipping coupons discount 0 here).
  num get couponDiscount => coupon == null || coupon!.freeShipping ? 0 : coupon!.discount;
  bool get freeShipping => coupon?.freeShipping == true;

  /// Shipping by the store's own rates (/app-config → shipping): free above
  /// the threshold or with a free-shipping coupon, else first-saree rate plus
  /// the additional rate per extra saree — the website's exact formula, on
  /// the pre-discount subtotal.
  num get shipping => storeConfig.value.shippingFor(
        subtotal: subtotal,
        itemCount: count,
        freeShippingCoupon: freeShipping,
      );

  num get total => (subtotal + shipping - couponDiscount).clamp(0, double.infinity);

  void add(CartItem item) {
    final list = [...items.value];
    final i = list.indexWhere((x) => x.variantId == item.variantId);
    if (i >= 0) {
      final q = (list[i].quantity + item.quantity).clamp(1, item.stockQty > 0 ? item.stockQty : 99);
      list[i] = list[i].copyWith(quantity: q);
    } else {
      list.add(item);
    }
    items.value = list;
    _sync();
  }

  void setQty(String variantId, int qty) {
    final list = [...items.value];
    final i = list.indexWhere((x) => x.variantId == variantId);
    if (i < 0) return;
    if (qty <= 0) {
      list.removeAt(i);
    } else {
      final cap = list[i].stockQty > 0 ? list[i].stockQty : 99;
      list[i] = list[i].copyWith(quantity: qty.clamp(1, cap));
    }
    items.value = list;
    _sync();
  }

  void remove(String variantId) {
    items.value = items.value.where((x) => x.variantId != variantId).toList();
    _sync();
  }

  void clear() {
    items.value = [];
    coupon = null;
    _sync();
  }

  void _sync() {
    if (!EcomAuth.I.isLoggedIn) return;
    // Fire-and-forget; the server cart is a convenience mirror.
    EcomApi.I.syncCart(items.value).catchError((_) {});
  }
}
