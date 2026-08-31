import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_config.dart';
import '../session.dart';
import '../theme.dart';
import '../widgets.dart';

/// Stacked brand wordmark (ports BrandStack / Wordmark).
class BrandStack extends StatelessWidget {
  final Color? color;
  final String? sub;
  const BrandStack({super.key, this.color, this.sub});
  @override
  Widget build(BuildContext context) {
    final c = color ?? VlColors.ink;
    return Column(mainAxisSize: MainAxisSize.min, children: [
      Text('V L GROUP', style: VlText.upper(11, color: c.withValues(alpha: 0.7), letter: 0.4)),
      const SizedBox(height: 6),
      Text('Vijaylakshmi', style: VlText.display(38, color: c, style: FontStyle.italic)),
      if (sub != null) ...[
        const SizedBox(height: 8),
        Text(sub!.toUpperCase(), style: VlText.upper(8, color: c.withValues(alpha: 0.7), letter: 0.24)),
      ],
    ]);
  }
}

// ── Splash ───────────────────────────────────────────────────────────────────
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  double _op = 0;
  Timer? _t;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) setState(() => _op = 1);
    });
    _t = Timer(const Duration(milliseconds: 2400), _go);
  }

  void _go() {
    _t?.cancel();
    if (!mounted) return;
    // Onboarding introduces the store; a customer whose session was restored
    // has already been introduced, so send them straight to the shop.
    context.go(EcomAuth.I.hasStoredSession ? '/home' : '/onboarding');
  }

  @override
  void dispose() {
    _t?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _go,
      child: Scaffold(
        backgroundColor: VlBrand.ink,
        // SizedBox.expand is load-bearing: a Stack sizes itself to its largest
        // NON-positioned child (the wordmark), so without tight constraints it
        // shrank to roughly 610dp and Scaffold pinned that box to the top-left
        // — taking the crest, the wordmark, the progress bar and "TAP TO
        // CONTINUE" up there with it, and leaving Positioned(bottom:) anchored
        // to the small box instead of the screen.
        body: SizedBox.expand(
          child: Stack(alignment: Alignment.center, children: [
          Positioned.fill(
            child: AnimatedOpacity(
              opacity: _op,
              duration: const Duration(milliseconds: 800),
              child: const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment(0, -0.1),
                    radius: 0.9,
                    colors: [Color(0x59B8893A), Colors.transparent],
                  ),
                ),
              ),
            ),
          ),
          AnimatedScale(
            scale: _op == 0 ? 0.3 : 1,
            duration: const Duration(milliseconds: 1000),
            curve: Curves.easeOutCubic,
            child: AnimatedOpacity(
              opacity: _op,
              duration: const Duration(milliseconds: 800),
              child: Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: VlBrand.goldSoft.withValues(alpha: 0.4)),
                ),
              ),
            ),
          ),
          AnimatedOpacity(
            opacity: _op,
            duration: const Duration(milliseconds: 800),
            // The store's own line: "Celebrating India's master weavers since 1968."
            child: BrandStack(color: VlBrand.canvas, sub: 'Heritage Sarees · Since 1968'),
          ),
          Positioned(
            bottom: 80,
            child: AnimatedOpacity(
              opacity: _op,
              duration: const Duration(milliseconds: 900),
              child: SizedBox(
                width: 120,
                child: LinearProgressIndicator(
                  minHeight: 1,
                  backgroundColor: VlBrand.goldSoft.withValues(alpha: 0.2),
                  valueColor: const AlwaysStoppedAnimation(VlBrand.goldSoft),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 24,
            child: Text('TAP TO CONTINUE',
                style: VlText.upper(9, color: VlBrand.goldSoft.withValues(alpha: 0.7), letter: 0.24)),
          ),
          ]),
        ),
      ),
    );
  }
}

// ── Onboarding ───────────────────────────────────────────────────────────────
class _Onb {
  final String no, title, body, label;
  final int palette;
  const _Onb(this.no, this.title, this.body, this.label, this.palette);
}

// Copy states only what the store actually promises — the delivery window and
// free-shipping threshold come from its own settings (/v1/app-config), so a
// change on the website carries into the app instead of going stale here.
/// Thousands separators, so the threshold reads like every other price in the
/// app (₹10,000 rather than ₹10000).
String _grouped(num v) => v.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');

List<_Onb> _onboarding() {
  final cfg = storeConfig.value;
  return [
    const _Onb('01', 'A loom that travels with you',
        'Handwoven sarees from India’s master weavers — Kanjivaram, silk cotton, linen and more, curated piece by piece.',
        'ANJALI’S VIJAYLAKSHMI SAREES', 0),
    const _Onb('02', 'Shop the loom, live',
        'Join our live shows and exhibitions. Ask, drape, compare — and buy the piece while you’re watching it.',
        'LIVE FROM THE STORE', 2),
    _Onb('03', 'From our store to your door',
        '${cfg.deliveryTitle} in ${cfg.deliveryNotes}, free above ₹${_grouped(cfg.freeShippingThreshold)}. '
            'Cash on delivery across India.',
        'UDUPI · KARNATAKA', 5),
  ];
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _i = 0;
  late final List<_Onb> _onb = _onboarding();

  void _next() {
    if (_i < _onb.length - 1) {
      setState(() => _i++);
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final o = _onb[_i];
    return Scaffold(
      backgroundColor: VlColors.canvas,
      body: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Vijaylakshmi', style: VlText.display(18, style: FontStyle.italic)),
              GestureDetector(
                onTap: () => context.go('/home'),
                child: Text('SKIP', style: VlText.upper(10, color: VlColors.muted, letter: 0.18)),
              ),
            ]),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(children: [
                Expanded(
                  child: Stack(children: [
                    Positioned.fill(child: Silk(palette: o.palette, label: o.label)),
                    _corner(Alignment.topLeft, true, true),
                    _corner(Alignment.topRight, false, true),
                    _corner(Alignment.bottomLeft, true, false),
                    _corner(Alignment.bottomRight, false, false),
                  ]),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(4, 28, 4, 12),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    // No "01 — OF 03" counter: the dots below already say where
                    // the customer is, and nothing in the app is numbered now.
                    Text(o.title, style: VlText.display(30)),
                    const SizedBox(height: 12),
                    Text(o.body, style: VlText.body(14, color: VlColors.muted, height: 1.55)),
                  ]),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(0, 14, 0, 24),
                  child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Row(
                      children: List.generate(_onb.length, (idx) {
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          margin: const EdgeInsets.only(right: 6),
                          width: idx == _i ? 22 : 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: idx == _i ? VlColors.red : VlColors.rule2,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        );
                      }),
                    ),
                    Row(children: [
                      if (_i == _onb.length - 1)
                        GestureDetector(
                          onTap: () => context.go('/login'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(VlRadii.md), border: Border.all(color: VlColors.rule2)),
                            child: Text('Log in', style: VlText.ui(12)),
                          ),
                        ),
                      if (_i == _onb.length - 1) const SizedBox(width: 8),
                      GestureDetector(
                        onTap: _next,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
                          decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            Text(_i == _onb.length - 1 ? 'ENTER STORE' : 'CONTINUE',
                                style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
                            const SizedBox(width: 8),
                            const Icon(Icons.arrow_forward, size: 14, color: Colors.white),
                          ]),
                        ),
                      ),
                    ]),
                  ]),
                ),
              ]),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _corner(Alignment a, bool left, bool top) => Align(
        alignment: a,
        child: Container(
          margin: EdgeInsets.only(left: left ? 12 : 0, right: left ? 0 : 12, top: top ? 12 : 0, bottom: top ? 0 : 12),
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            border: Border(
              left: left ? BorderSide(color: VlColors.goldSoft) : BorderSide.none,
              right: left ? BorderSide.none : BorderSide(color: VlColors.goldSoft),
              top: top ? BorderSide(color: VlColors.goldSoft) : BorderSide.none,
              bottom: top ? BorderSide.none : BorderSide(color: VlColors.goldSoft),
            ),
          ),
        ),
      );
}

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

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  /// The store sends a 4-digit code — the website's OTP input is exactly four
  /// boxes and refuses anything shorter.
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

  /// The code already sent for verification. The store consumes an OTP on the
  /// first attempt, so auto-submit firing on the 4th digit and then the button
  /// re-sending the same digits produced a spurious "Invalid or expired OTP"
  /// on a code that had actually just been used.
  String? _submitted;

  /// The ten local digits the customer typed, for display and validation.
  String get _phoneDigits => normalisePhone(_phoneCtrl.text);

  /// What actually goes on the wire.
  ///
  /// The website's login modal keeps the dial code in its own state and posts
  /// `{phone: countryCode + number}` — i.e. **"+919832399399"** — to
  /// `/auth/otp/send`, and the same string to its `phone-otp` sign-in. The
  /// account is therefore keyed on the `+91` form. This screen was posting the
  /// bare ten digits, which the API happily accepts but treats as a *different*
  /// customer: the OTP was issued against a phone key the SMS and the website
  /// account never shared, so verification could not line up.
  String get _phonePayload => '$_dialCode$_phoneDigits';

  /// Strips the dial code / trunk prefix the "+91" box already carries and
  /// keeps the last ten digits.
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
        if (err is String && err.isNotEmpty) return err;
      }
      switch (e.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Network timeout. Check your connection and try again.';
        case DioExceptionType.connectionError:
          return 'Cannot reach the server. Check your internet.';
        default:
          if (e.response != null) return 'Server error (${e.response!.statusCode}). Please try again.';
      }
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
        // Fixed-OTP/dev mode returns the code in the response; the website
        // shows it, so the app does too instead of waiting for an SMS that
        // never comes.
        _devCode = (res['otp'] ?? res['devCode'])?.toString() ?? '';
        _otpCtrl.clear();
        // A resend issues a new code, so the previous one is fair to retry.
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

  /// [auto] marks the submit that fires as the last digit is typed, so the
  /// button can still retry deliberately while the automatic one never
  /// double-spends a code.
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
      // Same string that was sent to /auth/otp/send, exactly as the website's
      // sign-in reuses `countryCode + number`.
      await EcomApi.I.verifyOtp(_phonePayload, code, name: _isNew ? _nameCtrl.text : null);
      // The live-side (VL Group) API keys on the bare 10-digit mobile.
      Session.I.setIdentity(phone: _phoneDigits, name: _nameCtrl.text);
      if (!mounted) return;
      // Signing in from the cart, wishlist or an order used to dump the
      // customer on Home; hand them back to whatever they were doing.
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

  void _toast(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
  }

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
      backgroundColor: VlColors.canvas,
      body: Column(children: [
        SizedBox(
          height: 200,
          child: Stack(fit: StackFit.expand, children: [
            const Silk(palette: 0, radius: 0),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, VlColors.canvas],
                  stops: [0.0, 0.95],
                ),
              ),
            ),
            Positioned(
              top: MediaQuery.of(context).padding.top + 24,
              left: 0,
              right: 0,
              child: BrandStack(color: VlColors.canvas),
            ),
          ]),
        ),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_step == 'phone' ? 'WELCOME BACK' : 'VERIFY YOUR NUMBER',
                  style: VlText.upper(10, color: VlColors.red, letter: 0.22)),
              const SizedBox(height: 8),
              Text(_step == 'phone' ? 'Sign in to continue' : 'Code sent to $_dialCode $_phoneDigits',
                  style: VlText.display(28)),
              const SizedBox(height: 6),
              Text(
                _step == 'phone'
                    ? 'We’ll send a one-time code to your phone.'
                    : 'Enter the code we just sent you.',
                style: VlText.body(13, color: VlColors.muted),
              ),
              const SizedBox(height: 22),
              // Mobile OTP is the only way in — the same as the website, which
              // offers no social sign-in. The Google / Facebook / Apple buttons
              // that used to sit here could never complete a sign-in.
              if (_step == 'phone') ..._phoneStep() else ..._otpStep(),
              const SizedBox(height: 18),
              // The policies are only tappable once the store publishes them:
              // /terms and /privacy 404 on the website today, and app-config's
              // legal URLs are empty, so a link would open a broken page.
              _legalLine(),
            ]),
          ),
        ),
      ]),
    );
  }

  List<Widget> _phoneStep() => [
        Text('MOBILE NUMBER', style: VlText.upper(9, color: VlColors.muted, letter: 0.18)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          decoration: BoxDecoration(
            color: VlColors.paper,
            borderRadius: BorderRadius.circular(VlRadii.md),
            border: Border.all(color: VlColors.rule2),
          ),
          child: Row(children: [
            Text('+91', style: VlText.ui(15, weight: FontWeight.w500)),
            Container(width: 1, height: 18, margin: const EdgeInsets.symmetric(horizontal: 10), color: VlColors.rule2),
            Expanded(
              child: TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                // Ten digits, like the website's field — the "+91" beside it
                // already carries the country code.
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(10),
                ],
                onSubmitted: (_) => _busy ? null : _sendOtp(),
                style: VlText.ui(15, letter: 0.06),
                decoration: InputDecoration(
                  border: InputBorder.none,
                  isCollapsed: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  hintText: '10-digit number',
                  hintStyle: VlText.body(13, color: VlColors.muted2),
                ),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 16),
        _primary(_busy ? 'SENDING…' : 'SEND OTP', _busy ? null : _sendOtp),
      ];

  List<Widget> _otpStep() => [
        if (_devCode.isNotEmpty) ...[
          Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF9C3),
              border: Border.all(color: const Color(0xFFFDE68A)),
              borderRadius: BorderRadius.circular(VlRadii.sm),
            ),
            child: Text('Dev mode — OTP: $_devCode',
                textAlign: TextAlign.center, style: VlText.ui(12, color: const Color(0xFF92400E))),
          ),
        ],
        TextField(
          controller: _otpCtrl,
          textAlign: TextAlign.center,
          keyboardType: TextInputType.number,
          autofocus: true,
          maxLength: _otpLength,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(_otpLength)],
          style: VlText.ui(28, weight: FontWeight.w600, letter: 14),
          onChanged: (v) {
            // Submits at the store's code length, as the website's OTP boxes
            // do — this used to wait for 6 digits of a 4-digit code, so it
            // never auto-submitted.
            if (v.replaceAll(RegExp(r'\D'), '').length == _otpLength && !_busy) _verify(auto: true);
          },
          decoration: InputDecoration(
            counterText: '',
            hintText: '••••',
            hintStyle: VlText.ui(28, weight: FontWeight.w600, color: VlColors.rule2, letter: 14),
            filled: true,
            fillColor: VlColors.paper,
            contentPadding: const EdgeInsets.symmetric(vertical: 16),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(VlRadii.md), borderSide: BorderSide(color: VlColors.rule2)),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(VlRadii.md), borderSide: BorderSide(color: VlColors.red)),
          ),
        ),
        if (_isNew) ...[
          const SizedBox(height: 14),
          TextField(
            controller: _nameCtrl,
            textCapitalization: TextCapitalization.words,
            style: VlText.ui(15),
            decoration: InputDecoration(
              hintText: 'Your name (new account)',
              hintStyle: VlText.body(13, color: VlColors.muted2),
              filled: true,
              fillColor: VlColors.paper,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VlRadii.md), borderSide: BorderSide(color: VlColors.rule2)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VlRadii.md), borderSide: BorderSide(color: VlColors.red)),
            ),
          ),
        ],
        const SizedBox(height: 16),
        Center(
          child: _resend > 0
              ? Text.rich(TextSpan(style: VlText.body(12, color: VlColors.muted), children: [
                  const TextSpan(text: 'Resend in '),
                  TextSpan(text: '00:${_resend.toString().padLeft(2, '0')}', style: VlText.ui(12, color: VlColors.ink)),
                ]))
              : GestureDetector(onTap: _sendOtp, child: Text('Resend code', style: VlText.ui(12, color: VlColors.red))),
        ),
        const SizedBox(height: 14),
        _primary(_busy ? 'VERIFYING…' : 'VERIFY & CONTINUE', _busy ? null : _verify),
        const SizedBox(height: 10),
        Center(
          child: GestureDetector(
            onTap: () => setState(() => _step = 'phone'),
            child: Text('Edit phone number', style: VlText.body(12, color: VlColors.muted)),
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
                style: VlText.body(11, color: url.isEmpty ? VlColors.ink : VlColors.red),
                recognizer: url.isEmpty ? null : (TapGestureRecognizer()..onTap = () => openExternal(context, url)),
              );
          return Text.rich(
            TextSpan(style: VlText.body(11, color: VlColors.muted2, height: 1.5), children: [
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

  Widget _primary(String label, VoidCallback? onTap) => GestureDetector(
        onTap: onTap,
        child: Opacity(
          opacity: onTap == null ? 0.7 : 1,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 16),
            alignment: Alignment.center,
            decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
            child: Text(label, style: VlText.ui(13, weight: FontWeight.w600, color: Colors.white, letter: 0.12)),
          ),
        ),
      );

}
