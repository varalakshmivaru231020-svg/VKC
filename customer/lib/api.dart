import 'package:dio/dio.dart';
import 'models.dart';

/// Talks to the salesproject public API (same backend as the operator app).
/// Override [base] with --dart-define=API_BASE=... for dev.
class Api {
  Api._();
  static final Api I = Api._();

  static const base = String.fromEnvironment('API_BASE', defaultValue: 'https://api.vlgroups.com/api');

  final Dio _dio = Dio(BaseOptions(
    baseUrl: base,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 20),
  ));

  // ── Live ──────────────────────────────────────────────────────────────────

  /// Currently-live sessions. GET /public/sessions/live
  Future<List<LiveSession>> liveSessions() async {
    final r = await _dio.get('/public/sessions/live');
    final data = (r.data['data'] ?? r.data) as List? ?? [];
    return data.map((e) => LiveSession.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Shows the host has scheduled but not started. GET /public/sessions/upcoming
  Future<List<LiveSession>> upcomingSessions() async {
    final r = await _dio.get('/public/sessions/upcoming');
    final data = (r.data['data'] ?? r.data) as List? ?? [];
    return data.map((e) => LiveSession.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Finished shows — the products stay browsable. GET /public/sessions/past
  Future<List<LiveSession>> pastSessions() async {
    final r = await _dio.get('/public/sessions/past');
    final data = (r.data['data'] ?? r.data) as List? ?? [];
    return data.map((e) => LiveSession.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// A live session's product feed + stream. GET /public/live/:liveId/products
  Future<LiveDetail> liveDetail(String liveId) async {
    final r = await _dio.get('/public/live/$liveId/products');
    return LiveDetail.fromJson(r.data['data'] as Map<String, dynamic>);
  }

  /// Chat messages. GET /public/live/:liveId/chat (after=ISO ts)
  Future<List<ChatMessage>> liveChat(String liveId, {DateTime? after}) async {
    final r = await _dio.get('/public/live/$liveId/chat',
        queryParameters: {if (after != null) 'after': after.toUtc().toIso8601String()});
    final data = (r.data['data'] ?? []) as List;
    return data.map((e) => ChatMessage.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Post a chat message. POST /public/live/:liveId/chat
  Future<ChatMessage> sendChat(String liveId, String name, String message) async {
    final r = await _dio.post('/public/live/$liveId/chat', data: {'name': name, 'message': message});
    return ChatMessage.fromJson(r.data['data'] as Map<String, dynamic>);
  }

  // ── Catalog ───────────────────────────────────────────────────────────────

  /// Publicly buyable products. GET /public/inventory (mode as a query flag)
  /// mode: 'full' (LIVE + CLOSED), 'live', or 'sale'. Returns real products
  /// with UUIDs + photos; falls back to [] on any error so the UI can use the
  /// static design catalog instead.
  Future<List<Product>> inventory({String mode = 'full', int limit = 200}) async {
    try {
      final r = await _dio.get('/public/inventory', queryParameters: {mode: 1, 'limit': limit});
      final data = (r.data['data'] ?? {}) as Map<String, dynamic>;
      final list = (data['products'] ?? []) as List;
      return list.map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  // ── Orders + tracking ───────────────────────────────────────────────────────

  /// Makes sure the shopper exists in the live backend's customer book, and
  /// returns their record. POST /public/customers is find-or-create.
  ///
  /// Live runs on the sales backend, which keeps its own customer table — a
  /// shopper who signed up in the app exists in the store's account system but
  /// not necessarily here, which is why placing a live order used to fail with
  /// "Customer not found" for a perfectly valid number.
  Future<Map<String, dynamic>> ensureCustomer({
    required String phone,
    required String name,
  }) async {
    final r = await _dio.post('/public/customers', data: {
      'phone': phone,
      'name': name,
    });
    return ((r.data['data'] ?? r.data) as Map).cast<String, dynamic>();
  }

  /// Place a public order for one live product. POST /public/orders
  /// Requires a real product UUID and a registered customer's phone.
  /// Returns the created { orderId, orderNumber, price, ... }.
  Future<Map<String, dynamic>> placeOrder({
    required String productId,
    required String customerPhone,
    int quantity = 1,
  }) async {
    final r = await _dio.post('/public/orders', data: {
      'productId': productId,
      'customerPhone': customerPhone,
      'quantity': quantity,
    });
    return (r.data['data'] ?? r.data) as Map<String, dynamic>;
  }

  /// Order + tracking. GET /public/order/:orderNumber?phone=<10 digits>
  /// Phone is a required second factor (order numbers are guessable).
  Future<OrderView> order(String orderNumber, String phone) async {
    final r = await _dio.get('/public/order/$orderNumber',
        queryParameters: {'phone': phone});
    return OrderView.fromJson((r.data['data'] ?? r.data) as Map<String, dynamic>);
  }

  /// A customer's own orders by mobile. GET /public/customer/orders?phone=&name=
  Future<List<OrderView>> customerOrders(String phone, {String? name}) async {
    final r = await _dio.get('/public/customer/orders', queryParameters: {
      'phone': phone,
      if (name != null && name.trim().isNotEmpty) 'name': name.trim(),
      'limit': 50,
    });
    final data = (r.data['data'] ?? {}) as Map<String, dynamic>;
    final orders = (data['orders'] ?? []) as List;
    return orders.map((e) => OrderView.fromJson(e as Map<String, dynamic>)).toList();
  }
}
