import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';

// tests for GcResult
void main() {
  final instance = GcResultBuilder();
  // TODO add properties to the builder and call build()

  group(GcResult, () {
    // false while `CRON_SECRET` is unset (no work done)
    // bool ran
    test('to test the property `ran`', () async {
      // TODO
    });

    // Only when `ran` is false
    // String reason
    test('to test the property `reason`', () async {
      // TODO
    });

    // Unreferenced StoredTrack rows deleted (only when `ran` is true)
    // int rowsDeleted
    test('to test the property `rowsDeleted`', () async {
      // TODO
    });

    // R2 objects of those rows deleted (only when `ran` is true)
    // int objectsDeleted
    test('to test the property `objectsDeleted`', () async {
      // TODO
    });

    // Objects listed under `tracks/` (only when `ran` is true)
    // int objectsScanned
    test('to test the property `objectsScanned`', () async {
      // TODO
    });

    // Objects under `tracks/` without any row deleted (only when `ran` is true)
    // int orphanObjectsDeleted
    test('to test the property `orphanObjectsDeleted`', () async {
      // TODO
    });

    // Share links expired for more than 30 days deleted (only when `ran` is true)
    // int expiredSharesDeleted
    test('to test the property `expiredSharesDeleted`', () async {
      // TODO
    });

  });
}
