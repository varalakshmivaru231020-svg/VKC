import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../ecom/ecom_models.dart';
import '../theme.dart';

String orderMoney(num v) => v.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');
String orderWhen(DateTime? d) => d == null ? '' : DateFormat('d MMM, h:mm a').format(d.toLocal());

/// Human label + colour + icon for an order status, shared by the orders
/// list, the order detail and public tracking so one state never shows up
/// under two different names.
({String label, Color color, IconData icon}) orderStatusLook(String status) {
  switch (status) {
    case 'DELIVERED':
      return (label: 'Delivered', color: VkColors.green, icon: Icons.check_circle);
    case 'OUT_FOR_DELIVERY':
      return (label: 'Out for delivery', color: VkColors.primary, icon: Icons.local_shipping);
    case 'SHIPPED':
      return (label: 'Shipped', color: VkColors.primary, icon: Icons.local_shipping_outlined);
    case 'PROCESSING':
      return (label: 'Packed', color: VkColors.gold, icon: Icons.inventory_2_outlined);
    case 'CONFIRMED':
      return (label: 'Confirmed', color: VkColors.gold, icon: Icons.task_alt);
    case 'CANCELLED':
      return (label: 'Cancelled', color: VkColors.primary, icon: Icons.cancel_outlined);
    case 'RETURNED':
      return (label: 'Returned', color: VkColors.muted, icon: Icons.assignment_return_outlined);
    case 'RETURN_REQUESTED':
      return (label: 'Return requested', color: VkColors.warning, icon: Icons.assignment_return_outlined);
    case 'REFUNDED':
      return (label: 'Refunded', color: VkColors.green, icon: Icons.currency_rupee);
    default:
      return (label: 'Order placed', color: VkColors.gold, icon: Icons.receipt_long_outlined);
  }
}

class OrderStep {
  final String label;
  final bool done, active;
  final String when;
  const OrderStep(this.label, this.done, this.active, this.when);
}

/// The five delivery stages, with the ones the order has passed marked done.
/// A cancelled/returned order has no journey to draw, so this returns empty.
List<OrderStep> orderTimeline(EcomOrder o) {
  if (const ['CANCELLED', 'RETURNED', 'REFUNDED'].contains(o.status)) return const [];
  const stages = ['Order Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
  int reached;
  switch (o.status) {
    case 'CONFIRMED':
      reached = 1;
      break;
    case 'PROCESSING':
      reached = 2;
      break;
    case 'SHIPPED':
    case 'OUT_FOR_DELIVERY':
      reached = 3;
      break;
    case 'DELIVERED':
      reached = 4;
      break;
    default:
      reached = 0;
  }
  final whens = [orderWhen(o.createdAt), '', '', orderWhen(o.shippedAt), orderWhen(o.deliveredAt)];
  return [
    for (var i = 0; i < stages.length; i++)
      OrderStep(stages[i], i <= reached, i == reached && reached < stages.length - 1, whens[i]),
  ];
}

/// Vertical stepper for an order's journey.
class OrderTimelineView extends StatelessWidget {
  final List<OrderStep> steps;
  final String title;
  const OrderTimelineView({super.key, required this.steps, this.title = 'DELIVERY TIMELINE'});

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: VkText.upper(9, letter: 0.22)),
        const SizedBox(height: 14),
        ...List.generate(steps.length, (i) {
          final t = steps[i];
          final last = i == steps.length - 1;
          final dot = t.done ? (t.active ? VkColors.primary : VkColors.green) : VkColors.paper;
          final border = t.done ? (t.active ? VkColors.primary : VkColors.green) : VkColors.rule2;
          return IntrinsicHeight(
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Column(children: [
                Container(
                    width: 16,
                    height: 16,
                    margin: const EdgeInsets.only(top: 3),
                    decoration: BoxDecoration(color: dot, shape: BoxShape.circle, border: Border.all(color: border, width: 2))),
                if (!last) Expanded(child: Container(width: 2, color: VkColors.rule)),
              ]),
              const SizedBox(width: 14),
              Padding(
                padding: EdgeInsets.only(bottom: last ? 0 : 18),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(t.label,
                      style: VkText.ui(13,
                          weight: t.active ? FontWeight.w600 : FontWeight.w500, color: t.done ? VkColors.ink : VkColors.muted)),
                  if (t.when.isNotEmpty) ...[const SizedBox(height: 2), Text(t.when, style: VkText.mono(10, color: VkColors.muted))],
                ]),
              ),
            ]),
          );
        }),
      ]);
}
