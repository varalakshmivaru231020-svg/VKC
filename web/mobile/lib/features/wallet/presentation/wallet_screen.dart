import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:intl/intl.dart";

import "../../../core/errors/failures.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/utils/formatters.dart";
import "../../../core/widgets/state_widgets.dart";
import "../data/wallet_repository.dart";

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wallet = ref.watch(walletProvider);
    final theme  = Theme.of(context);
    final colors = context.appColors;

    return Scaffold(
      appBar: AppBar(title: const Text("My wallet")),
      body: wallet.when(
        loading: () => const AppLoading(),
        error: (e, _) => AppErrorView(
          failure: e is Failure ? e : UnknownFailure(e.toString()),
          onRetry: () => ref.invalidate(walletProvider),
        ),
        data: (state) => RefreshIndicator(
          onRefresh: () => ref.refresh(walletProvider.future),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [theme.colorScheme.primary, theme.colorScheme.primary.withOpacity(0.8)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Wallet balance",
                        style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 13)),
                    const SizedBox(height: 8),
                    Text(formatINR(state.balance),
                        style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    Text("Use your wallet at checkout to save on your next order.",
                        style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Text("Recent activity",
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.2, color: colors.textMuted)),
              const SizedBox(height: 8),
              if (state.transactions.isEmpty)
                Container(
                  padding: const EdgeInsets.all(24),
                  alignment: Alignment.center,
                  child: Text("No transactions yet", style: theme.textTheme.bodyMedium?.copyWith(color: colors.textMuted)),
                )
              else
                ...state.transactions.map((t) => _TxnTile(txn: t)),
            ],
          ),
        ),
      ),
    );
  }
}

class _TxnTile extends StatelessWidget {
  const _TxnTile({required this.txn});
  final WalletTransaction txn;

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final colors = context.appColors;
    final credit = txn.type == "CREDIT";
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: colors.parchment),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: (credit ? colors.success : theme.colorScheme.error).withOpacity(0.12),
            child: Icon(credit ? Icons.add : Icons.remove,
                color: credit ? colors.success : theme.colorScheme.error, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(txn.reason, style: theme.textTheme.bodyMedium),
                Text(DateFormat("d MMM yyyy · h:mm a").format(txn.createdAt),
                    style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text("${credit ? '+' : '−'} ${formatINR(txn.amount)}",
                  style: TextStyle(color: credit ? colors.success : theme.colorScheme.error, fontWeight: FontWeight.w600)),
              Text("Bal ${formatINR(txn.balance)}",
                  style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
            ],
          ),
        ],
      ),
    );
  }
}
