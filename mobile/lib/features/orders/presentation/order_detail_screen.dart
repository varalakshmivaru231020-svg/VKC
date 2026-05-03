import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:intl/intl.dart";
import "package:url_launcher/url_launcher.dart";

import "../../../core/config/env.dart";
import "../../../core/errors/failures.dart";
import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/utils/formatters.dart";
import "../../../core/widgets/app_image.dart";
import "../../../core/widgets/state_widgets.dart";
import "../data/order_models.dart";
import "../data/order_repository.dart";
import "order_action_sheet.dart";

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key, required this.orderId});
  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(orderDetailProvider(orderId));
    return Scaffold(
      appBar: AppBar(title: const Text("Order details")),
      body: detail.when(
        loading: () => const AppLoading(),
        error: (e, _) => AppErrorView(
          failure: e is Failure ? e : UnknownFailure(e.toString()),
          onRetry: () => ref.invalidate(orderDetailProvider(orderId)),
        ),
        data: (data) => _Body(order: data.order, policy: data.policy),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.order, required this.policy});
  final Order order;
  final OrderPolicy policy;

  Future<void> _runAction(BuildContext context, OrderAction action) async {
    final message = await showOrderActionSheet(context, orderId: order.id, action: action);
    if (message != null && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
      ));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme  = Theme.of(context);
    final colors = context.appColors;
    final addr = order.shippingAddress;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: [
        _Card(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text("#${order.orderNumber}", style: theme.textTheme.titleMedium)),
            Text(order.status, style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.w600)),
          ]),
          const SizedBox(height: 4),
          Text(DateFormat("EEEE, d MMMM yyyy · h:mm a").format(order.createdAt),
              style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
          if (order.trackingNumber != null) ...[
            const SizedBox(height: 12),
            Text("Tracking: ${order.trackingNumber}", style: theme.textTheme.bodySmall),
            if (order.trackingUrl != null)
              TextButton(
                onPressed: () => launchUrl(Uri.parse(order.trackingUrl!), mode: LaunchMode.externalApplication),
                child: const Text("Track shipment"),
              ),
          ],
          if (policy.canReturn && policy.returnDeadlineAt != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(color: colors.primary50, borderRadius: BorderRadius.circular(4)),
              child: Text(
                "Returns accepted until ${DateFormat("d MMM yyyy").format(policy.returnDeadlineAt!)}",
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ])),
        const SizedBox(height: 12),

        _SectionLabel("Items (${order.items.length})"),
        ...order.items.map((it) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: _Card(child: Row(
            children: [
              SizedBox(width: 56, height: 72, child: AppImage(url: it.imageUrl, borderRadius: BorderRadius.circular(6))),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    InkWell(
                      onTap: it.productSlug != null ? () => context.push(RoutePaths.productDetail(it.productSlug!)) : null,
                      child: Text(it.productName, style: theme.textTheme.bodyMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
                    ),
                    const SizedBox(height: 4),
                    Text("${it.variantColor} · Qty ${it.quantity}",
                        style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
                  ],
                ),
              ),
              Text(formatINR(it.totalPrice),
                  style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary)),
            ],
          )),
        )),

        if (addr != null) ...[
          const SizedBox(height: 4),
          _SectionLabel("Delivery address"),
          _Card(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(addr["fullName"] as String? ?? "", style: theme.textTheme.titleSmall),
              const SizedBox(height: 4),
              Text(
                "${addr["addressLine1"] ?? ""}${addr["addressLine2"] != null && (addr["addressLine2"] as String).isNotEmpty ? ', ${addr["addressLine2"]}' : ''}, ${addr["city"] ?? ""}, ${addr["state"] ?? ""} — ${addr["pincode"] ?? ""}",
                style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted),
              ),
              if (addr["phone"] != null) Text(addr["phone"] as String, style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
            ],
          )),
        ],

        const SizedBox(height: 4),
        _SectionLabel("Payment summary"),
        _Card(child: Column(
          children: [
            _row(theme, colors, "Subtotal", formatINR(order.subtotal)),
            _row(theme, colors, "Shipping", order.shippingAmount == 0 ? "Free" : formatINR(order.shippingAmount)),
            if (order.discountAmount > 0) _row(theme, colors, "Discount", "−${formatINR(order.discountAmount)}"),
            if (order.walletAmountUsed > 0) _row(theme, colors, "Wallet", "−${formatINR(order.walletAmountUsed)}"),
            Divider(color: colors.parchment, height: 20),
            _row(theme, colors, "Total", formatINR(order.totalAmount), strong: true),
            const SizedBox(height: 6),
            Align(alignment: Alignment.centerLeft,
              child: Text("Paid via ${order.paymentMethod ?? '—'} · ${order.paymentStatus}",
                  style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted))),
          ],
        )),

        const SizedBox(height: 24),
        OutlinedButton.icon(
          icon: const Icon(Icons.receipt_long_outlined),
          label: const Text("View / download invoice"),
          onPressed: () {
            final url = "${Env.apiBaseUrl}/account/orders/${order.id}/invoice";
            launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
          },
          style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
        ),
        const SizedBox(height: 8),

        if (policy.canCancel)
          OutlinedButton.icon(
            icon: const Icon(Icons.close),
            label: const Text("Cancel order"),
            onPressed: () => _runAction(context, OrderAction.cancel),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              foregroundColor: theme.colorScheme.error,
              side: BorderSide(color: theme.colorScheme.error),
            ),
          ),

        if (policy.canReturn) ...[
          OutlinedButton.icon(
            icon: const Icon(Icons.assignment_return_outlined),
            label: const Text("Return"),
            onPressed: () => _runAction(context, OrderAction.returnItem),
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            icon: const Icon(Icons.swap_horiz_rounded),
            label: const Text("Exchange"),
            onPressed: () => _runAction(context, OrderAction.exchange),
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          ),
        ],

        // After-the-window message for delivered orders that can no longer be returned
        if (order.status == "DELIVERED" && !policy.canReturn) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: colors.cream, borderRadius: BorderRadius.circular(8)),
            child: Text(
              "Return window of ${policy.returnPolicyDays} days has passed.",
              style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted),
            ),
          ),
        ],
      ],
    );
  }

  Widget _row(ThemeData theme, AppColorsExtension colors, String label, String value, {bool strong = false}) =>
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Expanded(child: Text(label, style: theme.textTheme.bodyMedium?.copyWith(color: strong ? null : colors.textMuted))),
            Text(value, style: strong
                ? theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w600)
                : theme.textTheme.bodyMedium),
          ],
        ),
      );
}

class _Card extends StatelessWidget {
  const _Card({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: colors.parchment),
        borderRadius: BorderRadius.circular(8),
      ),
      child: child,
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;
  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 12, 0, 8),
      child: Text(text.toUpperCase(),
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.2, color: colors.textMuted)),
    );
  }
}
