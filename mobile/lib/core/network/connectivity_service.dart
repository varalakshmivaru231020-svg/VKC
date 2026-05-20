import "dart:async";
import "package:connectivity_plus/connectivity_plus.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

enum NetStatus { online, offline }

class ConnectivityService {
  ConnectivityService(this._conn);
  final Connectivity _conn;

  Stream<NetStatus> watch() {
    return _conn.onConnectivityChanged.map(_resultsToStatus);
  }

  Future<NetStatus> currentStatus() async {
    final r = await _conn.checkConnectivity();
    return _resultsToStatus(r);
  }

  static NetStatus _resultsToStatus(List<ConnectivityResult> r) {
    final hasNet = r.any((c) =>
        c == ConnectivityResult.wifi ||
        c == ConnectivityResult.mobile ||
        c == ConnectivityResult.ethernet ||
        c == ConnectivityResult.vpn);
    return hasNet ? NetStatus.online : NetStatus.offline;
  }
}

final connectivityServiceProvider = Provider<ConnectivityService>(
  (ref) => ConnectivityService(Connectivity()),
);

/// Live network status stream — UI overlay can listen to this.
final connectivityStatusProvider = StreamProvider<NetStatus>((ref) {
  return ref.watch(connectivityServiceProvider).watch();
});
