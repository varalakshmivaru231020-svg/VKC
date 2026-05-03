import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/errors/failures.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/utils/formatters.dart";
import "../../../core/widgets/state_widgets.dart";
import "../data/coupon_repository.dart";

/// Bottom sheet that lets the user pick from available offers or paste a code.
/// Returns the validated CouponValidation when applied, or null if cancelled.
Future<CouponValidation?> showCouponPicker(BuildContext context, {required num subtotal}) {
  return showModalBottomSheet<CouponValidation>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: _CouponSheet(subtotal: subtotal),
    ),
  );
}

class _CouponSheet extends ConsumerStatefulWidget {
  const _CouponSheet({required this.subtotal});
  final num subtotal;
  @override
  ConsumerState<_CouponSheet> createState() => _CouponSheetState();
}

class _CouponSheetState extends ConsumerState<_CouponSheet> {
  final _ctrl = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _apply(String code) async {
    setState(() { _busy = true; _error = null; });
    try {
      final v = await ref.read(couponRepositoryProvider).validate(
        code: code, subtotal: widget.subtotal,
      );
      if (mounted) Navigator.pop(context, v);
    } on Failure catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final colors = context.appColors;
    final coupons = ref.watch(availableCouponsProvider);

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.75,
      maxChildSize: 0.92,
      builder: (_, scroll) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(children: [
                Expanded(child: Text("Apply coupon", style: theme.textTheme.titleLarge)),
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
              ]),
              const SizedBox(height: 8),
              Row(children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(hintText: "Enter coupon code"),
                    onSubmitted: (v) => v.trim().isEmpty ? null : _apply(v.trim()),
                  ),
                ),
                const SizedBox(width: 10),
                ElevatedButton(
                  onPressed: _busy || _ctrl.text.trim().isEmpty ? null : () => _apply(_ctrl.text.trim()),
                  child: _busy
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                      : const Text("Apply"),
                ),
              ]),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
              ],
              const SizedBox(height: 16),
              Text("AVAILABLE OFFERS",
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.2, color: colors.textMuted)),
              const SizedBox(height: 8),
              Expanded(
                child: coupons.when(
                  loading: () => const AppLoading(),
                  error: (e, _) => AppErrorView(failure: e is Failure ? e : UnknownFailure(e.toString()),
                      onRetry: () => ref.invalidate(availableCouponsProvider)),
                  data: (list) {
                    if (list.isEmpty) return const AppEmpty(title: "No coupons available right now");
                    return ListView.separated(
                      controller: scroll,
                      itemCount: list.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final c = list[i];
                        final tooSmall = c.minOrderAmount != null && widget.subtotal < c.minOrderAmount!;
                        return InkWell(
                          onTap: tooSmall || _busy ? null : () => _apply(c.code),
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: tooSmall ? colors.cream : Colors.white,
                              border: Border.all(color: tooSmall ? colors.parchment : theme.colorScheme.primary, width: 1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(color: colors.primary50, borderRadius: BorderRadius.circular(4)),
                                    child: Text(c.code, style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                                  ),
                                  const Spacer(),
                                  if (!tooSmall)
                                    Text("Apply", style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.w600)),
                                ]),
                                const SizedBox(height: 6),
                                Text(c.description, style: theme.textTheme.bodyMedium),
                                if (c.minOrderAmount != null) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    tooSmall
                                        ? "Add ${formatINR(c.minOrderAmount! - widget.subtotal)} more to use this offer"
                                        : "On orders above ${formatINR(c.minOrderAmount!)}",
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: tooSmall ? theme.colorScheme.error : colors.textMuted,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
