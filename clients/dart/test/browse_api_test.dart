import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for BrowseApi
void main() {
  final instance = WaveletApi().getBrowseApi();

  group(BrowseApi, () {
    // Deezer explore page (home feed)
    //
    //Future<DeezerPageEnvelope> getHome() async
    test('test getHome', () async {
      // TODO
    });

    // Editorial new releases (100 max)
    //
    //Future<DeezerApiListEnvelope> getNewReleases() async
    test('test getNewReleases', () async {
      // TODO
    });

    // Album / playlist / artist page with tracks
    //
    //Future<DeezerTracklistEnvelope> getTracklist(String id, String type) async
    test('test getTracklist', () async {
      // TODO
    });

  });
}
