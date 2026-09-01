import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:vkc_customer/ecom/ecom_models.dart';
import 'package:vkc_customer/screens/auth_screens.dart';

void main() {
  // The identity is cached beside the tokens so a launch with no connection
  // restores a signed-in customer instead of showing them as "Guest".
  group('cached session identity', () {
    test('survives a storage round trip', () {
      const u = EcomUser(id: 'u1', role: 'CUSTOMER', firstName: 'Gaurav', lastName: 'Singh', phone: '+919696342161');
      final back = EcomUser.fromJson(jsonDecode(jsonEncode(u.toJson())) as Map<String, dynamic>);
      expect(back.id, 'u1');
      expect(back.phone, '+919696342161');
      expect(back.displayName, 'Gaurav Singh');
      expect(back.role, 'CUSTOMER');
    });

    test('a customer with no name still restores their number', () {
      const u = EcomUser(id: 'u2', role: 'CUSTOMER', phone: '+919696342161');
      final back = EcomUser.fromJson(jsonDecode(jsonEncode(u.toJson())) as Map<String, dynamic>);
      expect(back.displayName, '+919696342161');
    });
  });

  group('phone payload matches the website login modal', () {
    String norm(String s) => LoginScreenPhone.normalise(s);
    String wire(String s) => LoginScreenPhone.payload(s);

    test('the wire format is dial code + 10 digits, as the modal posts', () {
      // Website: fetch('/api/auth/otp/send', {body: {phone: countryCode + number}})
      expect(wire('9832399399'), '+919832399399');
    });

    test('the dial code is never doubled, however it was typed', () {
      expect(wire('+91 98323 99399'), '+919832399399');
      expect(wire('919832399399'), '+919832399399');
      expect(wire('09832399399'), '+919832399399');
    });

    test('spaces, dashes and brackets are stripped', () {
      expect(norm('98323-99399'), '9832399399');
      expect(norm('(98323) 99399'), '9832399399');
    });

    test('a short number stays short so the screen can refuse it', () {
      expect(norm('98323').length, lessThan(10));
    });
  });

  group('sign-in response parsing', () {
    test('reads the documented shape', () {
      final s = AuthSession.fromJson({
        'accessToken': 'a-token',
        'refreshToken': 'r-token',
        'isNew': true,
        'user': {'id': 'u1', 'firstName': 'Priya', 'phone': '9832399399', 'role': 'CUSTOMER'},
      });
      expect(s.accessToken, 'a-token');
      expect(s.refreshToken, 'r-token');
      expect(s.isNew, isTrue);
      expect(s.user.displayName, 'Priya');
    });

    test('accepts the alternative token keys instead of throwing', () {
      final s = AuthSession.fromJson({
        'token': 'a-token',
        'user': {'id': 'u1', 'role': 'CUSTOMER'},
      });
      expect(s.accessToken, 'a-token');
      expect(s.refreshToken, '');
    });

    test('a response with no token fails with a message that names the keys', () {
      expect(
        () => AuthSession.fromJson({'ok': true, 'user': {'id': 'u1', 'role': 'CUSTOMER'}}),
        throwsA(isA<StateError>().having((e) => e.message, 'message', contains('ok'))),
      );
    });

    test('a missing user block does not crash the sign-in', () {
      final s = AuthSession.fromJson({'accessToken': 'a-token'});
      expect(s.user.displayName, 'Guest');
    });
  });
}
