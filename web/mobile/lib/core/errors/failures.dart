import "package:dio/dio.dart";

/// Base failure type used across the app. All API/repository methods return
/// `Future<T>` and *throw* a `Failure` so callers can pattern-match on the
/// concrete subtype to choose UX (retry banner vs full error screen vs toast).
sealed class Failure implements Exception {
  final String message;
  final Object? cause;
  final StackTrace? stack;
  const Failure(this.message, {this.cause, this.stack});

  @override
  String toString() => "$runtimeType: $message";
}

class NetworkFailure extends Failure {
  const NetworkFailure([String message = "No internet connection"]) : super(message);
}

class TimeoutFailure extends Failure {
  const TimeoutFailure([String message = "Request timed out"]) : super(message);
}

class ServerFailure extends Failure {
  final int? statusCode;
  const ServerFailure(super.message, {this.statusCode});
}

class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure([String message = "Please log in again"]) : super(message);
}

class ValidationFailure extends Failure {
  final Map<String, String>? fieldErrors;
  const ValidationFailure(super.message, {this.fieldErrors});
}

class NotFoundFailure extends Failure {
  const NotFoundFailure([String message = "Not found"]) : super(message);
}

class UnknownFailure extends Failure {
  const UnknownFailure([String message = "Something went wrong"]) : super(message);
}

/// Convert a Dio exception into a typed Failure.
Failure failureFromDio(DioException e) {
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return const TimeoutFailure();
    case DioExceptionType.connectionError:
      return const NetworkFailure();
    case DioExceptionType.cancel:
      return const UnknownFailure("Request cancelled");
    case DioExceptionType.badCertificate:
      return const ServerFailure("Bad SSL certificate");
    case DioExceptionType.unknown:
      return UnknownFailure(e.message ?? "Unknown error");
    case DioExceptionType.badResponse:
      final code = e.response?.statusCode;
      final data = e.response?.data;
      final msg = (data is Map && data["error"] is String)
          ? data["error"] as String
          : "Request failed (${code ?? '-'})";
      if (code == 401) return UnauthorizedFailure(msg);
      if (code == 404) return NotFoundFailure(msg);
      if (code == 400 || code == 422) {
        Map<String, String>? fields;
        if (data is Map && data["fields"] is Map) {
          fields = (data["fields"] as Map).map((k, v) => MapEntry("$k", "$v"));
        }
        return ValidationFailure(msg, fieldErrors: fields);
      }
      return ServerFailure(msg, statusCode: code);
  }
}
