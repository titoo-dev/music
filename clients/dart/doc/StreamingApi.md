# wavelet_api.api.StreamingApi

## Load the API package
```dart
import 'package:wavelet_api/api.dart';
```

All URIs are relative to *https://wavelet.titosy.dev*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getStreamUrl**](StreamingApi.md#getstreamurl) | **GET** /api/v1/stream-url/{trackId} | Step 1 — presigned direct URL if the track is cached
[**streamCached**](StreamingApi.md#streamcached) | **GET** /api/v1/stream/{trackId} | Stream a cached track (Range supported)
[**streamProgressive**](StreamingApi.md#streamprogressive) | **GET** /api/v1/stream-progressive/{trackId} | Live stream from Deezer (decrypted on the fly, persisted in background)
[**streamShare**](StreamingApi.md#streamshare) | **GET** /api/v1/shares/{shareId}/stream | Public audio stream of a shared track (no auth)
[**warmStream**](StreamingApi.md#warmstream) | **GET** /api/v1/stream-warm/{trackId} | Prefetch Deezer metadata so the next play starts faster


# **getStreamUrl**
> StreamUrlEnvelope getStreamUrl(trackId)

Step 1 — presigned direct URL if the track is cached

Recommended playback flow: 1. `GET /stream-url/{id}` → if `url` is set, play it directly (CDN, Range-capable, ~15 min validity). 2. Otherwise play `GET /stream-progressive/{id}` (live from Deezer, persisted to Blob in the background). `/stream/{id}` is the same-origin proxy for cached files.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getStreamingApi();
final String trackId = trackId_example; // String | Deezer track id

try {
    final response = api.getStreamUrl(trackId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StreamingApi->getStreamUrl: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **trackId** | **String**| Deezer track id | 

### Return type

[**StreamUrlEnvelope**](StreamUrlEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **streamCached**
> Uint8List streamCached(trackId, range)

Stream a cached track (Range supported)

Cache miss / storage down → 302 to `/api/v1/stream-progressive/{trackId}`. The audio player must follow redirects and keep sending the session cookie.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getStreamingApi();
final String trackId = trackId_example; // String | Deezer track id
final String range = bytes=0-; // String | 

try {
    final response = api.streamCached(trackId, range);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StreamingApi->streamCached: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **trackId** | **String**| Deezer track id | 
 **range** | **String**|  | [optional] 

### Return type

[**Uint8List**](Uint8List.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: audio/mpeg, audio/flac, application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **streamProgressive**
> Uint8List streamProgressive(trackId, preview, head)

Live stream from Deezer (decrypted on the fly, persisted in background)

No Range support (`Accept-Ranges: none`) — seeking beyond the buffer requires restarting the stream. Already cached → 302 to `/api/v1/stream/{trackId}`.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getStreamingApi();
final String trackId = trackId_example; // String | Deezer track id
final String preview = preview_example; // String | Prefetch mode: no persistence, no download lock
final String head = head_example; // String | With preview=1: cap response at ~64 KB

try {
    final response = api.streamProgressive(trackId, preview, head);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StreamingApi->streamProgressive: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **trackId** | **String**| Deezer track id | 
 **preview** | **String**| Prefetch mode: no persistence, no download lock | [optional] 
 **head** | **String**| With preview=1: cap response at ~64 KB | [optional] 

### Return type

[**Uint8List**](Uint8List.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: audio/mpeg, audio/flac, application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **streamShare**
> Uint8List streamShare(shareId, range)

Public audio stream of a shared track (no auth)

Range supported when served from cache (206); live fallback has `Accept-Ranges: none`. Each call increments the play counter.

### Example
```dart
import 'package:wavelet_api/api.dart';

final api = WaveletApi().getStreamingApi();
final String shareId = shareId_example; // String | Public share id
final String range = bytes=0-; // String | 

try {
    final response = api.streamShare(shareId, range);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StreamingApi->streamShare: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **shareId** | **String**| Public share id | 
 **range** | **String**|  | [optional] 

### Return type

[**Uint8List**](Uint8List.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: audio/mpeg, audio/flac, application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **warmStream**
> warmStream(trackId)

Prefetch Deezer metadata so the next play starts faster

Fire-and-forget, always 204 on success. Call when a track is about to be played (e.g. next in queue).

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getStreamingApi();
final String trackId = trackId_example; // String | Deezer track id

try {
    api.warmStream(trackId);
} on DioException catch (e) {
    print('Exception when calling StreamingApi->warmStream: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **trackId** | **String**| Deezer track id | 

### Return type

void (empty response body)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

