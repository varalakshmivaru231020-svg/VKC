import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:intl/intl.dart";

import "../../../core/errors/failures.dart";
import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/utils/formatters.dart";
import "../../../core/widgets/app_image.dart";
import "../../../core/widgets/state_widgets.dart";
import "../data/order_models.dart";
import "../data/order_repository.dart";

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(ordersListProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("My orders")),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(ordersListProvider.future),
        child: list.when(
          loading: () => const AppLoading(),
          error: (e, _) => AppErrorView(
            failure: e is Failure ? e : UnknownFailure(e.toString()),
            onRetry: () => ref.invalidate(ordersListProvider),
          ),
          data: (orders) {
            if (orders.isEmpty) {
              return AppEmpty(
                title: "No orders yet",
                description: "Your orders will appear here.",
                icon: Icons.receipt_long_outlined,
                action: ElevatedButton(
                  onPressed: () => context.go(RoutePaths.shop),
                  child: const Text("Start shopping"),
                ),
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              itemCount: orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) => _OrderCard(order: orders[i]),
            );
          },
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order});
  final Order order;

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final colors = context.appColors;
    final firstItem = order.items.isNotEmpty ? order.items.first : null;

    return InkWell(
      onTap: () => context.push(RoutePaths.orderDetail(order.id)),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: colors.parchment),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text("#${order.orderNumber}", style: theme.textTheme.titleSmall),
                ),
                _StatusChip(status: order.status),
              ],
            ),
            const SizedBox(height: 4),
            Text(DateFormat("d MMM yyyy").format(order.createdAt),
                style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
            const SizedBox(height: 12),
            if (firstItem != null)
              Row(
                children: [
                  SizedBox(
                    width: 56, height: 72,
                    child: AppImage(url: firstItem.imageUrl, borderRadius: BorderRadius.circular(6)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(firstItem.productName,
                            style: theme.textTheme.bodyMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 4),
                        Text("${order.items.length} item${order.items.length == 1 ? '' : 's'} · ${formatINR(order.totalAmount)}",
                            style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right_rounded, color: colors.textMuted),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    Color bg, fg;
    switch (status) {
      case "DELIVERED":          bg = colors.success.withOpacity(0.15); fg = colors.success; break;
      case "CANCELLED":
      case "REFUNDED":           bg = const Color(0xFFFCE7E7); fg = const Color(0xFFB22222); break;
      case "SHIPPED":            bg = const Color(0xFFEEF2FF); fg = const Color(0xFF4338CA); break;
      case "RETURN_REQUESTED":
      case "EXCHANGE_REQUESTED": bg = const Color(0xFFFEF3C7); fg = const Color(0xFFD97706); break;
      default:                   bg = colors.primary50;        fg = Theme.of(context).colorScheme.primary;
    }
    final label = status.split("_").map((s) => s.isEmpty ? s : s[0] + s.substring(1).toLowerCase()).join(" ");
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(4)),
      child: Text(label, style: TextStyle(color: fg, fontWeight: FontWeight.w600, fontSize: 11)),
    );
  }
}
