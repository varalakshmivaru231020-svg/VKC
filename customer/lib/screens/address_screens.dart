import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_models.dart';
import '../theme.dart';
import '../widgets.dart';

/// States + union territories the website offers in its checkout state list.
const kIndianStates = <String>[
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir',
  'Ladakh', 'Puducherry', 'Chandigarh',
];

/// Field errors for an address, matching the website's checkout rules exactly
/// (same required fields, same 10-digit phone and 6-digit pincode, same copy).
Map<String, String> addressErrors({
  required String fullName,
  required String phone,
  required String addressLine1,
  required String city,
  required String state,
  required String pincode,
}) {
  final e = <String, String>{};
  if (fullName.trim().isEmpty) e['fullName'] = 'Required';
  if (phone.trim().length < 10) e['phone'] = 'Valid 10-digit number required';
  if (addressLine1.trim().isEmpty) e['addressLine1'] = 'Required';
  if (city.trim().isEmpty) e['city'] = 'Required';
  if (state.trim().isEmpty) e['state'] = 'Required';
  if (pincode.trim().length != 6) e['pincode'] = 'Valid 6-digit pincode required';
  return e;
}

/// Opens the add/edit address form. Returns the saved [Address], or null if
/// the customer backed out. Pass [existing] to edit it in place.
Future<Address?> showAddressSheet(
  BuildContext context, {
  Address? existing,
  bool defaultOnSave = false,
}) =>
    showModalBottomSheet<Address>(
      context: context,
      isScrollControlled: true,
      backgroundColor: VlColors.canvas,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(VlRadii.xl))),
      builder: (_) => AddressSheet(existing: existing, defaultOnSave: defaultOnSave),
    );

// ── Address Book ─────────────────────────────────────────────────────────────
/// The customer's saved addresses (GET/POST/PATCH/DELETE /v1/addresses).
/// Reached from Profile; the same records drive checkout's delivery step.
class AddressBookScreen extends StatefulWidget {
  const AddressBookScreen({super.key});
  @override
  State<AddressBookScreen> createState() => _AddressBookScreenState();
}

class _AddressBookScreenState extends State<AddressBookScreen> {
  List<Address> _addresses = [];
  bool _loading = true;
  String? _error;
  /// id of the row with a set-default / delete call in flight
  String? _busyId;

  @override
  void initState() {
    super.initState();
    if (EcomAuth.I.isLoggedIn) {
      _load();
    } else {
      _loading = false;
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await EcomApi.I.addresses();
      if (!mounted) return;
      setState(() {
        _addresses = sortedAddresses(list);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = ecomError(e, 'Could not load your addresses.');
        _loading = false;
      });
    }
  }

  void _toast(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
  }

  Future<void> _add() async {
    final saved = await showAddressSheet(context, defaultOnSave: _addresses.isEmpty);
    if (saved == null || !mounted) return;
    setState(() => _addresses = sortedAddresses([..._addresses.map((a) => a.copyWith(isDefault: a.isDefault && !saved.isDefault)), saved]));
    _toast('Address saved');
  }

  Future<void> _edit(Address a) async {
    final saved = await showAddressSheet(context, existing: a);
    if (saved == null || !mounted) return;
    setState(() {
      _addresses = sortedAddresses([
        for (final x in _addresses)
          if (x.id == saved.id) saved else x.copyWith(isDefault: x.isDefault && !saved.isDefault),
      ]);
    });
    _toast('Address updated');
  }

  Future<void> _makeDefault(Address a) async {
    if (a.isDefault || _busyId != null) return;
    setState(() => _busyId = a.id);
    try {
      await EcomApi.I.setDefaultAddress(a);
      if (!mounted) return;
      // The server clears the previous default; mirror that locally rather
      // than refetching, so the list doesn't flash.
      setState(() {
        _addresses = sortedAddresses([for (final x in _addresses) x.copyWith(isDefault: x.id == a.id)]);
        _busyId = null;
      });
      _toast('Default address updated');
    } catch (e) {
      if (!mounted) return;
      setState(() => _busyId = null);
      _toast(ecomError(e, 'Could not update the default address'));
    }
  }

  Future<void> _delete(Address a) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: VlColors.paper,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(VlRadii.md)),
        title: Text('Delete address?', style: VlText.display(20)),
        content: Text('${a.fullName} · ${a.oneLine}', style: VlText.body(13, color: VlColors.muted, height: 1.5)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Keep', style: VlText.ui(12, color: VlColors.muted))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('Delete', style: VlText.ui(12, color: VlColors.red, weight: FontWeight.w600))),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() => _busyId = a.id);
    try {
      await EcomApi.I.deleteAddress(a.id);
      if (!mounted) return;
      setState(() {
        _addresses = _addresses.where((x) => x.id != a.id).toList();
        _busyId = null;
      });
      _toast('Address deleted');
    } catch (e) {
      if (!mounted) return;
      setState(() => _busyId = null);
      _toast(ecomError(e, 'Could not delete the address'));
    }
  }

  @override
  Widget build(BuildContext context) {
    final loggedIn = EcomAuth.I.isLoggedIn;
    return Scaffold(
      backgroundColor: VlColors.canvas,
      body: SafeArea(bottom: false, child: _body(loggedIn)),
    );
  }

  Widget _body(bool loggedIn) {
    return Column(children: [
      TopBar(
        title: 'Address Book',
        // Pushed from Profile and from checkout, so popping is right; the
        // fallback covers a cold deep-link into the book.
        onBack: () => context.canPop() ? context.pop() : context.go('/profile'),
        actions: [
          // Stays put during a refresh — hiding it made the header jump.
          if (loggedIn && !(_loading && _addresses.isEmpty))
            InkResponse(
              onTap: _load,
              child: SizedBox(width: 36, height: 36, child: Icon(Icons.refresh, size: 18, color: VlColors.muted)),
            ),
        ],
      ),
      Expanded(child: loggedIn ? _content() : _signInPrompt()),
      // Keyed off content, not the loading flag, so a pull to refresh does not
      // make the button vanish and the list jump down.
      if (loggedIn && _addresses.isNotEmpty) _stickyAdd(),
    ]);
  }

  Widget _signInPrompt() => Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.location_on_outlined, size: 40, color: VlColors.red),
          const SizedBox(height: 14),
          Text('Sign in to manage addresses', style: VlText.display(22)),
          const SizedBox(height: 6),
          Text('Saved addresses make checkout one tap.', style: VlText.body(13, color: VlColors.muted)),
          const SizedBox(height: 16),
          TextButton(onPressed: () => context.push('/login'), child: Text('Sign in', style: VlText.ui(13, color: VlColors.red))),
        ]),
      );

  Widget _content() {
    if (_loading && _addresses.isEmpty) return const AddressListSkeleton();
    // Only when there is nothing to keep — a failed refresh must not throw
    // away addresses that are still perfectly good.
    if (_error != null && _addresses.isEmpty) {
      return _state(Icons.wifi_off, _error!, 'The addresses could not be fetched just now.', 'RETRY', _load);
    }
    if (_addresses.isEmpty) {
      return _state(Icons.location_on_outlined, 'No saved addresses', 'Add the address your orders should travel to.', 'ADD ADDRESS', _add);
    }
    return RefreshIndicator(
      color: VlColors.red,
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
        itemCount: _addresses.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final a = _addresses[i];
          return AddressCard(
            address: a,
            busy: _busyId == a.id,
            onEdit: () => _edit(a),
            onDelete: () => _delete(a),
            onMakeDefault: () => _makeDefault(a),
          );
        },
      ),
    );
  }

  Widget _state(IconData icon, String title, String body, String cta, VoidCallback onCta) => ListView(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        children: [
          const SizedBox(height: 90),
          Icon(icon, size: 40, color: VlColors.red),
          const SizedBox(height: 14),
          Text(title, textAlign: TextAlign.center, style: VlText.display(22)),
          const SizedBox(height: 6),
          Text(body, textAlign: TextAlign.center, style: VlText.body(13, color: VlColors.muted, height: 1.6)),
          const SizedBox(height: 20),
          Center(
            child: GestureDetector(
              onTap: onCta,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 13),
                decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
                child: Text(cta, style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
              ),
            ),
          ),
        ],
      );

  Widget _stickyAdd() => Container(
        decoration: BoxDecoration(color: VlColors.paper, border: Border(top: BorderSide(color: VlColors.rule))),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: GestureDetector(
              onTap: _add,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                alignment: Alignment.center,
                decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.add, size: 15, color: Colors.white),
                  const SizedBox(width: 8),
                  Text('ADD NEW ADDRESS', style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
                ]),
              ),
            ),
          ),
        ),
      );
}

/// Default first, then the rest in the order the API returned them — so the
/// address checkout will preselect always sits at the top of the book.
List<Address> sortedAddresses(List<Address> list) {
  final out = [...list];
  out.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  return out;
}

// ── Address card ─────────────────────────────────────────────────────────────
/// One saved address. Used as a managed row in the Address Book (edit /
/// delete / make default) and as a selectable row in checkout.
class AddressCard extends StatelessWidget {
  final Address address;
  final bool busy;

  /// Selection mode (checkout): shows a radio and reports taps.
  final bool selectable;
  final bool selected;
  final VoidCallback? onSelect;

  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final VoidCallback? onMakeDefault;

  const AddressCard({
    super.key,
    required this.address,
    this.busy = false,
    this.selectable = false,
    this.selected = false,
    this.onSelect,
    this.onEdit,
    this.onDelete,
    this.onMakeDefault,
  });

  @override
  Widget build(BuildContext context) {
    final a = address;
    return GestureDetector(
      onTap: selectable ? onSelect : onEdit,
      child: Opacity(
        opacity: busy ? 0.55 : 1,
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
          decoration: BoxDecoration(
            color: VlColors.paper,
            borderRadius: BorderRadius.circular(VlRadii.md),
            border: Border.all(
              color: selectable && selected ? VlColors.red : VlColors.rule,
              width: selectable && selected ? 1.5 : 1,
            ),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              if ((a.label ?? '').isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(border: Border.all(color: VlColors.red), borderRadius: BorderRadius.circular(3)),
                  child: Text(a.label!.toUpperCase(), style: VlText.upper(9, color: VlColors.red, letter: 0.18)),
                ),
                const SizedBox(width: 8),
              ],
              Flexible(child: Text(a.fullName, overflow: TextOverflow.ellipsis, style: VlText.ui(13, weight: FontWeight.w600))),
              if (a.isDefault) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(3)),
                  child: Text('DEFAULT', style: VlText.upper(8, color: Colors.white, letter: 0.18)),
                ),
              ],
              const Spacer(),
              if (busy)
                SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: VlColors.red))
              else if (selectable)
                Icon(selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                    size: 18, color: selected ? VlColors.red : VlColors.rule2),
            ]),
            const SizedBox(height: 6),
            Text(a.oneLine, style: VlText.body(12, color: VlColors.muted, height: 1.5)),
            const SizedBox(height: 2),
            Text(a.phone, style: VlText.mono(10, color: VlColors.muted)),
            const SizedBox(height: 6),
            Divider(color: VlColors.rule, height: 12),
            Row(children: [
              if (onEdit != null) _action(Icons.edit_outlined, 'EDIT', busy ? null : onEdit),
              if (onMakeDefault != null && !a.isDefault) _action(Icons.star_border, 'SET DEFAULT', busy ? null : onMakeDefault),
              const Spacer(),
              if (onDelete != null) _action(Icons.delete_outline, 'DELETE', busy ? null : onDelete, color: VlColors.red),
            ]),
          ]),
        ),
      ),
    );
  }

  Widget _action(IconData ic, String label, VoidCallback? onTap, {Color? color}) => InkResponse(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.only(right: 18, top: 6, bottom: 8),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(ic, size: 13, color: color ?? VlColors.ink),
            const SizedBox(width: 5),
            Text(label, style: VlText.upper(9, color: color ?? VlColors.ink, letter: 0.16)),
          ]),
        ),
      );
}

/// Shimmering stand-ins while the address list loads — same shape as the cards
/// that replace them, so nothing jumps.
class AddressListSkeleton extends StatelessWidget {
  final int count;
  const AddressListSkeleton({super.key, this.count = 3});
  @override
  Widget build(BuildContext context) => ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
        itemCount: count,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, __) => Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: VlColors.paper,
            borderRadius: BorderRadius.circular(VlRadii.md),
            border: Border.all(color: VlColors.rule),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
            Skeleton(width: 130, height: 13),
            SizedBox(height: 10),
            Skeleton(height: 11),
            SizedBox(height: 6),
            Skeleton(width: 190, height: 11),
            SizedBox(height: 14),
            Skeleton(width: 90, height: 9),
          ]),
        ),
      );
}

// ── Add / edit form ──────────────────────────────────────────────────────────
/// New-address (POST /v1/addresses) and edit (PATCH /v1/addresses/:id) form.
/// Validates before it calls, and surfaces the server's own message if the
/// save is refused.
class AddressSheet extends StatefulWidget {
  final Address? existing;

  /// Save this address as the default (used for the customer's first address).
  final bool defaultOnSave;
  const AddressSheet({super.key, this.existing, this.defaultOnSave = false});

  @override
  State<AddressSheet> createState() => _AddressSheetState();
}

class _AddressSheetState extends State<AddressSheet> {
  late final TextEditingController _name, _phone, _line1, _line2, _city, _state, _pin;
  Map<String, String> _errors = {};
  bool _saving = false;
  bool _makeDefault = false;
  String? _formError;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final a = widget.existing;
    _name = TextEditingController(text: a?.fullName ?? '');
    _phone = TextEditingController(text: a?.phone.replaceAll(RegExp(r'\D'), '') ?? '');
    _line1 = TextEditingController(text: a?.addressLine1 ?? '');
    _line2 = TextEditingController(text: a?.addressLine2 ?? '');
    _city = TextEditingController(text: a?.city ?? '');
    _state = TextEditingController(text: a?.state ?? '');
    _pin = TextEditingController(text: a?.pincode ?? '');
    // The first address is the default whether the customer asks or not; an
    // edit keeps whatever the record already is.
    _makeDefault = widget.defaultOnSave || (a?.isDefault ?? false);
  }

  @override
  void dispose() {
    for (final c in [_name, _phone, _line1, _line2, _city, _state, _pin]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    final errors = addressErrors(
      fullName: _name.text,
      phone: _phone.text,
      addressLine1: _line1.text,
      city: _city.text,
      state: _state.text,
      pincode: _pin.text,
    );
    setState(() {
      _errors = errors;
      _formError = null;
    });
    if (errors.isNotEmpty) return;

    setState(() => _saving = true);
    final fields = <String, dynamic>{
      'fullName': _name.text.trim(),
      'phone': _phone.text.trim(),
      'addressLine1': _line1.text.trim(),
      'addressLine2': _line2.text.trim(),
      'city': _city.text.trim(),
      'state': _state.text.trim(),
      'pincode': _pin.text.trim(),
      'country': widget.existing?.country ?? 'India',
      'isDefault': widget.defaultOnSave || _makeDefault,
    };
    try {
      final saved = _isEdit
          ? await EcomApi.I.updateAddress(widget.existing!.id, fields)
          : await EcomApi.I.addAddress(fields);
      if (!mounted) return;
      Navigator.pop(context, saved);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _formError = ecomError(e, _isEdit ? 'Could not update the address' : 'Could not save the address');
      });
    }
  }

  Future<void> _pickState() async {
    final picked = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: VlColors.canvas,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(VlRadii.xl))),
      builder: (_) => _StatePicker(selected: _state.text.trim()),
    );
    if (picked == null || !mounted) return;
    setState(() {
      _state.text = picked;
      _errors = {..._errors}..remove('state');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: VlColors.rule2, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 16),
          Text(_isEdit ? 'Edit address' : 'New address', style: VlText.display(22)),
          const SizedBox(height: 2),
          Text('WHERE SHOULD WE DELIVER?', style: VlText.upper(9, color: VlColors.muted, letter: 0.2)),
          const SizedBox(height: 16),
          if (_formError != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: VlColors.redTint,
                border: Border.all(color: VlColors.red),
                borderRadius: BorderRadius.circular(VlRadii.sm),
              ),
              child: Text(_formError!, style: VlText.body(12, color: VlColors.red)),
            ),
            const SizedBox(height: 12),
          ],
          _field(_name, 'Full Name *', 'Priya Sharma', TextInputType.name, key: 'fullName'),
          _field(_phone, 'Mobile Number *', '10-digit number', TextInputType.phone,
              key: 'phone',
              formatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)]),
          _field(_line1, 'Address Line 1 *', 'House / Flat / Block No., Street', TextInputType.streetAddress, key: 'addressLine1'),
          _field(_line2, 'Address Line 2', 'Locality / Landmark (optional)', TextInputType.streetAddress),
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(child: _field(_city, 'City *', 'Mumbai', TextInputType.text, key: 'city')),
            const SizedBox(width: 10),
            Expanded(child: _stateField()),
          ]),
          _field(_pin, 'Pincode *', '400001', TextInputType.number,
              key: 'pincode',
              formatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)]),
          const SizedBox(height: 2),
          _defaultToggle(),
          const SizedBox(height: 14),
          GestureDetector(
            onTap: _saving ? null : _save,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 15),
              alignment: Alignment.center,
              decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
              child: _saving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(_isEdit ? 'UPDATE ADDRESS' : 'SAVE ADDRESS',
                      style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
            ),
          ),
          const SizedBox(height: 6),
        ]),
      ),
    );
  }

  Widget _defaultToggle() {
    // The customer's only address is the default by definition — show it as
    // settled rather than as a choice that does nothing.
    final locked = widget.defaultOnSave || (_isEdit && widget.existing!.isDefault);
    return GestureDetector(
      onTap: locked ? null : () => setState(() => _makeDefault = !_makeDefault),
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(children: [
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              color: (locked || _makeDefault) ? VlColors.red : Colors.transparent,
              border: Border.all(color: (locked || _makeDefault) ? VlColors.red : VlColors.rule2),
              borderRadius: BorderRadius.circular(4),
            ),
            child: (locked || _makeDefault) ? const Icon(Icons.check, size: 12, color: Colors.white) : null,
          ),
          const SizedBox(width: 10),
          Text(
            locked ? 'This is your default address' : 'Make this my default address',
            style: VlText.body(12, color: locked ? VlColors.muted : VlColors.ink),
          ),
        ]),
      ),
    );
  }

  Widget _stateField() {
    final err = _errors['state'];
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('State *', style: VlText.ui(11, weight: FontWeight.w500, color: VlColors.muted)),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: _pickState,
          child: Container(
            height: 46,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: VlColors.paper,
              borderRadius: BorderRadius.circular(VlRadii.md),
              border: Border.all(color: err != null ? VlColors.red : VlColors.rule),
            ),
            child: Row(children: [
              Expanded(
                child: Text(
                  _state.text.isEmpty ? 'Select state' : _state.text,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: _state.text.isEmpty ? VlText.body(13, color: VlColors.muted2) : VlText.ui(14),
                ),
              ),
              Icon(Icons.expand_more, size: 16, color: VlColors.muted),
            ]),
          ),
        ),
        if (err != null) ...[
          const SizedBox(height: 4),
          Text(err, style: VlText.body(11, color: VlColors.red)),
        ],
      ]),
    );
  }

  Widget _field(
    TextEditingController c,
    String label,
    String hint,
    TextInputType type, {
    String? key,
    List<TextInputFormatter>? formatters,
  }) {
    final err = key == null ? null : _errors[key];
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: VlText.ui(11, weight: FontWeight.w500, color: VlColors.muted)),
        const SizedBox(height: 6),
        TextField(
          controller: c,
          keyboardType: type,
          inputFormatters: formatters,
          textCapitalization:
              type == TextInputType.name || type == TextInputType.text || type == TextInputType.streetAddress
                  ? TextCapitalization.words
                  : TextCapitalization.none,
          style: VlText.ui(14),
          onChanged: err == null
              ? null
              : (_) => setState(() => _errors = {..._errors}..remove(key)),
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
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(VlRadii.md), borderSide: BorderSide(color: VlColors.red)),
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

/// Searchable state list — the app's stand-in for the website's state datalist.
class _StatePicker extends StatefulWidget {
  final String selected;
  const _StatePicker({required this.selected});
  @override
  State<_StatePicker> createState() => _StatePickerState();
}

class _StatePickerState extends State<_StatePicker> {
  String _q = '';

  @override
  Widget build(BuildContext context) {
    final matches = kIndianStates.where((s) => s.toLowerCase().contains(_q.toLowerCase())).toList();
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.7,
        child: Column(children: [
          const SizedBox(height: 12),
          Container(width: 36, height: 4, decoration: BoxDecoration(color: VlColors.rule2, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: TextField(
              autofocus: true,
              style: VlText.ui(14),
              onChanged: (v) => setState(() => _q = v),
              decoration: InputDecoration(
                hintText: 'Search state',
                hintStyle: VlText.body(13, color: VlColors.muted2),
                prefixIcon: Icon(Icons.search, size: 16, color: VlColors.muted),
                filled: true,
                fillColor: VlColors.paper,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VlRadii.md), borderSide: BorderSide(color: VlColors.rule)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VlRadii.md), borderSide: BorderSide(color: VlColors.red)),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Expanded(
            child: matches.isEmpty
                ? Center(child: Text('No match', style: VlText.body(13, color: VlColors.muted)))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: matches.length,
                    itemBuilder: (_, i) {
                      final s = matches[i];
                      final active = s == widget.selected;
                      return GestureDetector(
                        onTap: () => Navigator.pop(context, s),
                        behavior: HitTestBehavior.opaque,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: VlColors.rule))),
                          child: Row(children: [
                            Expanded(child: Text(s, style: VlText.ui(13, weight: active ? FontWeight.w600 : FontWeight.w400))),
                            if (active) Icon(Icons.check, size: 15, color: VlColors.red),
                          ]),
                        ),
                      );
                    },
                  ),
          ),
        ]),
      ),
    );
  }
}
