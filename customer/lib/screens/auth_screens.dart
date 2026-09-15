import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_config.dart';
import '../theme.dart';
import '../widgets.dart';

// ── Login / OTP ──────────────────────────────────────────────────────────────
/// The phone normalisation the login screen applies before it calls
/// `/auth/otp/send` and `/auth/otp/verify`, exposed so it can be tested
/// against the payload the website posts.
class LoginScreenPhone {
  const LoginScreenPhone._();

  /// The ten local digits, dial code and separators removed.
  static String normalise(String raw) => _LoginScreenState.normalisePhone(raw);

  /// The exact `phone` value posted to `/auth/otp/send` and `/auth/otp/verify`.
  static String payload(String raw) => '${_LoginScreenState._dialCode}${normalise(raw)}';
}

/// Sign in with a mobile number and OTP — the same flow as the website.
/// Never shown automatically; only where an action needs an account.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  /// The store sends a 4-digit code.
  static const _otpLength = 4;

  /// Same default the website's login modal holds in state and prepends.
  static const _dialCode = '+91';

  String _step = 'phone';
  final _phoneCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  int _resend = 30;
  Timer? _timer;
  bool _busy = false;
  bool _isNew = false;

  /// Set only when the store is in fixed-OTP mode and returns the code.
  String _devCode = '';

  /// The code already sent for verification, so auto-submit and the button
  /// never double-spend one.
  String? _submitted;

  String get _phoneDigits => normalisePhone(_phoneCtrl.text);

  /// What actually goes on the wire — `+91` plus the ten digits, the same
  /// key the website's login modal posts.
  String get _phonePayload => '$_dialCode$_phoneDigits';

  static String normalisePhone(String raw) {
    var d = raw.replaceAll(RegExp(r'\D'), '');
    if (d.length > 10 && d.startsWith('91')) d = d.substring(2);
    if (d.length == 11 && d.startsWith('0')) d = d.substring(1);
    if (d.length > 10) d = d.substring(d.length - 10);
    return d;
  }

  void _startResend() {
    _timer?.cancel();
    _resend = 30;
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_resend <= 0) {
        t.cancel();
      } else {
        setState(() => _resend--);
      }
    });
  }

  String _apiError(Object e) {
    if (e is DioException) {
      if (e.response?.data is Map) {
        final err = (e.response!.data as Map)['error'];
        if (err is String && err.isNotEmpty && err.length < 200) return err;
      }
      if (isOffline(e)) return "You're offline. Check your connection and try again.";
    }
    return 'Something went wrong. Please try again.';
  }

  Future<void> _sendOtp() async {
    if (_phoneDigits.length != 10) {
      _toast('Enter a valid 10-digit mobile number');
      return;
    }
    setState(() => _busy = true);
    try {
      final res = await EcomApi.I.sendOtp(_phonePayload);
      if (!mounted) return;
      setState(() {
        _isNew = res['isNew'] == true;
        _devCode = (res['otp'] ?? res['devCode'])?.toString() ?? '';
        _otpCtrl.clear();
        _submitted = null;
        _step = 'otp';
        _busy = false;
      });
      _startResend();
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      _toast(_apiError(e));
    }
  }

  Future<void> _verify({bool auto = false}) async {
    final code = _otpCtrl.text.replaceAll(RegExp(r'\D'), '');
    if (code.length < _otpLength) {
      _toast('Enter the $_otpLength-digit OTP');
      return;
    }
    if (_busy) return;
    if (auto && code == _submitted) return;
    if (!auto && code == _submitted) {
      _toast('That code has already been used — tap Resend for a new one');
      return;
    }
    _submitted = code;
    setState(() => _busy = true);
    try {
      await EcomApi.I.verifyOtp(_phonePayload, code, name: _isNew ? _nameCtrl.text : null);
      if (!mounted) return;
      // Hand the customer back to whatever they were doing.
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/home');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      _toast(_apiError(e));
    }
  }

  void _toast(String m) => toast(context, m);

  @override
  void dispose() {
    _timer?.cancel();
    _phoneCtrl.dispose();
    _nameCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VkColors.canvas,
      body: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: Row(children: [
              TopBar.action(Icons.close_rounded, () => context.canPop() ? context.pop() : context.go('/home'), tooltip: 'Close'),
            ]),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Center(child: BrandLogo(height: 72, wordmark: false, animate: true)),
                const SizedBox(height: 22),
                Text(_step == 'phone' ? 'WELCOME' : 'VERIFY YOUR NUMBER', style: VkText.upper(10, color: VkColors.primary, letter: 0.2)),
                const SizedBox(height: 8),
                Text(_step == 'phone' ? 'Sign in to VKC Gold Ikshu' : 'Code sent to $_dialCode $_phoneDigits', style: VkText.display(28, height: 1.1)),
                const SizedBox(height: 6),
                Text(
                  _step == 'phone' ? 'We’ll send a one-time code to your mobile number. No password needed.' : 'Enter the code we just sent you.',
                  style: VkText.body(13, color: VkColors.muted, height: 1.5),
                ),
                const SizedBox(height: 22),
                if (_step == 'phone') ..._phoneStep() else ..._otpStep(),
                const SizedBox(height: 18),
                _legalLine(),
              ]),
            ),
          ),
        ]),
      ),
    );
  }

  List<Widget> _phoneStep() => [
        Text('MOBILE NUMBER', style: VkText.upper(9, color: VkColors.muted, letter: 0.16)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          decoration: BoxDecoration(
            color: VkColors.paper,
            borderRadius: BorderRadius.circular(VkRadii.md),
            border: Border.all(color: VkColors.rule2),
          ),
          child: Row(children: [
            Text('+91', style: VkText.ui(15, weight: FontWeight.w500)),
            Container(width: 1, height: 18, margin: const EdgeInsets.symmetric(horizontal: 10), color: VkColors.rule2),
            Expanded(
              child: TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                autofocus: true,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
                onSubmitted: (_) => _busy ? null : _sendOtp(),
                style: VkText.ui(15, letter: 0.06),
                decoration: InputDecoration(
                  border: InputBorder.none,
                  isCollapsed: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  hintText: '10-digit number',
                  hintStyle: VkText.body(13, color: VkColors.muted2),
                ),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 16),
        PrimaryButton(label: 'Send OTP', loading: _busy, onTap: _busy ? null : _sendOtp),
      ];

  List<Widget> _otpStep() => [
        if (_devCode.isNotEmpty) ...[
          Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(
              color: VkColors.amberSoft,
              border: Border.all(color: VkColors.goldSoft),
              borderRadius: BorderRadius.circular(VkRadii.sm),
            ),
            child: Text('Dev mode — OTP: $_devCode', textAlign: TextAlign.center, style: VkText.ui(12, color: VkColors.primaryDeep)),
          ),
        ],
        TextField(
          controller: _otpCtrl,
          textAlign: TextAlign.center,
          keyboardType: TextInputType.number,
          autofocus: true,
          maxLength: _otpLength,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(_otpLength)],
          style: VkText.ui(28, weight: FontWeight.w600, letter: 14),
          onChanged: (v) {
            if (v.replaceAll(RegExp(r'\D'), '').length == _otpLength && !_busy) _verify(auto: true);
          },
          decoration: InputDecoration(
            counterText: '',
            hintText: '••••',
            hintStyle: VkText.ui(28, weight: FontWeight.w600, color: VkColors.rule2, letter: 14),
            filled: true,
            fillColor: VkColors.paper,
            contentPadding: const EdgeInsets.symmetric(vertical: 16),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VkRadii.md), borderSide: const BorderSide(color: VkColors.rule2)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VkRadii.md), borderSide: const BorderSide(color: VkColors.primary)),
          ),
        ),
        if (_isNew) ...[
          const SizedBox(height: 14),
          TextField(
            controller: _nameCtrl,
            textCapitalization: TextCapitalization.words,
            style: VkText.ui(15),
            decoration: InputDecoration(
              hintText: 'Your name (new account)',
              hintStyle: VkText.body(13, color: VkColors.muted2),
              filled: true,
              fillColor: VkColors.paper,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VkRadii.md), borderSide: const BorderSide(color: VkColors.rule2)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VkRadii.md), borderSide: const BorderSide(color: VkColors.primary)),
            ),
          ),
        ],
        const SizedBox(height: 16),
        Center(
          child: _resend > 0
              ? Text.rich(TextSpan(style: VkText.body(12, color: VkColors.muted), children: [
                  const TextSpan(text: 'Resend in '),
                  TextSpan(text: '00:${_resend.toString().padLeft(2, '0')}', style: VkText.ui(12, color: VkColors.ink)),
                ]))
              : TextButton(onPressed: _sendOtp, child: Text('Resend code', style: VkText.ui(12.5, weight: FontWeight.w600, color: VkColors.primary))),
        ),
        const SizedBox(height: 10),
        PrimaryButton(label: 'Verify & continue', loading: _busy, onTap: _busy ? null : _verify),
        const SizedBox(height: 6),
        Center(
          child: TextButton(
            onPressed: () => setState(() => _step = 'phone'),
            child: Text('Edit phone number', style: VkText.body(12, color: VkColors.muted)),
          ),
        ),
      ];

  /// "By continuing you agree to our Terms and Privacy Policy" — each becomes
  /// a link as soon as the store fills its legal URLs in /v1/app-config.
  Widget _legalLine() => ValueListenableBuilder<StoreConfig>(
        valueListenable: storeConfig,
        builder: (context, cfg, _) {
          TextSpan policy(String label, String url) => TextSpan(
                text: label,
                style: VkText.body(11, color: url.isEmpty ? VkColors.ink : VkColors.primary),
                recognizer: url.isEmpty ? null : (TapGestureRecognizer()..onTap = () => openExternal(context, url)),
              );
          return Text.rich(
            TextSpan(style: VkText.body(11, color: VkColors.muted2, height: 1.5), children: [
              const TextSpan(text: 'By continuing you agree to our '),
              policy('Terms', cfg.termsUrl),
              const TextSpan(text: ' and '),
              policy('Privacy Policy', cfg.privacyUrl),
              const TextSpan(text: '.'),
            ]),
            textAlign: TextAlign.center,
          );
        },
      );
}
