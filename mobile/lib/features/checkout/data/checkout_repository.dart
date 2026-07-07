import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_client.dart";
import "../../addresses/data/address_model.dart";
import "../../cart/data/cart_models.dart";

/// What the server hands back from `POST /api/v1/checkout`.
class CheckoutResult {
  final String orderId, orderNumber;
  final num totalAmount;
  final RazorpayOrder? razorpay;
  final CashfreeOrder? cashfree;
  final IciciPayment? icici;

  const CheckoutResult({
    required this.orderId,
    required this.orderNumber,
    required this.totalAmount,
    this.razorpay,
    this.cashfree,
    this.icici,
  });

  factory CheckoutResult.fromJson(Map<String, dynamic> j) {
    final order = (j["order"] as Map).cast<String, dynamic>();
    final rzp   = j["razorpay"] is Map ? (j["razorpay"] as Map).cast<String, dynamic>() : null;
    final cf    = j["cashfree"] is Map ? (j["cashfree"] as Map).cast<String, dynamic>() : null;
    final ic    = j["icici"]    is Map ? (j["icici"]    as Map).cast<String, dynamic>() : null;
    return CheckoutResult(
      orderId:     order["id"]          as String,
      orderNumber: order["orderNumber"] as String,
      totalAmount: num.tryParse("${order["totalAmount"]}") ?? 0,
      razorpay:    rzp != null ? RazorpayOrder.fromJson(rzp) : null,
      cashfree:    cf  != null ? CashfreeOrder.fromJson(cf)  : null,
      icici:       ic  != null ? IciciPayment.fromJson(ic)   : null,
    );
  }
}

// ── Razorpay ──────────────────────────────────────────────────────────────────
class RazorpayOrder {
  final String orderId, keyId, currency;
  final num amount; // in paise

  const RazorpayOrder({
    required this.orderId,
    required this.keyId,
    required this.amount,
    required this.currency,
  });

  factory RazorpayOrder.fromJson(Map<String, dynamic> j) => RazorpayOrder(
        orderId:  j["orderId"]  as String,
        keyId:    j["keyId"]    as String,
        amount:  (j["amount"]   as num?) ?? 0,
        currency: j["currency"] as String? ?? "INR",
      );
}

// ── Cashfree ──────────────────────────────────────────────────────────────────
class CashfreeOrder {
  /// payment_session_id — used by Cashfree Flutter SDK to launch checkout.
  final String sessionId;

  /// Cashfree's internal order ID (cf_order_id).
  final String cashfreeOrderId;

  /// The order_id we passed to Cashfree (= orderNumber).
  final String orderId;

  const CashfreeOrder({
    required this.sessionId,
    required this.cashfreeOrderId,
    required this.orderId,
  });

  factory CashfreeOrder.fromJson(Map<String, dynamic> j) => CashfreeOrder(
        sessionId:       j["sessionId"]       as String,
        cashfreeOrderId: j["cashfreeOrderId"] as String,
        orderId:         j["orderId"]         as String,
      );
}

// ── ICICI Eazypay ─────────────────────────────────────────────────────────────
class IciciPayment {
  /// Encrypted request string for ICICI Eazypay.
  final String encRequest;

  /// ICICI access code.
  final String accessCode;

  /// ICICI payment page URL — open in WebView and POST encRequest + accessCode.
  final String paymentUrl;

  const IciciPayment({
    required this.encRequest,
    required this.accessCode,
    required this.paymentUrl,
  });

  factory IciciPayment.fromJson(Map<String, dynamic> j) => IciciPayment(
        encRequest:  j["encRequest"]  as String,
        accessCode:  j["accessCode"]  as String,
        paymentUrl:  j["paymentUrl"]  as String,
      );
}

// ── Repository ─────────────────────────────────────────────────────────────────
class CheckoutRepository {
  CheckoutRepository(this._api);
  final ApiClient _api;

  Future<CheckoutResult> placeOrder({
    required Address address,
    required List<CartItem> items,
    required String paymentMethod, // "cod" | "razorpay" | "cashfree" | "icici"
    num shippingAmount = 0,
    num discountAmount = 0,
    String? couponCode,
    num walletAmount = 0,
    String? notes,
  }) async {
    final json = await _api.post<Map<String, dynamic>>("/checkout", body: {
      "address":        address.toJson(),
      "paymentMethod":  paymentMethod,
      "shippingAmount": shippingAmount,
      "discountAmount": discountAmount,
      "walletAmount":   walletAmount,
      "couponCode":     couponCode,
      "notes":          notes,
      "items":          items.map((i) => i.toJson()).toList(),
    });
    return CheckoutResult.fromJson(json);
  }

  // ── Verify helpers ─────────────────────────────────────────────────────────

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

  Future<Map<String, dynamic>> verifyCashfreePayment({
    required String orderId,
    required String cashfreeOrderId,
  }) async {
    return _api.post<Map<String, dynamic>>("/checkout/cashfree/verify", body: {
      "orderId":         orderId,
      "cashfreeOrderId": cashfreeOrderId,
    });
  }
}

final checkoutRepositoryProvider = Provider<CheckoutRepository>(
  (ref) => CheckoutRepository(ref.watch(apiClientProvider)),
);
