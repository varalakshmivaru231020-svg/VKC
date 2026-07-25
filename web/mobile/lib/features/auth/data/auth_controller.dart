import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/errors/failures.dart";
import "../../../core/storage/secure_storage.dart";
import "auth_repository.dart";
import "user_model.dart";

/// Sealed-style state union — using a single class with nullable fields keeps
/// it simple and free of codegen.
class AuthState {
  /// `true` while we're verifying the bootstrap token (splash → /auth/me).
  final bool initializing;
  final User? user;

  const AuthState({required this.initializing, required this.user});

  bool get isLoggedIn  => user != null;
  bool get isLoggedOut => !initializing && user == null;

  static const unknown = AuthState(initializing: true,  user: null);
  static const loggedOut = AuthState(initializing: false, user: null);
  AuthState copyLoggedIn(User u) => AuthState(initializing: false, user: u);
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repo, this._storage) : super(AuthState.unknown);

  final AuthRepository _repo;
  final SecureStorage _storage;

  /// Restore session on cold start. Tries the access token first; if it fails
  /// (Dio interceptor will silently refresh), falls back to logged-out.
  Future<void> bootstrap() async {
    final token = await _storage.readAccessToken();
    if (token == null || token.isEmpty) {
      state = AuthState.loggedOut;
      return;
    }
    try {
      final user = await _repo.me();
      state = state.copyLoggedIn(user);
    } catch (_) {
      await _storage.clear();
      state = AuthState.loggedOut;
    }
  }

  /// Phase 1 of login. Returns the dev code in non-prod for QA convenience.
  Future<({bool isNew, String? devCode})> sendOtp(String phone) {
    return _repo.sendOtp(phone);
  }

  /// Phase 2 of login. Persists tokens and updates state.
  /// Throws a [Failure] on bad OTP / network.
  Future<void> verifyOtp({required String phone, required String otp, String? name}) async {
    final session = await _repo.verifyOtp(phone: phone, otp: otp, name: name);
    await _storage.writeAccessToken(session.accessToken);
    await _storage.writeRefreshToken(session.refreshToken);
    await _storage.writeUserId(session.user.id);
    state = state.copyLoggedIn(session.user);
  }

  Future<void> logout() async {
    await _repo.logout();
    await _storage.clear();
    state = AuthState.loggedOut;
  }

  /// Update local user copy after profile edits without re-fetching.
  void setUser(User user) {
    state = state.copyLoggedIn(user);
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(
    ref.watch(authRepositoryProvider),
    ref.watch(secureStorageProvider),
  );
});

/// Convenience selectors so widgets don't rebuild on unrelated state changes.
final isLoggedInProvider = Provider<bool>((ref) => ref.watch(authControllerProvider).isLoggedIn);
final currentUserProvider = Provider<User?>((ref) => ref.watch(authControllerProvider).user);
