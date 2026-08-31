import 'package:flutter_test/flutter_test.dart';
import 'package:vl_customer/main.dart';

void main() {
  testWidgets('App boots', (tester) async {
    await tester.pumpWidget(const VlApp());
    expect(find.byType(VlApp), findsOneWidget);
  });
}
