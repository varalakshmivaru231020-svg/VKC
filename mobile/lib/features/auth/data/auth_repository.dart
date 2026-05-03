import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_client.dart";
import "user_model.dart";

class AuthRepository {
  AuthRepository(this._api);
  final ApiClient _api;

  /// POST /auth/otp/send → returns whether this is a new user.
  Future<({bool isNew, String? devCode})> sendOtp(String phone) async {
    final json = await _api.post<Map<String, dynamic>>(
      "/auth/otp/send",
      body: {"phone": phone},
    );
    return (
      isNew:   json["isNew"] == true,
      devCode: json["devCode"] as String?,
    );
  }

  /// POST /auth/otp/verify → returns AuthSession (user + tokens).
  Future<AuthSession> verifyOtp({required String phone, required String otp, String? name}) async {
    final json = await _api.post<Map<String, dynamic>>(
      "/auth/otp/verify",
      body: {
        "phone": phone,
        "otp":   otp,
        if (name != null && name.isNotEmpty) "name": name,
      },
    );
    return AuthSession.fromJson(json);
  }

  /// GET /auth/me → fetch current user (used on app start to validate token).
  Future<User> me() async {
    final json = await _api.get<Map<String, dynamic>>("/auth/me");
    return User.fromJson((json["user"] as Map).cast<String, dynamic>());
  }

  /// POST /auth/logout (stateless server side).
  Future<void> logout() async {
    try {
      await _api.post<dynamic>("/auth/logout");
    } catch (_) {
      // Best-effort; tokens are cleared client-side regardless.
    }
  }
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(apiClientProvider)),
);
