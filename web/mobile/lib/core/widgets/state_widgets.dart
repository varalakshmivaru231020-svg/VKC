import "package:flutter/material.dart";

import "../errors/failures.dart";

/// Centred spinner with optional caption.
class AppLoading extends StatelessWidget {
  const AppLoading({super.key, this.message});
  final String? message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(strokeWidth: 2.5),
          if (message != null) ...[
            const SizedBox(height: 12),
            Text(message!, style: Theme.of(context).textTheme.bodyMedium),
          ],
        ],
      ),
    );
  }
}

/// Full-screen empty state.
class AppEmpty extends StatelessWidget {
  const AppEmpty({super.key, required this.title, this.description, this.icon, this.action});
  final String title;
  final String? description;
  final IconData? icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon ?? Icons.inbox_outlined, size: 56, color: Theme.of(context).hintColor),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleMedium, textAlign: TextAlign.center),
            if (description != null) ...[
              const SizedBox(height: 8),
              Text(description!, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).hintColor), textAlign: TextAlign.center),
            ],
            if (action != null) ...[const SizedBox(height: 20), action!],
          ],
        ),
      ),
    );
  }
}

/// Renders a friendly message + retry button for any Failure.
class AppErrorView extends StatelessWidget {
  const AppErrorView({super.key, required this.failure, this.onRetry});
  final Failure failure;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final IconData icon;
    final String title;

    switch (failure) {
      case NetworkFailure():
        icon = Icons.wifi_off_rounded;
        title = "You appear to be offline";
      case TimeoutFailure():
        icon = Icons.access_time_rounded;
        title = "The request timed out";
      case UnauthorizedFailure():
        icon = Icons.lock_outline_rounded;
        title = failure.message;
      case ValidationFailure():
        icon = Icons.error_outline_rounded;
        title = failure.message;
      case NotFoundFailure():
        icon = Icons.search_off_rounded;
        title = failure.message;
      case ServerFailure():
        icon = Icons.cloud_off_rounded;
        title = failure.message;
      case UnknownFailure():
        icon = Icons.error_outline_rounded;
        title = failure.message;
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: Theme.of(context).colorScheme.error),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleMedium, textAlign: TextAlign.center),
            if (onRetry != null) ...[
              const SizedBox(height: 20),
              FilledButton.tonal(onPressed: onRetry, child: const Text("Try again")),
            ],
          ],
        ),
      ),
    );
  }
}
