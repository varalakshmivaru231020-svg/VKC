import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/errors/failures.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/widgets/state_widgets.dart";
import "../data/address_model.dart";
import "../data/address_repository.dart";

class AddressesScreen extends ConsumerWidget {
  const AddressesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(addressesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("Saved addresses")),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text("Add address"),
        onPressed: () => _openForm(context, ref, null),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(addressesProvider.future),
        child: list.when(
          loading: () => const AppLoading(),
          error: (e, _) => AppErrorView(failure: e is Failure ? e : UnknownFailure(e.toString()),
              onRetry: () => ref.invalidate(addressesProvider)),
          data: (addresses) {
            if (addresses.isEmpty) {
              return AppEmpty(
                title: "No saved addresses yet",
                description: "Add one to make checkout faster.",
                icon: Icons.location_on_outlined,
                action: ElevatedButton.icon(
                  onPressed: () => _openForm(context, ref, null),
                  icon: const Icon(Icons.add),
                  label: const Text("Add address"),
                ),
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              itemCount: addresses.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) => _AddressCard(
                address: addresses[i],
                onEdit: () => _openForm(context, ref, addresses[i]),
                onDelete: () async {
                  final ok = await showDialog<bool>(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: const Text("Delete address?"),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
                        ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text("Delete")),
                      ],
                    ),
                  );
                  if (ok == true) {
                    await ref.read(addressRepositoryProvider).delete(addresses[i].id);
                    ref.invalidate(addressesProvider);
                  }
                },
              ),
            );
          },
        ),
      ),
    );
  }

  void _openForm(BuildContext context, WidgetRef ref, Address? existing) {
    showAddressFormSheet(context, existing: existing);
  }
}

/// Shows the create / edit address bottom sheet. Returns when the user closes it.
/// Used both from the standalone Addresses screen and from Checkout's
/// "Add new address" link.
Future<void> showAddressFormSheet(BuildContext context, {Address? existing}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
    builder: (sheetCtx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(sheetCtx).viewInsets.bottom),
      child: _AddressForm(existing: existing),
    ),
  );
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({required this.address, required this.onEdit, required this.onDelete});
  final Address address;
  final VoidCallback onEdit, onDelete;

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final colors = context.appColors;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: colors.parchment),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Text(address.fullName, style: theme.textTheme.titleSmall),
            if (address.label != null) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(color: colors.cream, borderRadius: BorderRadius.circular(4)),
                child: Text(address.label!, style: theme.textTheme.labelSmall?.copyWith(color: colors.textMuted)),
              ),
            ],
            const Spacer(),
            if (address.isDefault)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: colors.primary50, borderRadius: BorderRadius.circular(4)),
                child: Text("DEFAULT", style: TextStyle(color: theme.colorScheme.primary, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.8)),
              ),
          ]),
          const SizedBox(height: 6),
          Text(address.oneLine, style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
          const SizedBox(height: 2),
          Text(address.phone, style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
          const SizedBox(height: 8),
          Row(
            children: [
              TextButton.icon(onPressed: onEdit, icon: const Icon(Icons.edit_outlined, size: 16), label: const Text("Edit")),
              TextButton.icon(
                onPressed: onDelete,
                icon: Icon(Icons.delete_outline, size: 16, color: theme.colorScheme.error),
                label: Text("Delete", style: TextStyle(color: theme.colorScheme.error)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AddressForm extends ConsumerStatefulWidget {
  const _AddressForm({this.existing});
  final Address? existing;

  @override
  ConsumerState<_AddressForm> createState() => _AddressFormState();
}

class _AddressFormState extends ConsumerState<_AddressForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name, _phone, _line1, _line2, _city, _state, _pincode;
  String _country = "India";
  bool   _default = false;
  bool   _saving  = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final a = widget.existing;
    _name    = TextEditingController(text: a?.fullName ?? "");
    _phone   = TextEditingController(text: a?.phone ?? "");
    _line1   = TextEditingController(text: a?.addressLine1 ?? "");
    _line2   = TextEditingController(text: a?.addressLine2 ?? "");
    _city    = TextEditingController(text: a?.city ?? "");
    _state   = TextEditingController(text: a?.state ?? "");
    _pincode = TextEditingController(text: a?.pincode ?? "");
    _country = a?.country ?? "India";
    _default = a?.isDefault ?? false;
  }

  @override
  void dispose() {
    _name.dispose(); _phone.dispose(); _line1.dispose(); _line2.dispose();
    _city.dispose(); _state.dispose(); _pincode.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _saving = true; _error = null; });
    try {
      final repo = ref.read(addressRepositoryProvider);
      final input = Address(
        id: widget.existing?.id ?? "",
        fullName: _name.text.trim(),
        phone:    _phone.text.trim(),
        addressLine1: _line1.text.trim(),
        addressLine2: _line2.text.trim().isEmpty ? null : _line2.text.trim(),
        city:    _city.text.trim(),
        state:   _state.text.trim(),
        pincode: _pincode.text.trim(),
        country: _country,
        isDefault: _default,
      );
      if (widget.existing == null) {
        await repo.create(input);
      } else {
        await repo.update(widget.existing!.id, input);
      }
      ref.invalidate(addressesProvider);
      if (mounted) Navigator.pop(context);
    } on Failure catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String? _required(String? v) => (v == null || v.trim().isEmpty) ? "Required" : null;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(widget.existing == null ? "Add address" : "Edit address",
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              TextFormField(controller: _name,    decoration: const InputDecoration(labelText: "Full name"), validator: _required),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phone, keyboardType: TextInputType.phone,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
                decoration: const InputDecoration(labelText: "Phone (10-digit)"),
                validator: (v) => (v == null || v.length != 10) ? "10-digit number required" : null,
              ),
              const SizedBox(height: 12),
              TextFormField(controller: _line1, decoration: const InputDecoration(labelText: "Address line 1"), validator: _required),
              const SizedBox(height: 12),
              TextFormField(controller: _line2, decoration: const InputDecoration(labelText: "Address line 2 (optional)")),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: TextFormField(controller: _city,  decoration: const InputDecoration(labelText: "City"),  validator: _required)),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(controller: _state, decoration: const InputDecoration(labelText: "State"), validator: _required)),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: TextFormField(
                  controller: _pincode,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                  decoration: const InputDecoration(labelText: "Pincode"),
                  validator: (v) => (v == null || v.length != 6) ? "6-digit pincode required" : null,
                )),
                const SizedBox(width: 12),
                Expanded(child: TextFormField(
                  initialValue: _country,
                  decoration: const InputDecoration(labelText: "Country"),
                  onChanged: (v) => _country = v.trim().isEmpty ? "India" : v.trim(),
                )),
              ]),
              const SizedBox(height: 8),
              SwitchListTile.adaptive(
                value: _default,
                onChanged: (v) => setState(() => _default = v),
                title: const Text("Set as default"),
                contentPadding: EdgeInsets.zero,
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                    : Text(widget.existing == null ? "Save address" : "Update address"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
