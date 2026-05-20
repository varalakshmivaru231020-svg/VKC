import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:url_launcher/url_launcher.dart";

import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";
import "../../auth/data/auth_controller.dart";
import "../../splash/data/app_config_repository.dart";

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final user = auth.user;
    final cfg  = ref.watch(appConfigProvider).asData?.value;
    final theme  = Theme.of(context);
    final colors = context.appColors;

    return Scaffold(
      appBar: AppBar(title: const Text("My account")),
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          // Header card
          Container(
            color: theme.colorScheme.primary,
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.white.withOpacity(0.18),
                  child: Text(user?.initials ?? "G", style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w600)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Hello,", style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                      const SizedBox(height: 4),
                      Text(user?.displayName ?? "Guest",
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
                      if (user?.phone != null) ...[
                        const SizedBox(height: 2),
                        Text(user!.phone!, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                      ],
                    ],
                  ),
                ),
                if (!auth.isLoggedIn)
                  TextButton(
                    style: TextButton.styleFrom(backgroundColor: Colors.white, foregroundColor: theme.colorScheme.primary),
                    onPressed: () => context.push(RoutePaths.login),
                    child: const Text("Log in"),
                  ),
              ],
            ),
          ),

          const SizedBox(height: 8),

          if (auth.isLoggedIn) ...[
            _Tile(icon: Icons.shopping_bag_outlined, label: "My Orders",        onTap: () => context.push(RoutePaths.orders)),
            _Tile(icon: Icons.account_balance_wallet_outlined, label: "My Wallet", onTap: () => context.push(RoutePaths.wallet)),
            _Tile(icon: Icons.location_on_outlined,  label: "Saved Addresses",  onTap: () => context.push(RoutePaths.addresses)),
            _Tile(icon: Icons.person_outline,        label: "Profile",          onTap: () => context.push(RoutePaths.profile)),
          ],

          _SectionLabel("Help & info"),
          _Tile(icon: Icons.search_outlined,        label: "Track an order",   onTap: () => context.push(RoutePaths.trackOrder)),
          _Tile(icon: Icons.article_outlined,       label: "Blog",             onTap: () => context.push(RoutePaths.blogs)),
          if (cfg?.legal.privacyUrl.isNotEmpty == true)
            _Tile(icon: Icons.privacy_tip_outlined, label: "Privacy policy",   onTap: () => _open(cfg!.legal.privacyUrl)),
          if (cfg?.legal.termsUrl.isNotEmpty == true)
            _Tile(icon: Icons.description_outlined, label: "Terms of service", onTap: () => _open(cfg!.legal.termsUrl)),
          if (cfg?.legal.returnsPolicyUrl.isNotEmpty == true)
            _Tile(icon: Icons.assignment_return_outlined, label: "Return policy", onTap: () => _open(cfg!.legal.returnsPolicyUrl)),

          if (auth.isLoggedIn) ...[
            const SizedBox(height: 8),
            _Tile(
              icon: Icons.logout_rounded,
              label: "Log out",
              destructive: true,
              onTap: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text("Log out?"),
                    content: const Text("You can log back in any time."),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
                      ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text("Log out")),
                    ],
                  ),
                );
                if (ok == true) {
                  await ref.read(authControllerProvider.notifier).logout();
                  if (context.mounted) context.go(RoutePaths.home);
                }
              },
            ),
          ],

          // App version footer
          const SizedBox(height: 32),
          Center(
            child: Text("v1.0.0",
                style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Future<void> _open(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.icon, required this.label, required this.onTap, this.destructive = false});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final color = destructive ? Theme.of(context).colorScheme.error : null;
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.chevron_right_rounded),
      onTap: onTap,
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
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(text.toUpperCase(),
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.2, color: colors.textMuted)),
    );
  }
}
