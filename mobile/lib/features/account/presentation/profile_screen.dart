import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_client.dart";
import "../../../core/errors/failures.dart";
import "../../auth/data/auth_controller.dart";
import "../../auth/data/user_model.dart";

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _formKey   = GlobalKey<FormState>();
  late TextEditingController _firstName, _lastName, _email;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final u = ref.read(currentUserProvider);
    _firstName = TextEditingController(text: u?.firstName ?? "");
    _lastName  = TextEditingController(text: u?.lastName  ?? "");
    _email     = TextEditingController(text: u?.email     ?? "");
  }

  @override
  void dispose() {
    _firstName.dispose(); _lastName.dispose(); _email.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _saving = true; _error = null; });
    try {
      final api = ref.read(apiClientProvider);
      final json = await api.patch<Map<String, dynamic>>("/profile", body: {
        "firstName": _firstName.text.trim(),
        "lastName":  _lastName.text.trim(),
        "email":     _email.text.trim(),
      });
      final user = User.fromJson((json["user"] as Map).cast<String, dynamic>());
      ref.read(authControllerProvider.notifier).setUser(user);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Profile updated"), behavior: SnackBarBehavior.floating),
      );
    } on Failure catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Profile")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (user?.phone != null) ...[
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.phone_iphone_rounded),
                  title: Text(user!.phone!),
                  subtitle: const Text("Mobile (verified)"),
                ),
                const SizedBox(height: 8),
              ],
              TextFormField(
                controller: _firstName,
                decoration: const InputDecoration(labelText: "First name"),
                textInputAction: TextInputAction.next,
                validator: (v) => (v == null || v.trim().isEmpty) ? "Required" : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _lastName,
                decoration: const InputDecoration(labelText: "Last name"),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: "Email (optional)"),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return null;
                  final ok = RegExp(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").hasMatch(v.trim());
                  return ok ? null : "Enter a valid email";
                },
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                    : const Text("Save changes"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
