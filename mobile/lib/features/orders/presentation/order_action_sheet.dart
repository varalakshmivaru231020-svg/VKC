import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/errors/failures.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/widgets/state_widgets.dart";
import "../data/order_repository.dart";

enum OrderAction { cancel, returnItem, exchange }

extension on OrderAction {
  String get title => switch (this) {
        OrderAction.cancel     => "Cancel order",
        OrderAction.returnItem => "Return order",
        OrderAction.exchange   => "Exchange order",
      };
  bool get refundApplies => this != OrderAction.exchange;
}

/// Bottom sheet that collects (reason, remark, optional refund destination)
/// and submits the chosen action. Returns the action message on success.
Future<String?> showOrderActionSheet(
  BuildContext context, {
  required String orderId,
  required OrderAction action,
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: _OrderActionSheet(orderId: orderId, action: action),
    ),
  );
}

class _OrderActionSheet extends ConsumerStatefulWidget {
  const _OrderActionSheet({required this.orderId, required this.action});
  final String orderId;
  final OrderAction action;

  @override
  ConsumerState<_OrderActionSheet> createState() => _OrderActionSheetState();
}

class _OrderActionSheetState extends ConsumerState<_OrderActionSheet> {
  String? _reason;
  String _refundMethod = "SOURCE";
  final _remarkCtrl = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _remarkCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_reason == null) {
      setState(() => _error = "Please pick a reason");
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      final repo = ref.read(orderRepositoryProvider);
      final remark = _remarkCtrl.text.trim();
      final result = switch (widget.action) {
        OrderAction.cancel => await repo.cancel(
            widget.orderId,
            reason: _reason!,
            remark: remark.isEmpty ? null : remark,
            refundMethod: _refundMethod,
          ),
        OrderAction.returnItem => await repo.returnOrExchange(
            widget.orderId,
            type: "RETURN",
            reason: _reason!,
            remark: remark.isEmpty ? null : remark,
            refundMethod: _refundMethod,
          ),
        OrderAction.exchange => await repo.returnOrExchange(
            widget.orderId,
            type: "EXCHANGE",
            reason: _reason!,
            remark: remark.isEmpty ? null : remark,
          ),
      };
      ref.invalidate(orderDetailProvider(widget.orderId));
      ref.invalidate(ordersListProvider);
      if (mounted) Navigator.pop(context, result.message ?? "Done");
    } on Failure catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final colors = context.appColors;
    final reasons = ref.watch(orderReasonsProvider);

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      builder: (_, scroll) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(child: Text(widget.action.title, style: theme.textTheme.titleLarge)),
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
              ],
            ),
            Expanded(
              child: reasons.when(
                loading: () => const AppLoading(),
                error: (e, _) => AppErrorView(
                  failure: e is Failure ? e : UnknownFailure(e.toString()),
                  onRetry: () => ref.invalidate(orderReasonsProvider),
                ),
                data: (data) {
                  final list = switch (widget.action) {
                    OrderAction.cancel     => data.cancel,
                    OrderAction.returnItem => data.ret,
                    OrderAction.exchange   => data.exchange,
                  };
                  return ListView(
                    controller: scroll,
                    children: [
                      Text("REASON",
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.2, color: colors.textMuted)),
                      const SizedBox(height: 4),
                      ...list.map((r) => RadioListTile<String>(
                        contentPadding: EdgeInsets.zero,
                        value: r,
                        groupValue: _reason,
                        title: Text(r),
                        onChanged: (v) => setState(() => _reason = v),
                        dense: true,
                      )),
                      const SizedBox(height: 12),
                      Text("REMARK (OPTIONAL)",
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.2, color: colors.textMuted)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _remarkCtrl,
                        maxLines: 3,
                        decoration: const InputDecoration(hintText: "Add any details to help us serve you faster"),
                      ),
                      if (widget.action.refundApplies) ...[
                        const SizedBox(height: 16),
                        Text("REFUND TO",
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.2, color: colors.textMuted)),
                        const SizedBox(height: 6),
                        _RefundOption(
                          value: "SOURCE", group: _refundMethod,
                          icon: Icons.account_balance_outlined,
                          title: "Original payment method",
                          subtitle: "Refunded to the source within 5–7 business days",
                          onChanged: (v) => setState(() => _refundMethod = v!),
                        ),
                        _RefundOption(
                          value: "WALLET", group: _refundMethod,
                          icon: Icons.account_balance_wallet_outlined,
                          title: "My wallet (instant)",
                          subtitle: "Get the refund instantly to your store wallet",
                          onChanged: (v) => setState(() => _refundMethod = v!),
                        ),
                      ],
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: theme.colorScheme.errorContainer, borderRadius: BorderRadius.circular(8)),
                          child: Row(children: [
                            Icon(Icons.error_outline, color: theme.colorScheme.error, size: 18),
                            const SizedBox(width: 8),
                            Expanded(child: Text(_error!, style: TextStyle(color: theme.colorScheme.onErrorContainer))),
                          ]),
                        ),
                      ],
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                  : const Text("Submit"),
            ),
          ],
        ),
      ),
    );
  }
}

class _RefundOption extends StatelessWidget {
  const _RefundOption({
    required this.value, required this.group,
    required this.icon, required this.title, required this.subtitle,
    required this.onChanged,
  });
  final String value, group, title, subtitle;
  final IconData icon;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    final selected = value == group;
    final theme  = Theme.of(context);
    final colors = context.appColors;
    return InkWell(
      onTap: () => onChanged(value),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: selected ? theme.colorScheme.primary : colors.parchment, width: selected ? 2 : 1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Radio<String>(value: value, groupValue: group, onChanged: onChanged,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap),
            Icon(icon, color: theme.colorScheme.primary),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: theme.textTheme.titleSmall),
                  Text(subtitle, style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
