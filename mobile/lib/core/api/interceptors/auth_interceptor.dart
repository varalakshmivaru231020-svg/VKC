import "package:dio/dio.dart";

import "../../config/env.dart";
import "../../storage/secure_storage.dart";

/// Attaches the Bearer access token to every request, and on 401 attempts a
/// silent refresh using the stored refresh token. If refresh fails, clears
/// tokens and surfaces a 401 to the caller (the UI auth listener handles
/// route redirects).
class AuthInterceptor extends QueuedInterceptor {
  AuthInterceptor(this._storage, {required this.onRefreshFailed});

  final SecureStorage _storage;
  final Future<void> Function() onRefreshFailed;

  // Used internally to perform the refresh request without recursing.
  late final Dio _refreshDio = Dio(BaseOptions(
    baseUrl: Env.apiUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
  ));

  bool _isPublic(RequestOptions o) {
    final p = o.path;
    return p.contains("/auth/otp/send")
        || p.contains("/auth/otp/verify")
        || p.contains("/auth/refresh")
        || p.contains("/app-config")
        || p.contains("/categories")
        || p.contains("/products")        // listing/detail are public reads
        || p.contains("/hero-slides")
        || p.contains("/banners")
        || p.contains("/popups")
        || p.contains("/blogs")
        || p.contains("/coupons")
        || p.contains("/track/");
  }

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (!_isPublic(options)) {
      final token = await _storage.readAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers["Authorization"] = "Bearer $token";
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final response = err.response;
    final status = response?.statusCode;
    final isAuthCall = err.requestOptions.path.contains("/auth/");

    if (status != 401 || isAuthCall) {
      return handler.next(err);
    }

    final refreshToken = await _storage.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      await onRefreshFailed();
      return handler.next(err);
    }

    try {
      final r = await _refreshDio.post("/auth/refresh", data: {"refreshToken": refreshToken});
      final newAccess  = r.data["accessToken"]  as String?;
      final newRefresh = r.data["refreshToken"] as String?;
      if (newAccess == null) throw Exception("No access token in refresh response");

      await _storage.writeAccessToken(newAccess);
      if (newRefresh != null) await _storage.writeRefreshToken(newRefresh);

      // Retry the original request with the new token.
      final retryOptions = err.requestOptions;
      retryOptions.headers["Authorization"] = "Bearer $newAccess";
      final retried = await _refreshDio.fetch(retryOptions);
      return handler.resolve(retried);
    } catch (_) {
      await onRefreshFailed();
      return handler.next(err);
    }
  }
}
