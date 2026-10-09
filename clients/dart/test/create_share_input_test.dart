import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';

// tests for CreateShareInput
void main() {
  final instance = CreateShareInputBuilder();
  // TODO add properties to the builder and call build()

  group(CreateShareInput, () {
    // String trackId
    test('to test the property `trackId`', () async {
      // TODO
    });

    // String title
    test('to test the property `title`', () async {
      // TODO
    });

    // String artist
    test('to test the property `artist`', () async {
      // TODO
    });

    // String album
    test('to test the property `album`', () async {
      // TODO
    });

    // https Deezer artwork (*.dzcdn.net, api.deezer.com); any other URL is dropped
    // String coverUrl
    test('to test the property `coverUrl`', () async {
      // TODO
    });

    // int duration
    test('to test the property `duration`', () async {
      // TODO
    });

    // Hours until expiry, more than 0 and at most 8760 (a year). Null or omitted for a permanent link.
    // num expiresIn
    test('to test the property `expiresIn`', () async {
      // TODO
    });

  });
}
