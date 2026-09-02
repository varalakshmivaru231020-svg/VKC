import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../ecom/ecom_api.dart';
import '../theme.dart';
import '../widgets.dart';

String _inr(num v) => v.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');

// ── Edit profile ─────────────────────────────────────────────────────────────
/// Name + email, saved with PATCH /v1/profile. The phone is the login
/// identity, so it is shown but not editable.
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});
  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();

  bool _loading = true;
  bool _saving = false;
  String? _loadError;
  String? _formError;
  Map<String, String> _errors = {};
  String _phone = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in [_first, _last, _email]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    // Start from the session user so the form is never blank, then refine it
    // with the server's copy.
    final u = EcomAuth.I.user.value;
    _first.text = u?.firstName ?? '';
    _last.text = u?.lastName ?? '';
    _email.text = u?.email ?? '';
    _phone = u?.phone ?? '';
    try {
      final p = await EcomApi.I.profile();
      if (!mounted) return;
      setState(() {
        _first.text = '${p['firstName'] ?? _first.text}';
        _last.text = '${p['lastName'] ?? _last.text}';
        _email.text = '${p['email'] ?? _email.text}';
        _phone = '${p['phone'] ?? _phone}';
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        // The session copy is enough to edit with, so a failed refresh is a
        // note rather than a wall.
        _loadError = u == null ? ecomError(e, 'Could not load your profile.') : null;
        _loading = false;
      });
    }
  }

  Future<void> _save() async {
    final errors = <String, String>{};
    if (_first.text.trim().isEmpty) errors['firstName'] = 'Required';
    final email = _email.text.trim();
    if (email.isNotEmpty && !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      errors['email'] = 'Enter a valid email';
    }
    setState(() {
      _errors = errors;
      _formError = null;
    });
    if (errors.isNotEmpty) return;

    setState(() => _saving = true);
    try {
      await EcomApi.I.updateProfile({
        'firstName': _first.text.trim(),
        'lastName': _last.text.trim(),
        if (email.isNotEmpty) 'email': email,
      });
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated')));
      if (context.canPop()) context.pop();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _formError = ecomError(e, 'Could not save your profile');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VlColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(title: 'Edit Profile', onBack: () => context.canPop() ? context.pop() : context.go('/profile')),
          Expanded(
            child: _loading
                ? const ListRowsSkeleton(count: 4, thumb: 0)
                : _loadError != null
                    ? Center(
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          Icon(Icons.wifi_off, size: 34, color: VlColors.red),
                          const SizedBox(height: 12),
                          Text(_loadError!, style: VlText.body(13, color: VlColors.muted)),
                          const SizedBox(height: 12),
                          TextButton(onPressed: _load, child: Text('Retry', style: VlText.ui(13, color: VlColors.red))),
                        ]),
                      )
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
                        children: [
                          Text('Your details', style: VlText.display(24)),
                          const SizedBox(height: 4),
                          Text('HOW WE ADDRESS YOU', style: VlText.upper(9, color: VlColors.muted, letter: 0.2)),
                          const SizedBox(height: 18),
                          if (_formError != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: VlColors.redTint,
                                border: Border.all(color: VlColors.red),
                                borderRadius: BorderRadius.circular(VlRadii.sm),
                              ),
                              child: Text(_formError!, style: VlText.body(12, color: VlColors.red)),
                            ),
                            const SizedBox(height: 14),
                          ],
                          _field(_first, 'First name *', 'Priya', 'firstName', TextInputType.name),
                          _field(_last, 'Last name', 'Sharma', 'lastName', TextInputType.name),
                          _field(_email, 'Email', 'you@example.com', 'email', TextInputType.emailAddress),
                          _phoneRow(),
                          const SizedBox(height: 18),
                          GestureDetector(
                            onTap: _saving ? null : _save,
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 15),
                              alignment: Alignment.center,
                              decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
                              child: _saving
                                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : Text('SAVE CHANGES', style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
                            ),
                          ),
                        ],
                      ),
          ),
        ]),
      ),
    );
  }

  Widget _phoneRow() => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Mobile number', style: VlText.ui(11, weight: FontWeight.w500, color: VlColors.muted)),
          const SizedBox(height: 6),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
            decoration: BoxDecoration(
              color: VlColors.cream,
              borderRadius: BorderRadius.circular(VlRadii.md),
              border: Border.all(color: VlColors.rule),
            ),
            child: Row(children: [
              Expanded(child: Text(_phone.isEmpty ? '—' : _phone, style: VlText.ui(14, color: VlColors.muted))),
              Icon(Icons.lock_outline, size: 14, color: VlColors.muted2),
            ]),
          ),
          const SizedBox(height: 5),
          Text('Your number is how you sign in — contact us to change it.', style: VlText.mono(9, color: VlColors.muted2, letter: 0.08)),
        ]),
      );

  Widget _field(TextEditingController c, String label, String hint, String key, TextInputType type) {
    final err = _errors[key];
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: VlText.ui(11, weight: FontWeight.w500, color: VlColors.muted)),
        const SizedBox(height: 6),
        TextField(
          controller: c,
          keyboardType: type,
          textCapitalization: type == TextInputType.name ? TextCapitalization.words : TextCapitalization.none,
          style: VlText.ui(14),
          onChanged: err == null ? null : (_) => setState(() => _errors = {..._errors}..remove(key)),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: VlText.body(13, color: VlColors.muted2),
            filled: true,
            fillColor: VlColors.paper,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(VlRadii.md),
                borderSide: BorderSide(color: err != null ? VlColors.red : VlColors.rule)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VlRadii.md), borderSide: BorderSide(color: VlColors.red)),
          ),
        ),
        if (err != null) ...[
          const SizedBox(height: 4),
          Text(err, style: VlText.body(11, color: VlColors.red)),
        ],
      ]),
    );
  }
}

// ── Wallet ───────────────────────────────────────────────────────────────────
/// Store credit (GET /v1/wallet): the balance, its ledger when the store
/// returns one, and where it gets spent.
class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});
  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  num _balance = 0;
  List<Map<String, dynamic>> _entries = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final w = await EcomApi.I.wallet();
      if (!mounted) return;
      setState(() {
        _balance = w.balance;
        _entries = w.entries;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = ecomError(e, 'Could not load your wallet.');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VlColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(title: 'Store Wallet', onBack: () => context.canPop() ? context.pop() : context.go('/profile')),
          Expanded(child: _body()),
        ]),
      ),
    );
  }

  Widget _body() {
    if (_loading && _entries.isEmpty && _balance == 0) return const _WalletSkeleton();
    // Only when the ledger is empty — a failed refresh keeps the balance.
    if (_error != null && _entries.isEmpty && _balance == 0) {
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.wifi_off, size: 34, color: VlColors.red),
          const SizedBox(height: 12),
          Text(_error!, style: VlText.body(13, color: VlColors.muted)),
          const SizedBox(height: 12),
          TextButton(onPressed: _load, child: Text('Retry', style: VlText.ui(13, color: VlColors.red))),
        ]),
      );
    }
    return RefreshIndicator(
      color: VlColors.red,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
        children: [
          _balanceCard(),
          const SizedBox(height: 20),
          Text('HOW IT WORKS', style: VlText.upper(9, letter: 0.22)),
          const SizedBox(height: 10),
          _note(Icons.shopping_bag_outlined, 'Spend it at checkout',
              'Switch the wallet on in the payment step and it comes straight off your total.'),
          _note(Icons.assignment_return_outlined, 'Refunds land here',
              'Cancelled or returned orders are credited back to your wallet when the store settles them.'),
          if (_entries.isNotEmpty) ...[
            const DoubleRule(margin: EdgeInsets.symmetric(vertical: 20)),
            Text('ACTIVITY', style: VlText.upper(9, letter: 0.22)),
            const SizedBox(height: 8),
            ..._entries.map(_entryRow),
          ],
        ],
      ),
    );
  }

  Widget _balanceCard() => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [VlColors.ink, VlColors.redInk]),
          borderRadius: BorderRadius.circular(VlRadii.lg),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('AVAILABLE BALANCE', style: VlText.upper(9, color: VlColors.goldSoft, letter: 0.22)),
          const SizedBox(height: 8),
          Text('₹${_inr(_balance)}', style: VlText.display(38, color: Colors.white)),
          const SizedBox(height: 14),
          const Divider(color: Color(0x33E8D5A8), height: 1),
          const SizedBox(height: 12),
          Row(children: [
            Icon(Icons.info_outline, size: 13, color: VlColors.goldSoft),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                _balance > 0 ? 'Applied at checkout, before any payment.' : 'Credit shows up here as soon as the store issues it.',
                style: VlText.mono(10, color: Colors.white70),
              ),
            ),
          ]),
        ]),
      );

  Widget _note(IconData ic, String title, String body) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(color: VlColors.cream, borderRadius: BorderRadius.circular(8)),
            child: Icon(ic, size: 15, color: VlColors.redDeep),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: VlText.ui(12, weight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text(body, style: VlText.body(11, color: VlColors.muted, height: 1.5)),
            ]),
          ),
        ]),
      );

  Widget _entryRow(Map<String, dynamic> e) {
    final amount = (e['amount'] as num?) ?? 0;
    final type = '${e['type'] ?? ''}'.toUpperCase();
    final credit = type.contains('CREDIT') || type.contains('REFUND') || amount > 0;
    final when = DateTime.tryParse('${e['createdAt'] ?? ''}');
    final note = '${e['description'] ?? e['note'] ?? e['reason'] ?? (credit ? 'Credit' : 'Spent')}';
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: VlColors.rule))),
      child: Row(children: [
        Icon(credit ? Icons.south_west : Icons.north_east, size: 14, color: credit ? VlColors.green : VlColors.red),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(note, style: VlText.ui(12, weight: FontWeight.w500)),
            if (when != null) ...[
              const SizedBox(height: 2),
              Text(DateFormat('d MMM yyyy').format(when.toLocal()), style: VlText.mono(9, color: VlColors.muted)),
            ],
          ]),
        ),
        Text('${credit ? '+' : '−'}₹${_inr(amount.abs())}',
            style: VlText.ui(13, weight: FontWeight.w600, color: credit ? VlColors.green : VlColors.ink)),
      ]),
    );
  }
}

/// Wallet placeholder: the balance card, then the notes beneath it.
class _WalletSkeleton extends StatelessWidget {
  const _WalletSkeleton();
  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
        physics: const NeverScrollableScrollPhysics(),
        children: const [
          Skeleton(height: 150, radius: VlRadii.lg),
          SizedBox(height: 22),
          Skeleton(width: 120, height: 9),
          SizedBox(height: 14),
          Skeleton(height: 44),
          SizedBox(height: 12),
          Skeleton(height: 44),
        ],
      );
}

// ── Reviews ──────────────────────────────────────────────────────────────────
/// Reviews live on the website: the mobile API (/api/v1) exposes no review
/// endpoint, so the app hands the customer over rather than inventing ratings.
class ReviewsScreen extends StatelessWidget {
  const ReviewsScreen({super.key});

  static const _webReviews = 'https://vkcgoldikshu.com/account/reviews';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VlColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(title: 'My Reviews', onBack: () => context.canPop() ? context.pop() : context.go('/profile')),
          Expanded(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.rate_review_outlined, size: 40, color: VlColors.red),
                  const SizedBox(height: 14),
                  Text('Reviews live on the website', textAlign: TextAlign.center, style: VlText.display(22)),
                  const SizedBox(height: 8),
                  Text(
                    'Rate the products you’ve received at vkcgoldikshu.com — sign in with the same mobile number.',
                    textAlign: TextAlign.center,
                    style: VlText.body(13, color: VlColors.muted, height: 1.6),
                  ),
                  const SizedBox(height: 20),
                  GestureDetector(
                    onTap: () => openExternal(context, _webReviews),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 13),
                      decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Text('OPEN REVIEWS', style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
                        const SizedBox(width: 8),
                        const Icon(Icons.open_in_new, size: 14, color: Colors.white),
                      ]),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: () {
                      Clipboard.setData(const ClipboardData(text: _webReviews));
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied')));
                    },
                    child: Text('Copy link', style: VlText.ui(12, color: VlColors.muted)),
                  ),
                ]),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}
