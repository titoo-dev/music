//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'dart:async';

import 'package:built_value/json_object.dart';
import 'package:built_value/serializer.dart';
import 'package:dio/dio.dart';

import 'package:wavelet_api/src/api_util.dart';
import 'package:wavelet_api/src/model/error_response.dart';
import 'package:wavelet_api/src/model/lyrics_envelope.dart';

class LyricsApi {

  final Dio _dio;

  final Serializers _serializers;

  const LyricsApi(this._dio, this._serializers);

  /// Lyrics (LRCLIB exact → Deezer → LRCLIB fuzzy search)
  /// Send title/artist/album/duration of the playing track for the best match; otherwise they come from the library, recent plays or the Deezer track API. Synced lyrics are only returned when the matched recording&#39;s length is within 3 s. No lyrics → 200 with &#x60;source: null&#x60;. 400 MISSING_METADATA only when there is no metadata and no Deezer session.
  ///
  /// Parameters:
  /// * [trackId] - Deezer track id
  /// * [title] - Track title
  /// * [artist] - Artist name
  /// * [album] - Album title
  /// * [duration] - Duration in seconds (aligns synced lyrics; strongly recommended)
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [LyricsEnvelope] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<LyricsEnvelope>> getLyrics({ 
    required String trackId,
    String? title,
    String? artist,
    String? album,
    int? duration,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/lyrics/{trackId}'.replaceAll('{' r'trackId' '}', encodeQueryParameter(_serializers, trackId, const FullType(String)).toString());
    final _options = Options(
      method: r'GET',
      headers: <String, dynamic>{
        ...?headers,
      },
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[
          {
            'type': 'apiKey',
            'name': 'sessionCookie',
            'keyName': '__Secure-better-auth.session_token',
            'where': '',
          },{
            'type': 'http',
            'scheme': 'bearer',
            'name': 'bearerAuth',
          },
        ],
        ...?extra,
      },
      validateStatus: validateStatus,
    );

    final _queryParameters = <String, dynamic>{
      if (title != null) r'title': encodeQueryParameter(_serializers, title, const FullType(String)),
      if (artist != null) r'artist': encodeQueryParameter(_serializers, artist, const FullType(String)),
      if (album != null) r'album': encodeQueryParameter(_serializers, album, const FullType(String)),
      if (duration != null) r'duration': encodeQueryParameter(_serializers, duration, const FullType(int)),
    };

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      queryParameters: _queryParameters,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    LyricsEnvelope? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : _serializers.deserialize(
        rawResponse,
        specifiedType: const FullType(LyricsEnvelope),
      ) as LyricsEnvelope;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<LyricsEnvelope>(
      data: _responseData,
      headers: _response.headers,
      isRedirect: _response.isRedirect,
      requestOptions: _response.requestOptions,
      redirects: _response.redirects,
      statusCode: _response.statusCode,
      statusMessage: _response.statusMessage,
      extra: _response.extra,
    );
  }

}
