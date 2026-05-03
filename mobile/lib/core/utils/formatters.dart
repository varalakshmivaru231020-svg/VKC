import "package:intl/intl.dart";

final _inrFormatter = NumberFormat.currency(locale: "en_IN", symbol: "₹", decimalDigits: 0);

String formatINR(num value) => _inrFormatter.format(value);

int discountPercent(num original, num sale) {
  if (original <= 0 || sale >= original) return 0;
  return (((original - sale) / original) * 100).round();
}
