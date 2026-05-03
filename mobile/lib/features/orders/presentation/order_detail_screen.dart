import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:intl/intl.dart";
import "package:url_launcher/url_launcher.dart";

import "../../../core/errors/failures.dart";
import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/utils/formatters.dart";
import "../../../core/widgets/app_image.dart";
import "../../../core/widgets/state_widgets.dart";
import "../data/order_models.dart";
import "../data/order_repository.dart";

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
        data: (order) => _Body(order: order),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.order});
  final Order order;

  Future<void> _cancel(BuildContext context, WidgetRef ref) async {
    final reason = await _promptForReason(context, "Why are you cancelling?");
    if (reason == null || reason.isEmpty) return;
    try {
      await ref.read(orderRepositoryProvider).cancel(order.id, reason: reason);
      ref.invalidate(orderDetailProvider(order.id));
      ref.invalidate(ordersListProvider);
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Order cancelled")));
    } on Failure catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _returnOrExchange(BuildContext context, WidgetRef ref, String type) async {
    final reason = await _promptForReason(context, type == "RETURN" ? "Reason for return" : "Reason for exchange");
    if (reason == null || reason.isEmpty) return;
    try {
      await ref.read(orderRepositoryProvider).returnOrExchange(order.id, type: type, reason: reason);
      ref.invalidate(orderDetailProvider(order.id));
      ref.invalidate(ordersListProvider);
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("$type request submitted")));
    } on Failure catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<String?> _promptForReason(BuildContext context, String title) async {
    final ctrl = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(title),
        content: TextField(controller: ctrl, maxLines: 3, decoration: const InputDecoration(hintText: "Tell us briefly")),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
          ElevatedButton(onPressed: () => Navigator.pop(context, ctrl.text.trim()), child: const Text("Submit")),
        ],
      ),
    );
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
        if (order.canCancel)
          OutlinedButton.icon(
            icon: const Icon(Icons.close),
            label: const Text("Cancel order"),
            onPressed: () => _cancel(context, ref),
            style: OutlinedButton.styleFrom(foregroundColor: theme.colorScheme.error, side: BorderSide(color: theme.colorScheme.error)),
          ),
        if (order.canReturn) ...[
          OutlinedButton.icon(icon: const Icon(Icons.assignment_return_outlined), label: const Text("Return"),
            onPressed: () => _returnOrExchange(context, ref, "RETURN")),
          const SizedBox(height: 8),
          OutlinedButton.icon(icon: const Icon(Icons.swap_horiz_rounded), label: const Text("Exchange"),
            onPressed: () => _returnOrExchange(context, ref, "EXCHANGE")),
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
