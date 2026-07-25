import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_client.dart";
import "../../auth/data/auth_controller.dart";

class WalletTransaction {
  final String id, type, reason;
  final num amount, balance;
  final DateTime createdAt;
  const WalletTransaction({required this.id, required this.type, required this.reason,
      required this.amount, required this.balance, required this.createdAt});
  factory WalletTransaction.fromJson(Map<String, dynamic> j) => WalletTransaction(
        id: j["id"] as String,
        type:   j["type"]   as String? ?? "",
        reason: j["reason"] as String? ?? "",
        amount:  num.tryParse("${j["amount"]}")  ?? 0,
        balance: num.tryParse("${j["balance"]}") ?? 0,
        createdAt: DateTime.tryParse("${j["createdAt"]}") ?? DateTime.now(),
      );
}

class WalletState {
  final num balance;
  final List<WalletTransaction> transactions;
  const WalletState({required this.balance, required this.transactions});
}

final walletRepositoryProvider = Provider<WalletRepository>(
  (ref) => WalletRepository(ref.watch(apiClientProvider)),
);

class WalletRepository {
  WalletRepository(this._api);
  final ApiClient _api;

  Future<WalletState> fetch() async {
    final j = await _api.get<Map<String, dynamic>>("/wallet");
    return WalletState(
      balance: num.tryParse("${j["balance"]}") ?? 0,
      transactions: (j["transactions"] as List? ?? const [])
          .map((t) => WalletTransaction.fromJson((t as Map).cast<String, dynamic>()))
          .toList(),
    );
  }
}

final walletProvider = FutureProvider<WalletState>((ref) async {
  final auth = ref.watch(authControllerProvider);
  if (!auth.isLoggedIn) return const WalletState(balance: 0, transactions: []);
  return ref.watch(walletRepositoryProvider).fetch();
});
