import "dart:async";

import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:pinput/pinput.dart";

import "../../../core/errors/failures.dart";
import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";
import "../data/auth_controller.dart";

class OtpScreenArgs {
  final String phone;
  final bool isNew;
  final String? devCode;
  const OtpScreenArgs({required this.phone, required this.isNew, this.devCode});
}

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.args});
  final OtpScreenArgs args;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _otpCtrl  = TextEditingController();
  final _nameCtrl = TextEditingController();
  bool _busy = false;
  String? _error;

  Timer? _timer;
  int _secondsLeft = 30;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
    if (widget.args.devCode != null && widget.args.devCode!.isNotEmpty) {
      _otpCtrl.text = widget.args.devCode!;
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  void _startResendTimer() {
    _timer?.cancel();
    setState(() => _secondsLeft = 30);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      if (_secondsLeft <= 1) {
        t.cancel();
        setState(() => _secondsLeft = 0);
      } else {
        setState(() => _secondsLeft--);
      }
    });
  }

  Future<void> _resend() async {
    setState(() => _error = null);
    try {
      final r = await ref.read(authControllerProvider.notifier).sendOtp(widget.args.phone);
      _startResendTimer();
      if (r.devCode != null) _otpCtrl.text = r.devCode!;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("OTP resent")),
        );
      }
    } on Failure catch (e) {
      setState(() => _error = e.message);
    }
  }

  Future<void> _verify() async {
    if (_otpCtrl.text.length != 6) {
      setState(() => _error = "Enter the 6-digit code");
      return;
    }
    if (widget.args.isNew && _nameCtrl.text.trim().isEmpty) {
      setState(() => _error = "Please enter your name");
      return;
    }

    setState(() { _busy = true; _error = null; });
    try {
      await ref.read(authControllerProvider.notifier).verifyOtp(
        phone: widget.args.phone,
        otp:   _otpCtrl.text,
        name:  widget.args.isNew ? _nameCtrl.text.trim() : null,
      );
      if (!mounted) return;
      context.go(RoutePaths.home);
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

    final defaultPin = PinTheme(
      width: 48, height: 56,
      textStyle: theme.textTheme.titleLarge,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors.parchment),
      ),
    );

    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              Text("Enter OTP", style: theme.textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text.rich(
                TextSpan(
                  style: theme.textTheme.bodyMedium?.copyWith(color: colors.textMuted),
                  children: [
                    const TextSpan(text: "Sent to "),
                    TextSpan(text: "+91 ${widget.args.phone}", style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.w600)),
                    const TextSpan(text: ". "),
                    TextSpan(
                      text: "Edit",
                      style: TextStyle(color: theme.colorScheme.primary, decoration: TextDecoration.underline),
                      recognizer: null,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Pinput(
                controller: _otpCtrl,
                length: 6,
                autofocus: true,
                defaultPinTheme: defaultPin,
                focusedPinTheme: defaultPin.copyDecorationWith(
                  border: Border.all(color: theme.colorScheme.primary, width: 1.6),
                ),
                onCompleted: (_) => _verify(),
              ),
              if (widget.args.isNew) ...[
                const SizedBox(height: 24),
                TextField(
                  controller: _nameCtrl,
                  decoration: const InputDecoration(
                    labelText: "Your name",
                    hintText: "How should we address you?",
                  ),
                  textCapitalization: TextCapitalization.words,
                ),
              ],
              if (_error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.errorContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline_rounded, size: 18, color: theme.colorScheme.error),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_error!, style: TextStyle(color: theme.colorScheme.onErrorContainer))),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _busy ? null : _verify,
                child: _busy
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                    : const Text("Verify & continue"),
              ),
              const SizedBox(height: 16),
              Center(
                child: _secondsLeft > 0
                    ? Text("Resend in ${_secondsLeft}s",
                        style: theme.textTheme.bodyMedium?.copyWith(color: colors.textMuted))
                    : TextButton(onPressed: _resend, child: const Text("Resend OTP")),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
