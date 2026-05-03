import "package:flutter/material.dart";
import "package:go_router/go_router.dart";

import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";

class OrderSuccessScreen extends StatelessWidget {
  const OrderSuccessScreen({super.key, required this.orderNumber});
  final String orderNumber;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle_rounded, size: 96, color: colors.success),
              const SizedBox(height: 24),
              Text("Order placed!", style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text(
                "Your order #$orderNumber is being prepared. We'll notify you when it ships.",
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: colors.textMuted),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.go(RoutePaths.orders),
                  child: const Text("View order"),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => context.go(RoutePaths.home),
                  child: const Text("Continue shopping"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
