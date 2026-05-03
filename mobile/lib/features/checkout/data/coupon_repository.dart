import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_client.dart";

/// One coupon offer the storefront can show / let the user pick.
class CouponOffer {
  final String code;
  final String type;          // PERCENTAGE | FIXED | FREE_SHIPPING
  final num value;
  final num? minOrderAmount;
  final num? maxDiscount;
  final String description;
  final DateTime? expiresAt;

  const CouponOffer({
    required this.code, required this.type, required this.value,
    required this.description,
    this.minOrderAmount, this.maxDiscount, this.expiresAt,
  });

  factory CouponOffer.fromJson(Map<String, dynamic> j) => CouponOffer(
        code: j["code"] as String,
        type: j["type"] as String? ?? "FIXED",
        value: (j["value"] as num?) ?? 0,
        description: j["description"] as String? ?? "",
        minOrderAmount: j["minOrderAmount"] is num ? j["minOrderAmount"] as num : null,
        maxDiscount:    j["maxDiscount"]    is num ? j["maxDiscount"]    as num : null,
        expiresAt: j["expiresAt"] != null ? DateTime.tryParse("${j["expiresAt"]}") : null,
      );
}

/// Result of validating a coupon against the current cart subtotal.
class CouponValidation {
  final String code;
  final num discount;
  final bool freeShipping;
  final String description;
  const CouponValidation({
    required this.code, required this.discount,
    required this.freeShipping, required this.description,
  });
  factory CouponValidation.fromJson(Map<String, dynamic> j) => CouponValidation(
        code: j["code"] as String,
        discount: (j["discount"] as num?) ?? 0,
        freeShipping: j["freeShipping"] == true,
        description: j["description"] as String? ?? "",
      );
}

class CouponRepository {
  CouponRepository(this._api);
  final ApiClient _api;

  Future<List<CouponOffer>> list() async {
    final json = await _api.get<Map<String, dynamic>>("/coupons");
    return (json["coupons"] as List? ?? const [])
        .map((e) => CouponOffer.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  /// Throws a `Failure` (typed by the API client) if the coupon isn't valid.
  Future<CouponValidation> validate({required String code, required num subtotal}) async {
    final json = await _api.post<Map<String, dynamic>>(
      "/coupons/validate",
      body: {"code": code, "subtotal": subtotal},
    );
    return CouponValidation.fromJson(json);
  }
}

final couponRepositoryProvider = Provider<CouponRepository>(
  (ref) => CouponRepository(ref.watch(apiClientProvider)),
);

final availableCouponsProvider = FutureProvider<List<CouponOffer>>(
  (ref) => ref.watch(couponRepositoryProvider).list(),
);
