import 'package:flutter_test/flutter_test.dart';
import 'package:vkc_customer/main.dart';

void main() {
  testWidgets('App boots', (tester) async {
    await tester.pumpWidget(const VkcApp());
    expect(find.byType(VkcApp), findsOneWidget);
  });
}
