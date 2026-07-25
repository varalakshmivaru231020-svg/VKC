/// Customer delivery / billing address. Mirrors `/api/v1/addresses` rows.
class Address {
  final String id;
  final String? label;
  final String fullName, phone, addressLine1;
  final String? addressLine2;
  final String city, state, pincode, country;
  final bool isDefault;

  const Address({
    required this.id, required this.fullName, required this.phone,
    required this.addressLine1, required this.city, required this.state,
    required this.pincode, required this.country, required this.isDefault,
    this.label, this.addressLine2,
  });

  factory Address.fromJson(Map<String, dynamic> j) => Address(
        id:           j["id"]           as String,
        label:        j["label"]        as String?,
        fullName:     j["fullName"]     as String? ?? "",
        phone:        j["phone"]        as String? ?? "",
        addressLine1: j["addressLine1"] as String? ?? "",
        addressLine2: j["addressLine2"] as String?,
        city:         j["city"]         as String? ?? "",
        state:        j["state"]        as String? ?? "",
        pincode:      j["pincode"]      as String? ?? "",
        country:      j["country"]      as String? ?? "India",
        isDefault:    j["isDefault"]    == true,
      );

  Map<String, dynamic> toJson() => {
        "fullName": fullName, "phone": phone,
        "addressLine1": addressLine1, "addressLine2": addressLine2,
        "city": city, "state": state, "pincode": pincode, "country": country,
        if (label != null) "label": label,
        "isDefault": isDefault,
      };

  String get oneLine =>
      "$addressLine1${addressLine2 != null && addressLine2!.isNotEmpty ? ', $addressLine2' : ''}, $city, $state — $pincode";
}
