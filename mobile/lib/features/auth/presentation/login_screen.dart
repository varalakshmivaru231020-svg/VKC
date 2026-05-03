import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/errors/failures.dart";
import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";
import "../data/auth_controller.dart";

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phoneCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    super.dispose();
  }

  String? _validatePhone(String? v) {
    final digits = (v ?? "").replaceAll(RegExp(r"\D"), "");
    if (digits.length != 10) return "Enter a 10-digit mobile number";
    if (!RegExp(r"^[6-9]").hasMatch(digits)) return "Indian numbers start with 6–9";
    return null;
  }

  Future<void> _send() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _busy = true; _error = null; });

    final phone = _phoneCtrl.text.replaceAll(RegExp(r"\D"), "");
    try {
      final result = await ref.read(authControllerProvider.notifier).sendOtp(phone);
      if (!mounted) return;
      context.go(RoutePaths.otp, extra: {
        "phone":   phone,
        "isNew":   result.isNew,
        "devCode": result.devCode,
      });
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
    final theme = Theme.of(context);
    final colors = context.appColors;

    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 24),
                Text("Welcome", style: theme.textTheme.headlineMedium),
                const SizedBox(height: 8),
                Text(
                  "Enter your mobile number — we'll send you a one-time password to log in.",
                  style: theme.textTheme.bodyMedium?.copyWith(color: colors.textMuted),
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _phoneCtrl,
                  autofocus: true,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.done,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(10),
                  ],
                  decoration: const InputDecoration(
                    labelText: "Mobile Number",
                    prefixText: "+91  ",
                    hintText: "10-digit mobile",
                  ),
                  validator: _validatePhone,
                  onFieldSubmitted: (_) => _send(),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  _ErrorBanner(message: _error!),
                ],
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _busy ? null : _send,
                  child: _busy
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                      : const Text("Send OTP"),
                ),
                const SizedBox(height: 24),
                Text(
                  "By continuing you agree to our Terms of Service and Privacy Policy.",
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: c.errorContainer,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline_rounded, size: 18, color: c.error),
          const SizedBox(width: 8),
          Expanded(child: Text(message, style: TextStyle(color: c.onErrorContainer))),
        ],
      ),
    );
  }
}
