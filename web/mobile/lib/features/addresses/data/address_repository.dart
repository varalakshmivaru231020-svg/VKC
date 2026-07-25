import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_client.dart";
import "../../auth/data/auth_controller.dart";
import "address_model.dart";

class AddressRepository {
  AddressRepository(this._api);
  final ApiClient _api;

  Future<List<Address>> list() async {
    final json = await _api.get<Map<String, dynamic>>("/addresses");
    return (json["addresses"] as List? ?? const [])
        .map((e) => Address.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<Address> create(Address a) async {
    final json = await _api.post<Map<String, dynamic>>("/addresses", body: a.toJson());
    return Address.fromJson((json["address"] as Map).cast<String, dynamic>());
  }

  Future<Address> update(String id, Address a) async {
    final json = await _api.patch<Map<String, dynamic>>("/addresses/$id", body: a.toJson());
    return Address.fromJson((json["address"] as Map).cast<String, dynamic>());
  }

  Future<void> delete(String id) async {
    await _api.delete<dynamic>("/addresses/$id");
  }
}

final addressRepositoryProvider = Provider<AddressRepository>(
  (ref) => AddressRepository(ref.watch(apiClientProvider)),
);

final addressesProvider = FutureProvider<List<Address>>((ref) async {
  final auth = ref.watch(authControllerProvider);
  if (!auth.isLoggedIn) return const [];
  return ref.watch(addressRepositoryProvider).list();
});
