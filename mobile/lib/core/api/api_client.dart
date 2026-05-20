import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:pretty_dio_logger/pretty_dio_logger.dart";

import "../config/env.dart";
import "../errors/failures.dart";
import "../storage/secure_storage.dart";
import "interceptors/auth_interceptor.dart";

/// Thin wrapper over Dio that:
/// - Bases all requests at `Env.apiUrl`
/// - Attaches Bearer auth + auto-refreshes on 401
/// - Converts DioException → typed `Failure`
/// - Logs request/response payloads in dev builds
class ApiClient {
  ApiClient(this._dio);
  final Dio _dio;

  Future<T> get<T>(String path, {Map<String, dynamic>? query, Options? options, CancelToken? cancelToken}) =>
      _wrap(() => _dio.get<dynamic>(path, queryParameters: query, options: options, cancelToken: cancelToken)).then((v) => v as T);

  Future<T> post<T>(String path, {Object? body, Map<String, dynamic>? query, Options? options, CancelToken? cancelToken}) =>
      _wrap(() => _dio.post<dynamic>(path, data: body, queryParameters: query, options: options, cancelToken: cancelToken)).then((v) => v as T);

  Future<T> patch<T>(String path, {Object? body, Map<String, dynamic>? query, Options? options, CancelToken? cancelToken}) =>
      _wrap(() => _dio.patch<dynamic>(path, data: body, queryParameters: query, options: options, cancelToken: cancelToken)).then((v) => v as T);

  Future<T> delete<T>(String path, {Object? body, Map<String, dynamic>? query, Options? options, CancelToken? cancelToken}) =>
      _wrap(() => _dio.delete<dynamic>(path, data: body, queryParameters: query, options: options, cancelToken: cancelToken)).then((v) => v as T);

  Future<dynamic> _wrap(Future<Response<dynamic>> Function() send) async {
    try {
      final r = await send();
      return r.data;
    } on DioException catch (e) {
      throw failureFromDio(e);
    } catch (e) {
      throw UnknownFailure(e.toString());
    }
  }
}

/// Provider — wires Dio with interceptors and exposes ApiClient.
final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);

  final dio = Dio(BaseOptions(
    baseUrl: Env.apiUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
    sendTimeout:    const Duration(seconds: 30),
    contentType: "application/json",
    responseType: ResponseType.json,
  ));

  dio.interceptors.add(AuthInterceptor(
    storage,
    onRefreshFailed: () async {
      await storage.clear();
      // The auth state notifier (added in Phase 2) will detect token absence
      // and redirect via go_router's redirect callback.
    },
  ));

  if (Env.logNetwork) {
    dio.interceptors.add(PrettyDioLogger(
      requestHeader: false,
      requestBody: true,
      responseHeader: false,
      responseBody: false,
      compact: true,
      maxWidth: 100,
    ));
  }

  return ApiClient(dio);
});
