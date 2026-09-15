import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'ecom_api.dart';
import 'ecom_config.dart';
import 'ecom_models.dart';

/// The customer's basket: a list of [CartItem]s (the /checkout item shape).
///
/// Kept on the phone so it survives a restart — a basket that vanished when
/// the app was closed was the single biggest leak in the funnel — and mirrored
/// to /v1/cart, best effort, while the customer is signed in.
class EcomCart {
  EcomCart._();
  static final EcomCart I = EcomCart._();

  static const _kStore = 'vkc_cart_v1';

  final ValueNotifier<List<CartItem>> items = ValueNotifier<List<CartItem>>([]);

  /// Bumped on every add, so the shell's cart badge can play its bounce.
  final ValueNotifier<int> addEvents = ValueNotifier<int>(0);

  /// Applied coupon (validated against the current subtotal), if any.
  final ValueNotifier<CouponResult?> appliedCoupon = ValueNotifier<CouponResult?>(null);
  CouponResult? get coupon => appliedCoupon.value;
  set coupon(CouponResult? c) => appliedCoupon.value = c;

  /// Restores the saved basket. Safe to call once at launch.
  Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_kStore);
      if (raw == null || raw.isEmpty) return;
      final list = (jsonDecode(raw) as List)
          .map((e) => CartItem.fromJson((e as Map).cast<String, dynamic>()))
          .where((i) => i.variantId.isNotEmpty && i.quantity > 0)
          .toList();
      items.value = list;
    } catch (_) {
      // A basket that can't be read starts empty; nothing else is affected.
    }
  }

  Future<void> _persist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kStore, jsonEncode(items.value.map((i) => i.toJson()).toList()));
    } catch (_) {}
  }

  /// Re-checks the applied coupon against the current subtotal and drops it if
  /// the store no longer honours it. Returns the message to show when it was
  /// dropped, else null.
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
  num get savings => items.value.fold<num>(0, (s, i) => s + (i.originalPrice - i.salePrice).clamp(0, double.infinity) * i.quantity);

  /// Coupon discount on the subtotal (free-shipping coupons discount 0 here).
  num get couponDiscount => coupon == null || coupon!.freeShipping ? 0 : coupon!.discount;
  bool get freeShipping => coupon?.freeShipping == true;

  /// Shipping by the store's own rates (/app-config → shipping).
  num get shipping => storeConfig.value.shippingFor(
        subtotal: subtotal,
        itemCount: count,
        freeShippingCoupon: freeShipping,
      );

  num get total => (subtotal + shipping - couponDiscount).clamp(0, double.infinity);

  int quantityOf(String variantId) {
    for (final i in items.value) {
      if (i.variantId == variantId) return i.quantity;
    }
    return 0;
  }

  /// Adds a line (or tops up an existing one). Returns false when the store
  /// has no more stock to give, so the caller can say so.
  bool add(CartItem item) {
    final list = [...items.value];
    final i = list.indexWhere((x) => x.variantId == item.variantId);
    final cap = item.stockQty > 0 ? item.stockQty : 99;
    var accepted = true;
    if (i >= 0) {
      final wanted = list[i].quantity + item.quantity;
      final q = wanted.clamp(1, cap);
      accepted = q > list[i].quantity;
      list[i] = list[i].copyWith(quantity: q);
    } else {
      list.add(item.copyWith(quantity: item.quantity.clamp(1, cap)));
    }
    items.value = list;
    if (accepted) addEvents.value++;
    _changed();
    return accepted;
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
    _changed();
  }

  void remove(String variantId) {
    items.value = items.value.where((x) => x.variantId != variantId).toList();
    _changed();
  }

  void clear() {
    items.value = [];
    coupon = null;
    _changed();
  }

  void _changed() {
    _persist();
    syncNow();
  }

  /// Pushes the basket to the account, fire-and-forget; the server cart is a
  /// convenience mirror the website reads.
  void syncNow() {
    if (!EcomAuth.I.isLoggedIn) return;
    EcomApi.I.syncCart(items.value).catchError((_) {});
  }
}
