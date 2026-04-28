import 'package:flutter_test/flutter_test.dart';

import 'package:fleet_driver/main.dart';

void main() {
  testWidgets('FleetApp renders splash loader', (WidgetTester tester) async {
    await tester.pumpWidget(const FleetApp());

    expect(find.byType(SplashGate), findsOneWidget);
  });
}
