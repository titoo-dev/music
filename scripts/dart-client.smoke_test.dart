import 'package:dio/dio.dart';
import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';

void main() {
  final serializers = standardSerializers;

  test('deserializes a library tracks envelope', () {
    final env = serializers.deserializeWith(SavedTrackListEnvelope.serializer, {
      'success': true,
      'data': {
        'items': [
          {
            'id': 'c1', 'userId': 'u1', 'trackId': '3135556', 'title': 'Harder',
            'artist': 'Daft Punk', 'album': null, 'albumId': null, 'coverUrl': null,
            'duration': 224, 'savedAt': '2026-10-02T10:00:00.000Z',
          }
        ]
      }
    })!;
    expect(env.data.items.first.title, 'Harder');
    expect(env.data.items.first.savedAt.year, 2026);
  });

  test('deserializes a guest connect status with null users', () {
    final env = serializers.deserializeWith(ConnectStatusEnvelope.serializer, {
      'success': true,
      'data': {
        'authenticated': false, 'user': null, 'deezerLoggedIn': false,
        'deezerUser': null, 'deezerAvailable': 'yes', 'settings': {},
      }
    })!;
    expect(env.data.authenticated, isFalse);
    expect(env.data.user, isNull);
  });

  test('deserializes the error envelope', () {
    final err = serializers.deserializeWith(ErrorResponse.serializer, {
      'success': false,
      'error': {'code': 'NOT_AUTHENTICATED', 'message': 'Please sign in to continue.'},
    })!;
    expect(err.error.code, 'NOT_AUTHENTICATED');
  });

  test('sends the bearer token', () async {
    final api = WaveletApi(basePathOverride: 'http://localhost:1');
    api.setBearerAuth('bearerAuth', 'tok123');
    String? sent;
    api.dio.interceptors.add(InterceptorsWrapper(onRequest: (o, h) {
      sent = o.headers['Authorization'] as String?;
      h.reject(DioException(requestOptions: o));
    }));
    await expectLater(api.getLibraryApi().listSavedTracks(), throwsA(isA<DioException>()));
    expect(sent, 'Bearer tok123');
  });
}
