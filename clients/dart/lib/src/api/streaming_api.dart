//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'dart:async';

import 'package:built_value/json_object.dart';
import 'package:built_value/serializer.dart';
import 'package:dio/dio.dart';

import 'dart:typed_data';
import 'package:wavelet_api/src/api_util.dart';
import 'package:wavelet_api/src/model/error_response.dart';
import 'package:wavelet_api/src/model/stream_probe_envelope.dart';
import 'package:wavelet_api/src/model/stream_url_envelope.dart';

class StreamingApi {

  final Dio _dio;

  final Serializers _serializers;

  const StreamingApi(this._dio, this._serializers);

  /// Step 1 — presigned direct URL if the track is cached
  /// Recommended playback flow: 1. &#x60;GET /stream-url/{id}&#x60; → if &#x60;url&#x60; is set, play it directly (CDN, Range-capable, valid 1 h — refresh before &#x60;expiresAt&#x60;). 2. Otherwise play &#x60;GET /stream-progressive/{id}&#x60; (live from Deezer, persisted to R2 in the background); with &#x60;status: presigned_disabled&#x60;, play &#x60;/stream/{id}&#x60;. &#x60;/stream/{id}&#x60; is the same-origin proxy for cached files. The copy is chosen by the shared rank rules for this user&#39;s licence: a copy below the quality this user may get counts as &#x60;not_cached&#x60;, so the progressive play upgrades it.
  ///
  /// Parameters:
  /// * [trackId] - Deezer track id
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [StreamUrlEnvelope] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<StreamUrlEnvelope>> getStreamUrl({ 
    required String trackId,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/stream-url/{trackId}'.replaceAll('{' r'trackId' '}', encodeQueryParameter(_serializers, trackId, const FullType(String)).toString());
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

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    StreamUrlEnvelope? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : _serializers.deserialize(
        rawResponse,
        specifiedType: const FullType(StreamUrlEnvelope),
      ) as StreamUrlEnvelope;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<StreamUrlEnvelope>(
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

  /// Stream a cached track (Range supported)
  /// Same-origin proxy for the cached copy chosen by the shared rank rules for this user&#39;s licence; the Range header is passed through to R2 (206 + &#x60;Content-Range&#x60;). - No usable copy, or the object is gone from R2 (its rows are dropped) → 302 to &#x60;/api/v1/stream-progressive/{trackId}&#x60;. - A copy exists but below the quality this user may get (upgrade), the only copies are above this instance&#39;s quality setting, or storage is unreachable / refusing reads → 302 to &#x60;/api/v1/stream-progressive/{trackId}?live&#x3D;1&#x60;. - &#x60;prefetch&#x3D;1&#x60;: every non-hit (miss, upgrade, copies only in older storage, missing object, storage unavailable) → 404 &#x60;NOT_CACHED&#x60;, never a redirect to a live Deezer stream. The audio player must follow redirects and keep sending the session (cookie or bearer). A Range past the end of the cached file is not answered with 416: R2&#39;s refusal surfaces as a 500.
  ///
  /// Parameters:
  /// * [trackId] - Deezer track id
  /// * [prefetch] - Only serve bytes that are already cached: every non-hit is a 404 NOT_CACHED instead of a 302
  /// * [range] 
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [Uint8List] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<Uint8List>> streamCached({ 
    required String trackId,
    String? prefetch,
    String? range,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/stream/{trackId}'.replaceAll('{' r'trackId' '}', encodeQueryParameter(_serializers, trackId, const FullType(String)).toString());
    final _options = Options(
      method: r'GET',
      responseType: ResponseType.bytes,
      headers: <String, dynamic>{
        if (range != null) r'Range': range,
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
      if (prefetch != null) r'prefetch': encodeQueryParameter(_serializers, prefetch, const FullType(String)),
    };

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      queryParameters: _queryParameters,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    Uint8List? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : rawResponse as Uint8List;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<Uint8List>(
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

  /// Live stream from Deezer (decrypted on the fly, persisted in background)
  /// - **Already cached** (a usable copy for this listener&#39;s quality, object checked with a HEAD) → 302 to &#x60;/api/v1/stream/{trackId}&#x60;. Skipped with &#x60;live&#x3D;1&#x60;. - **No Range, &#x60;bytes&#x3D;0-&#x60; or &#x60;bytes&#x3D;0-b&#x60;** (Safari / AVPlayer): a normal, persisting play. 200 with &#x60;Content-Length&#x60; when the decoded size is known, &#x60;Accept-Ranges: bytes&#x60; when the Deezer CDN honours ranges (else &#x60;none&#x60;); with a &#x60;bytes&#x3D;0-…&#x60; Range and ranges honoured, 206 with &#x60;Content-Range: bytes 0-b/n&#x60; (body capped to that window, the persist continues). - **A single range starting above 0** (&#x60;bytes&#x3D;a-&#x60; / &#x60;bytes&#x3D;a-b&#x60;): 206 live-only (never persisted, no lock) with &#x60;Content-Range&#x60;, &#x60;Content-Length&#x60;, &#x60;Accept-Ranges: bytes&#x60;. Past the end → 416 with &#x60;Content-Range: bytes *_/n&#x60;. A CDN that refuses ranges → normal 200 play of the whole track. Multi-range, suffix (&#x60;bytes&#x3D;-n&#x60;) and malformed headers are ignored (normal play). - A play never waits for another persist of the same track: on the same instance it streams the in-progress copy; while another instance persists it, it streams live, unpersisted. - &#x60;probe&#x3D;1&#x60;: JSON &#x60;{ ok: true, cached }&#x60; when the track is streamable for this user; never opens the audio, never persists, takes no lock. Failures → 422 &#x60;TRACK_UNAVAILABLE&#x60; / 502 &#x60;UPSTREAM_ERROR&#x60; (plus the usual 401 / 403). - &#x60;preview&#x3D;1&#x60;: live, never persisted, no lock; no &#x60;Content-Length&#x60;, &#x60;Accept-Ranges: none&#x60;, Range ignored. &#x60;head&#x3D;1&#x60; caps it at ~3 s of audio at the server&#39;s &#x60;maxBitrate&#x60; (64 KiB floor, 512 KiB ceiling: 64 KiB MP3 128, 120 000 B MP3 320, 360 000 B FLAC). Errors before the first audio byte: 422 &#x60;TRACK_UNAVAILABLE&#x60; or 502 &#x60;UPSTREAM_ERROR&#x60;; anything else is a 500.
  ///
  /// Parameters:
  /// * [trackId] - Deezer track id
  /// * [probe] - Check only: JSON `{ ok, cached }`, no audio, no persistence, no lock
  /// * [preview] - Prefetch mode: live, no persistence, no download lock, Range ignored
  /// * [head] - With preview=1: cap the response at ~3 s of audio at the server quality (64 KiB – 512 KiB)
  /// * [live] - Skip the cache check and stream from Deezer; the play still persists (sent by /stream when storage refuses reads, when the cached copy needs an upgrade, or when the only copies are above this instance's quality)
  /// * [range] 
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [Uint8List] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<Uint8List>> streamProgressive({ 
    required String trackId,
    String? probe,
    String? preview,
    String? head,
    String? live,
    String? range,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/stream-progressive/{trackId}'.replaceAll('{' r'trackId' '}', encodeQueryParameter(_serializers, trackId, const FullType(String)).toString());
    final _options = Options(
      method: r'GET',
      responseType: ResponseType.bytes,
      headers: <String, dynamic>{
        if (range != null) r'Range': range,
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
      if (probe != null) r'probe': encodeQueryParameter(_serializers, probe, const FullType(String)),
      if (preview != null) r'preview': encodeQueryParameter(_serializers, preview, const FullType(String)),
      if (head != null) r'head': encodeQueryParameter(_serializers, head, const FullType(String)),
      if (live != null) r'live': encodeQueryParameter(_serializers, live, const FullType(String)),
    };

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      queryParameters: _queryParameters,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    Uint8List? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : rawResponse as Uint8List;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<Uint8List>(
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

  /// Public audio stream of a shared track (no auth)
  /// - **Cached copy** (the best R2 copy of the track, found by trackId — a copy persisted after the share was created is used and re-linked): proxied from R2, Range passed through (206 + &#x60;Content-Range&#x60;), &#x60;Accept-Ranges: bytes&#x60;, &#x60;Cache-Control: public, max-age&#x3D;3600&#x60;. - **Fallback** (no cached copy, or the R2 read failed): streamed live through the share owner&#39;s Deezer account with the same Range rules as &#x60;/stream-progressive&#x60; — no Range, &#x60;bytes&#x3D;0-&#x60; or &#x60;bytes&#x3D;0-b&#x60; → persisting play (200, or 206 &#x60;Content-Range: bytes 0-b/n&#x60; when the Deezer CDN honours ranges; &#x60;Accept-Ranges: none&#x60; when it does not); a single range starting above 0 → 206 live-only; past the end → 416 &#x60;Content-Range: bytes *_/n&#x60;. Limited to 30 fallback requests per client address per 10 min (per server instance): over it → 429 &#x60;RATE_LIMITED&#x60; + &#x60;Retry-After&#x60;. Errors before the first byte: 422 &#x60;TRACK_UNAVAILABLE&#x60; / 502 &#x60;UPSTREAM_ERROR&#x60;. - **Play counter**: +1 per successful (status &lt; 400) request with no Range, &#x60;bytes&#x3D;0-&#x60; or &#x60;bytes&#x3D;0-n&#x60; with n &gt; 1 (Safari / AVPlayer after their &#x60;bytes&#x3D;0-1&#x60; probe) — not per seek, nor for a refused or failed request.
  ///
  /// Parameters:
  /// * [shareId] - Public share id
  /// * [range] 
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [Uint8List] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<Uint8List>> streamShare({ 
    required String shareId,
    String? range,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/shares/{shareId}/stream'.replaceAll('{' r'shareId' '}', encodeQueryParameter(_serializers, shareId, const FullType(String)).toString());
    final _options = Options(
      method: r'GET',
      responseType: ResponseType.bytes,
      headers: <String, dynamic>{
        if (range != null) r'Range': range,
        ...?headers,
      },
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[],
        ...?extra,
      },
      validateStatus: validateStatus,
    );

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    Uint8List? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : rawResponse as Uint8List;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<Uint8List>(
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

  /// Prefetch Deezer metadata so the next play starts faster
  /// Fire-and-forget, always 204 on success. Call when a track is about to be played (e.g. next in queue).
  ///
  /// Parameters:
  /// * [trackId] - Deezer track id
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future]
  /// Throws [DioException] if API call or serialization fails
  Future<Response<void>> warmStream({ 
    required String trackId,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/stream-warm/{trackId}'.replaceAll('{' r'trackId' '}', encodeQueryParameter(_serializers, trackId, const FullType(String)).toString());
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

    final _response = await _dio.request<Object>(
      _path,
      options: _options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    return _response;
  }

}
