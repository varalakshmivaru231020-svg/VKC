import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_client.dart";
import "../../auth/data/auth_controller.dart";
import "order_models.dart";

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

  Future<Order> detail(String id) async {
    final json = await _api.get<Map<String, dynamic>>("/orders/$id");
    return Order.fromJson((json["order"] as Map).cast<String, dynamic>());
  }

  Future<Order> cancel(String id, {required String reason, String refundMethod = "SOURCE"}) async {
    final json = await _api.post<Map<String, dynamic>>("/orders/$id/cancel", body: {
      "reason": reason, "refundMethod": refundMethod,
    });
    return Order.fromJson((json["order"] as Map).cast<String, dynamic>());
  }

  Future<Order> returnOrExchange(String id, {required String type, required String reason, String? refundMethod}) async {
    final json = await _api.post<Map<String, dynamic>>("/orders/$id/return", body: {
      "type": type,    // "RETURN" or "EXCHANGE"
      "reason": reason,
      if (refundMethod != null) "refundMethod": refundMethod,
    });
    return Order.fromJson((json["order"] as Map).cast<String, dynamic>());
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

final orderDetailProvider = FutureProvider.family<Order, String>((ref, id) {
  return ref.watch(orderRepositoryProvider).detail(id);
});
