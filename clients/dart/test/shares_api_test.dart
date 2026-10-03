import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for SharesApi
void main() {
  final instance = WaveletApi().getSharesApi();

  group(SharesApi, () {
    // Create (or reuse) a public share link for a track
    //
    // Returns 200 with the existing share if one already exists for this track, 201 otherwise. Public page: `https://wavelet.titosy.dev/share/t/{shareId}`.
    //
    //Future<SharedTrackEnvelope> createShare(CreateShareInput createShareInput) async
    test('test createShare', () async {
      // TODO
    });

    // Revoke a share link (owner only)
    //
    //Future<DeletedEnvelope> deleteShare(String shareId) async
    test('test deleteShare', () async {
      // TODO
    });

    // Public share metadata (no auth)
    //
    //Future<PublicShareEnvelope> getShare(String shareId) async
    test('test getShare', () async {
      // TODO
    });

    // My share links
    //
    //Future<SharedTrackListEnvelope> listShares() async
    test('test listShares', () async {
      // TODO
    });

    // Public audio stream of a shared track (no auth)
    //
    // Range supported when served from cache (206); live fallback has `Accept-Ranges: none`. Each call increments the play counter.
    //
    //Future<Uint8List> streamShare(String shareId, { String range }) async
    test('test streamShare', () async {
      // TODO
    });

  });
}
