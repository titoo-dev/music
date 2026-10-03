import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for SearchApi
void main() {
  final instance = WaveletApi().getSearchApi();

  group(SearchApi, () {
    // Typed search (Deezer public API)
    //
    //Future<DeezerApiListEnvelope> search(String term, { String type, int start, int nb }) async
    test('test search', () async {
      // TODO
    });

    // Album search
    //
    //Future<DeezerApiListEnvelope> searchAlbum(String term, { int start, int nb }) async
    test('test searchAlbum', () async {
      // TODO
    });

    // Global search (all buckets, GW + API merged)
    //
    //Future<DeezerSearchMainEnvelope> searchMain(String term) async
    test('test searchMain', () async {
      // TODO
    });

    // Autocomplete suggestions (normalized)
    //
    //Future<SuggestionsEnvelope> searchSuggest(String term, { int limit }) async
    test('test searchSuggest', () async {
      // TODO
    });

  });
}
