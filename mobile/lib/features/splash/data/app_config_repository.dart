import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_client.dart";
import "app_config_model.dart";

class AppConfigRepository {
  AppConfigRepository(this._api);
  final ApiClient _api;

  Future<AppConfig> fetch() async {
    final json = await _api.get<Map<String, dynamic>>("/app-config");
    return AppConfig.fromJson(json);
  }
}

final appConfigRepositoryProvider = Provider<AppConfigRepository>(
  (ref) => AppConfigRepository(ref.watch(apiClientProvider)),
);

/// Loaded once at startup; UI consumers depend on this to render dynamic
/// branding (logo, colors, fonts, footer, etc.). Refresh by calling
/// `ref.invalidate(appConfigProvider)`.
final appConfigProvider = FutureProvider<AppConfig>((ref) async {
  return ref.watch(appConfigRepositoryProvider).fetch();
});
