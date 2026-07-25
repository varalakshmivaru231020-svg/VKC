import "package:flutter/material.dart";

/// Generic placeholder used by feature screens that haven't been implemented
/// yet. Lets the router fully wire up and bottom-nav navigate during scaffolding.
class PlaceholderScreen extends StatelessWidget {
  const PlaceholderScreen({super.key, required this.title, this.note});
  final String title;
  final String? note;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.construction_rounded, size: 56, color: Theme.of(context).hintColor),
              const SizedBox(height: 16),
              Text("$title — coming soon", style: Theme.of(context).textTheme.titleMedium, textAlign: TextAlign.center),
              if (note != null) ...[
                const SizedBox(height: 8),
                Text(note!, style: Theme.of(context).textTheme.bodySmall, textAlign: TextAlign.center),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
