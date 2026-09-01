import 'package:flutter_test/flutter_test.dart';
import 'package:vkc_customer/ecom/ecom_config.dart';
import 'package:vkc_customer/ecom/ecom_models.dart';
import 'package:vkc_customer/screens/address_screens.dart';

Address _addr({String id = '1', bool isDefault = false}) => Address(
      id: id,
      fullName: 'Priya Sharma',
      phone: '9876543210',
      addressLine1: '12 Temple Street',
      city: 'Udupi',
      state: 'Karnataka',
      pincode: '576101',
      country: 'India',
      isDefault: isDefault,
    );

void main() {
  group('address validation (website rules)', () {
    Map<String, String> run({
      String fullName = 'Priya Sharma',
      String phone = '9876543210',
      String addressLine1 = '12 Temple Street',
      String city = 'Udupi',
      String state = 'Karnataka',
      String pincode = '576101',
    }) =>
        addressErrors(
          fullName: fullName,
          phone: phone,
          addressLine1: addressLine1,
          city: city,
          state: state,
          pincode: pincode,
        );

    test('a complete address passes', () => expect(run(), isEmpty));

    test('every required field is checked', () {
      expect(run(fullName: '   ')['fullName'], 'Required');
      expect(run(addressLine1: '')['addressLine1'], 'Required');
      expect(run(city: '')['city'], 'Required');
      expect(run(state: '')['state'], 'Required');
    });

    test('phone must be 10 digits', () {
      expect(run(phone: '98765')['phone'], 'Valid 10-digit number required');
      expect(run(phone: '9876543210'), isEmpty);
    });

    test('pincode must be exactly 6 digits', () {
      expect(run(pincode: '5761')['pincode'], 'Valid 6-digit pincode required');
      expect(run(pincode: '5761011')['pincode'], 'Valid 6-digit pincode required');
      expect(run(pincode: '576101'), isEmpty);
    });
  });

  test('the default address sorts to the top of the book', () {
    final sorted = sortedAddresses([_addr(id: 'a'), _addr(id: 'b', isDefault: true), _addr(id: 'c')]);
    expect(sorted.first.id, 'b');
    expect(sorted.map((a) => a.id), ['b', 'a', 'c']);
  });

  group('shipping matches the store config', () {
    const cfg = StoreConfig({
      'shipping': {'freeShippingThreshold': 10000, 'firstSareeRate': 100, 'additionalSareeRate': 50},
    });

    test('first saree at the base rate, each extra at the additional rate', () {
      expect(cfg.shippingFor(subtotal: 4000, itemCount: 1), 100);
      expect(cfg.shippingFor(subtotal: 4000, itemCount: 3), 200);
    });

    test('free at and above the threshold', () {
      expect(cfg.shippingFor(subtotal: 9999, itemCount: 1), 100);
      expect(cfg.shippingFor(subtotal: 10000, itemCount: 1), 0);
    });

    test('a free-shipping coupon wins', () {
      expect(cfg.shippingFor(subtotal: 500, itemCount: 4, freeShippingCoupon: true), 0);
    });

    test('an empty cart is never charged shipping', () {
      expect(cfg.shippingFor(subtotal: 0, itemCount: 0), 0);
    });

    test('falls back to the shipped defaults when the store sent nothing', () {
      const empty = StoreConfig();
      expect(empty.freeShippingThreshold, 10000);
      expect(empty.shippingFor(subtotal: 2000, itemCount: 2), 150);
    });
  });
}
