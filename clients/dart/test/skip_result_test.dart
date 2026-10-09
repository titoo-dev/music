import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';

// tests for SkipResult
void main() {
  final instance = SkipResultBuilder();
  // TODO add properties to the builder and call build()

  group(SkipResult, () {
    // bool kept
    test('to test the property `kept`', () async {
      // TODO
    });

    // Why the file was kept: `already_played` (this user logged a real play), `anchored` (saved, in a saved album, shared or recent-played by anyone), `persisting` (a persist of the track is in flight), `recent` (its cached copy is younger than 10 min — another listener may be playing it).
    // String reason
    test('to test the property `reason`', () async {
      // TODO
    });

    // bool evicted
    test('to test the property `evicted`', () async {
      // TODO
    });

  });
}
