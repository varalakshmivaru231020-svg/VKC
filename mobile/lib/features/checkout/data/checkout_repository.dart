import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_client.dart";
import "../../addresses/data/address_model.dart";
import "../../cart/data/cart_models.dart";

/// What the server hands back from `POST /api/v1/checkout`.
/// `razorpay` is non-null only if the order needs payment via Razorpay.
class CheckoutResult {
  final String orderId, orderNumber;
  final num totalAmount;
  final RazorpayOrder? razorpay;

  const CheckoutResult({
    required this.orderId, required this.orderNumber, required this.totalAmount,
    this.razorpay,
  });

  factory CheckoutResult.fromJson(Map<String, dynamic> j) {
    final order = (j["order"] as Map).cast<String, dynamic>();
    final rzp   = j["razorpay"] is Map ? (j["razorpay"] as Map).cast<String, dynamic>() : null;
    return CheckoutResult(
      orderId:     order["id"]          as String,
      orderNumber: order["orderNumber"] as String,
      totalAmount: num.tryParse("${order["totalAmount"]}") ?? 0,
      razorpay:    rzp != null ? RazorpayOrder.fromJson(rzp) : null,
    );
  }
}

class RazorpayOrder {
  final String orderId, keyId, currency;
  final num amount;          // in paise
  const RazorpayOrder({required this.orderId, required this.keyId, required this.amount, required this.currency});
  factory RazorpayOrder.fromJson(Map<String, dynamic> j) => RazorpayOrder(
        orderId:  j["orderId"]  as String,
        keyId:    j["keyId"]    as String,
        amount:  (j["amount"]   as num?) ?? 0,
        currency: j["currency"] as String? ?? "INR",
      );
}

class CheckoutRepository {
  CheckoutRepository(this._api);
  final ApiClient _api;

  Future<CheckoutResult> placeOrder({
    required Address address,
    required List<CartItem> items,
    required String paymentMethod,        // "cod" | "razorpay"
    num shippingAmount = 0,
    num discountAmount = 0,
    String? couponCode,
    num walletAmount = 0,
    String? notes,
  }) async {
    final json = await _api.post<Map<String, dynamic>>("/checkout", body: {
      "address":         address.toJson(),
      "paymentMethod":   paymentMethod,
      "shippingAmount":  shippingAmount,
      "discountAmount":  discountAmount,
      "walletAmount":    walletAmount,
      "couponCode":      couponCode,
      "notes":           notes,
      "items":           items.map((i) => i.toJson()).toList(),
    });
    return CheckoutResult.fromJson(json);
  }

  Future<void> verifyRazorpayPayment({
    required String orderId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    await _api.post<dynamic>("/checkout/razorpay/verify", body: {
      "orderId":           orderId,
      "razorpayOrderId":   razorpayOrderId,
      "razorpayPaymentId": razorpayPaymentId,
      "razorpaySignature": razorpaySignature,
    });
  }
}

final checkoutRepositoryProvider = Provider<CheckoutRepository>(
  (ref) => CheckoutRepository(ref.watch(apiClientProvider)),
);
