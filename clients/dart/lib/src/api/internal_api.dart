//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'dart:async';

import 'package:built_value/json_object.dart';
import 'package:built_value/serializer.dart';
import 'package:dio/dio.dart';

import 'package:wavelet_api/src/model/error_response.dart';
import 'package:wavelet_api/src/model/gc_envelope.dart';

class InternalApi {

  final Dio _dio;

  final Serializers _serializers;

  const InternalApi(this._dio, this._serializers);

  /// Daily storage garbage collection (Vercel Cron — not for app clients)
  /// Run by the daily cron in &#x60;vercel.json&#x60;. Requires &#x60;Authorization: Bearer &lt;CRON_SECRET&gt;&#x60; (Vercel sends it to cron invocations when &#x60;CRON_SECRET&#x60; is set) → 401 &#x60;UNAUTHORIZED&#x60; otherwise. While &#x60;CRON_SECRET&#x60; is unset it is a no-op answering 200 &#x60;{ ran: false, reason }&#x60;, whatever the Authorization header. Deletes StoredTrack rows older than 24 h that nothing references and no persist is writing (with their object unless another row uses it), then objects under &#x60;tracks/&#x60; older than 24 h that no row points at. Bounded per run.
  ///
  /// Parameters:
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [GcEnvelope] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<GcEnvelope>> runStorageGc({ 
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/api/v1/internal/gc';
    final _options = Options(
      method: r'GET',
      headers: <String, dynamic>{
        ...?headers,
      },
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[
          {
            'type': 'http',
            'scheme': 'bearer',
            'name': 'cronSecret',
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

    GcEnvelope? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null ? null : _serializers.deserialize(
        rawResponse,
        specifiedType: const FullType(GcEnvelope),
      ) as GcEnvelope;

    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<GcEnvelope>(
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
