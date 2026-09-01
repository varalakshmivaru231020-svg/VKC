import 'package:flutter_test/flutter_test.dart';
import 'package:vkc_customer/ecom/ecom_models.dart';

/// Payment methods come from the website's own GET /api/payment-config, which
/// reads the very rows Admin → Settings → Payments writes. The app must mirror
/// that response exactly — never assume a method is on.
void main() {
  group('PaymentMethods.fromJson', () {
    test('reads the live shape the website endpoint returns', () {
      final m = PaymentMethods.fromJson({
        'razorpay': true,
        'cashfree': false,
        'icici': false,
        'iciciPg': false,
        'cod': true,
      });
      expect(m.razorpay, isTrue);
      expect(m.cod, isTrue);
      expect(m.cashfree, isFalse);
      expect(m.icici, isFalse);
      expect(m.iciciPg, isFalse);
    });

    test('a method the admin switched off is off', () {
      final m = PaymentMethods.fromJson({'razorpay': false, 'cod': false});
      expect(m.razorpay, isFalse);
      expect(m.cod, isFalse);
      expect(m.hasAny, isFalse);
    });

    test('nothing is defaulted on when a key is absent', () {
      final m = PaymentMethods.fromJson({});
      expect(m.razorpay, isFalse);
      expect(m.cod, isFalse);
      expect(m.hasAny, isFalse);
    });

    test('only true enables — the endpoint sends real booleans', () {
      // Guards against a stringified "false" ever reading as enabled.
      final m = PaymentMethods.fromJson({'cod': 'false', 'razorpay': 'true'});
      expect(m.cod, isFalse);
      expect(m.razorpay, isFalse);
    });

    test('hasAny covers only what this app can carry to a paid order', () {
      // Cashfree needs its Flutter SDK and ICICI PG has no /v1 handler, so
      // neither can complete here — offering them would strand the customer.
      expect(PaymentMethods.fromJson({'cashfree': true}).hasAny, isFalse);
      expect(PaymentMethods.fromJson({'iciciPg': true}).hasAny, isFalse);
      expect(PaymentMethods.fromJson({'cod': true}).hasAny, isTrue);
      expect(PaymentMethods.fromJson({'razorpay': true}).hasAny, isTrue);
      expect(PaymentMethods.fromJson({'icici': true}).hasAny, isTrue);
    });
  });
}
