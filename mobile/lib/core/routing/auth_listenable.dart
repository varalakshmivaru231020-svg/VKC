import "package:flutter/foundation.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../features/auth/data/auth_controller.dart";

/// Adapts the Riverpod auth state into a Listenable so go_router's
/// `refreshListenable` can re-evaluate redirects whenever login/logout occurs.
class AuthChangeNotifier extends ChangeNotifier {
  AuthChangeNotifier(this._ref) {
    _sub = _ref.listen(
      authControllerProvider,
      (previous, next) {
        if (previous?.isLoggedIn != next.isLoggedIn ||
            previous?.initializing != next.initializing) {
          notifyListeners();
        }
      },
    );
  }

  final Ref _ref;
  ProviderSubscription<AuthState>? _sub;

  @override
  void dispose() {
    _sub?.close();
    super.dispose();
  }
}

final authChangeNotifierProvider = Provider<AuthChangeNotifier>((ref) {
  final notifier = AuthChangeNotifier(ref);
  ref.onDispose(notifier.dispose);
  return notifier;
});
