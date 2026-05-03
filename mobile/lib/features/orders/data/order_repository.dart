import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_client.dart";
import "../../../core/config/env.dart";
import "../../auth/data/auth_controller.dart";
import "order_models.dart";

class OrderReasons {
  final List<String> cancel, ret, exchange;
  const OrderReasons({required this.cancel, required this.ret, required this.exchange});

  factory OrderReasons.fromJson(Map<String, dynamic> j) => OrderReasons(
        cancel:   ((j["cancelReasons"]   as List?) ?? const []).map((e) => "$e").toList(),
        ret:      ((j["returnReasons"]   as List?) ?? const []).map((e) => "$e").toList(),
        exchange: ((j["exchangeReasons"] as List?) ?? const []).map((e) => "$e").toList(),
      );
}

class OrderPolicy {
  final int returnPolicyDays;
  final bool canReturn, canCancel;
  final DateTime? returnDeadlineAt;
  const OrderPolicy({
    required this.returnPolicyDays, required this.canReturn, required this.canCancel,
    this.returnDeadlineAt,
  });
  factory OrderPolicy.fromJson(Map<String, dynamic> j) => OrderPolicy(
        returnPolicyDays: (j["returnPolicyDays"] as num?)?.toInt() ?? 7,
        canReturn: j["canReturn"] == true,
        canCancel: j["canCancel"] == true,
        returnDeadlineAt: j["returnDeadlineAt"] != null
            ? DateTime.tryParse("${j["returnDeadlineAt"]}")
            : null,
      );
}

class OrderDetailResult {
  final Order order;
  final OrderPolicy policy;
  const OrderDetailResult({required this.order, required this.policy});
}

class OrderActionResult {
  final Order order;
  final String? message;
  const OrderActionResult({required this.order, this.message});
}

class OrderRepository {
  OrderRepository(this._api);
  final ApiClient _api;

  Future<List<Order>> list({int page = 1, int limit = 20, String? status}) async {
    final json = await _api.get<Map<String, dynamic>>("/orders", query: {
      "page": "$page", "limit": "$limit",
      if (status != null) "status": status,
    });
    return (json["orders"] as List? ?? const [])
        .map((e) => Order.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<OrderDetailResult> detail(String id) async {
    final json = await _api.get<Map<String, dynamic>>("/orders/$id");
    final policyJson = (json["policy"] as Map?)?.cast<String, dynamic>() ?? const {};
    return OrderDetailResult(
      order:  Order.fromJson((json["order"] as Map).cast<String, dynamic>()),
      policy: OrderPolicy.fromJson(policyJson),
    );
  }

  Future<OrderActionResult> cancel(
    String id, {
    required String reason,
    String? remark,
    String refundMethod = "SOURCE",
  }) async {
    final json = await _api.post<Map<String, dynamic>>("/orders/$id/cancel", body: {
      "reason": reason,
      if (remark != null && remark.isNotEmpty) "remark": remark,
      "refundMethod": refundMethod,
    });
    return OrderActionResult(
      order: Order.fromJson((json["order"] as Map).cast<String, dynamic>()),
      message: json["message"] as String?,
    );
  }

  Future<OrderActionResult> returnOrExchange(
    String id, {
    required String type,           // "RETURN" or "EXCHANGE"
    required String reason,
    String? remark,
    String? refundMethod,
  }) async {
    final json = await _api.post<Map<String, dynamic>>("/orders/$id/return", body: {
      "type": type,
      "reason": reason,
      if (remark != null && remark.isNotEmpty) "remark": remark,
      if (refundMethod != null) "refundMethod": refundMethod,
    });
    return OrderActionResult(
      order: Order.fromJson((json["order"] as Map).cast<String, dynamic>()),
      message: json["message"] as String?,
    );
  }
}

final orderRepositoryProvider = Provider<OrderRepository>(
  (ref) => OrderRepository(ref.watch(apiClientProvider)),
);

final ordersListProvider = FutureProvider<List<Order>>((ref) async {
  final auth = ref.watch(authControllerProvider);
  if (!auth.isLoggedIn) return const [];
  return ref.watch(orderRepositoryProvider).list();
});

final orderDetailProvider = FutureProvider.family<OrderDetailResult, String>((ref, id) {
  return ref.watch(orderRepositoryProvider).detail(id);
});

/// Reasons configured by admin (cancel / return / exchange). Public endpoint
/// at `/api/order-reasons` (NOT under /v1, but we share the same backend).
final orderReasonsProvider = FutureProvider<OrderReasons>((ref) async {
  final dio = Dio(BaseOptions(baseUrl: Env.apiBaseUrl));
  final r = await dio.get<Map<String, dynamic>>("/api/order-reasons");
  return OrderReasons.fromJson(r.data ?? const {});
});
