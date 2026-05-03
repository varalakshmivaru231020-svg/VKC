/// Compile-time environment. Override per build with `--dart-define`:
///
///   flutter run --dart-define=API_BASE_URL=https://vijaylakshmi.bestprime.live
///
/// Values come from `String.fromEnvironment` so they're constants in release
/// builds and tree-shakeable.
class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    "API_BASE_URL",
    defaultValue: "https://vijaylakshmi.bestprime.live",
  );

  /// Where uploaded images live. Defaults to production so images keep
  /// working even when API points at a local dev server (which doesn't host
  /// the uploaded files).
  static const String imageBaseUrl = String.fromEnvironment(
    "IMAGE_BASE_URL",
    defaultValue: "https://vijaylakshmi.bestprime.live",
  );

  static const String apiVersionPrefix = "/api/v1";

  /// Set to "true" to dump request/response payloads to console.
  static const String enableNetworkLogs = String.fromEnvironment(
    "ENABLE_NETWORK_LOGS",
    defaultValue: "true",
  );
  static bool get logNetwork => enableNetworkLogs == "true";

  /// Sentry DSN — leave empty to disable.
  static const String sentryDsn = String.fromEnvironment("SENTRY_DSN");

  /// Build flavour: "dev" | "staging" | "prod"
  static const String flavour = String.fromEnvironment("FLAVOUR", defaultValue: "dev");

  static String get apiUrl => "$apiBaseUrl$apiVersionPrefix";
}
