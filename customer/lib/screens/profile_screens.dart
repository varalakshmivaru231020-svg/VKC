import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../ecom/ecom_api.dart';
import '../theme.dart';
import '../widgets.dart';

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
  Object? _loadError;
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
        _loadError = u == null ? e : null;
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
      toast(context, 'Profile updated');
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
      backgroundColor: VkColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(title: 'Edit Profile', onBack: () => context.canPop() ? context.pop() : context.go('/profile')),
          Expanded(
            child: _loading
                ? const ListRowsSkeleton(count: 4, thumb: 0)
                : _loadError != null
                    ? StateView.error(_loadError, onRetry: _load)
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
                        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                        children: [
                          Text('Your details', style: VkText.display(24)),
                          const SizedBox(height: 4),
                          Text('HOW WE ADDRESS YOU', style: VkText.upper(9, color: VkColors.muted, letter: 0.16)),
                          const SizedBox(height: 18),
                          if (_formError != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: VkColors.primaryTint,
                                border: Border.all(color: VkColors.error),
                                borderRadius: BorderRadius.circular(VkRadii.sm),
                              ),
                              child: Text(_formError!, style: VkText.body(12, color: VkColors.error)),
                            ),
                            const SizedBox(height: 14),
                          ],
                          _field(_first, 'First name *', 'Priya', 'firstName', TextInputType.name),
                          _field(_last, 'Last name', 'Sharma', 'lastName', TextInputType.name),
                          _field(_email, 'Email', 'you@example.com', 'email', TextInputType.emailAddress),
                          _phoneRow(),
                          const SizedBox(height: 18),
                          PrimaryButton(label: 'Save changes', loading: _saving, onTap: _saving ? null : _save),
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
          Text('Mobile number', style: VkText.ui(11, weight: FontWeight.w500, color: VkColors.muted)),
          const SizedBox(height: 6),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
            decoration: BoxDecoration(
              color: VkColors.cream,
              borderRadius: BorderRadius.circular(VkRadii.md),
              border: Border.all(color: VkColors.rule),
            ),
            child: Row(children: [
              Expanded(child: Text(_phone.isEmpty ? '—' : _phone, style: VkText.ui(14, color: VkColors.muted))),
              const Icon(Icons.lock_outline, size: 14, color: VkColors.muted2),
            ]),
          ),
          const SizedBox(height: 5),
          Text('Your number is how you sign in — contact us to change it.', style: VkText.body(11, color: VkColors.muted2)),
        ]),
      );

  Widget _field(TextEditingController c, String label, String hint, String key, TextInputType type) {
    final err = _errors[key];
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: VkText.ui(11, weight: FontWeight.w500, color: VkColors.muted)),
        const SizedBox(height: 6),
        TextField(
          controller: c,
          keyboardType: type,
          textCapitalization: type == TextInputType.name ? TextCapitalization.words : TextCapitalization.none,
          style: VkText.ui(14),
          onChanged: err == null ? null : (_) => setState(() => _errors = {..._errors}..remove(key)),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: VkText.body(13, color: VkColors.muted2),
            filled: true,
            fillColor: VkColors.paper,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(VkRadii.md),
                borderSide: BorderSide(color: err != null ? VkColors.error : VkColors.rule)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VkRadii.md), borderSide: const BorderSide(color: VkColors.primary)),
          ),
        ),
        if (err != null) ...[
          const SizedBox(height: 4),
          Text(err, style: VkText.body(11, color: VkColors.error)),
        ],
      ]),
    );
  }
}
