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

Recommended playback flow: 1. `GET /stream-url/{id}` → if `url` is set, play it directly (CDN, Range-capable, valid 1 h — refresh before `expiresAt`). 2. Otherwise play `GET /stream-progressive/{id}` (live from Deezer, persisted to R2 in the background); with `status: presigned_disabled`, play `/stream/{id}`. `/stream/{id}` is the same-origin proxy for cached files. The copy is chosen by the shared rank rules for this user's licence: a copy below the quality this user may get counts as `not_cached`, so the progressive play upgrades it.

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
> Uint8List streamCached(trackId, prefetch, range)

Stream a cached track (Range supported)

Same-origin proxy for the cached copy chosen by the shared rank rules for this user's licence; the Range header is passed through to R2 (206 + `Content-Range`). - No usable copy, or the object is gone from R2 (its rows are dropped) → 302 to `/api/v1/stream-progressive/{trackId}`. - A copy exists but below the quality this user may get (upgrade), the only copies are above this instance's quality setting, or storage is unreachable / refusing reads → 302 to `/api/v1/stream-progressive/{trackId}?live=1`. - `prefetch=1`: every non-hit (miss, upgrade, copies only in older storage, missing object, storage unavailable) → 404 `NOT_CACHED`, never a redirect to a live Deezer stream. The audio player must follow redirects and keep sending the session (cookie or bearer). A Range past the end of the cached file is not answered with 416: R2's refusal surfaces as a 500.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getStreamingApi();
final String trackId = trackId_example; // String | Deezer track id
final String prefetch = prefetch_example; // String | Only serve bytes that are already cached: every non-hit is a 404 NOT_CACHED instead of a 302
final String range = bytes=0-; // String | 

try {
    final response = api.streamCached(trackId, prefetch, range);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StreamingApi->streamCached: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **trackId** | **String**| Deezer track id | 
 **prefetch** | **String**| Only serve bytes that are already cached: every non-hit is a 404 NOT_CACHED instead of a 302 | [optional] 
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
> Uint8List streamProgressive(trackId, probe, preview, head, live, range)

Live stream from Deezer (decrypted on the fly, persisted in background)

- **Already cached** (a usable copy for this listener's quality, object checked with a HEAD) → 302 to `/api/v1/stream/{trackId}`. Skipped with `live=1`. - **No Range, `bytes=0-` or `bytes=0-b`** (Safari / AVPlayer): a normal, persisting play. 200 with `Content-Length` when the decoded size is known, `Accept-Ranges: bytes` when the Deezer CDN honours ranges (else `none`); with a `bytes=0-…` Range and ranges honoured, 206 with `Content-Range: bytes 0-b/n` (body capped to that window, the persist continues). - **A single range starting above 0** (`bytes=a-` / `bytes=a-b`): 206 live-only (never persisted, no lock) with `Content-Range`, `Content-Length`, `Accept-Ranges: bytes`. Past the end → 416 with `Content-Range: bytes *_/n`. A CDN that refuses ranges → normal 200 play of the whole track. Multi-range, suffix (`bytes=-n`) and malformed headers are ignored (normal play). - A play never waits for another persist of the same track: on the same instance it streams the in-progress copy; while another instance persists it, it streams live, unpersisted. - `probe=1`: JSON `{ ok: true, cached }` when the track is streamable for this user; never opens the audio, never persists, takes no lock. Failures → 422 `TRACK_UNAVAILABLE` / 502 `UPSTREAM_ERROR` (plus the usual 401 / 403). - `preview=1`: live, never persisted, no lock; no `Content-Length`, `Accept-Ranges: none`, Range ignored. `head=1` caps it at ~3 s of audio at the server's `maxBitrate` (64 KiB floor, 512 KiB ceiling: 64 KiB MP3 128, 120 000 B MP3 320, 360 000 B FLAC). Errors before the first audio byte: 422 `TRACK_UNAVAILABLE` or 502 `UPSTREAM_ERROR`; anything else is a 500.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getStreamingApi();
final String trackId = trackId_example; // String | Deezer track id
final String probe = probe_example; // String | Check only: JSON `{ ok, cached }`, no audio, no persistence, no lock
final String preview = preview_example; // String | Prefetch mode: live, no persistence, no download lock, Range ignored
final String head = head_example; // String | With preview=1: cap the response at ~3 s of audio at the server quality (64 KiB – 512 KiB)
final String live = live_example; // String | Skip the cache check and stream from Deezer; the play still persists (sent by /stream when storage refuses reads, when the cached copy needs an upgrade, or when the only copies are above this instance's quality)
final String range = bytes=0-; // String | 

try {
    final response = api.streamProgressive(trackId, probe, preview, head, live, range);
    print(response);
} on DioException catch (e) {
    print('Exception when calling StreamingApi->streamProgressive: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **trackId** | **String**| Deezer track id | 
 **probe** | **String**| Check only: JSON `{ ok, cached }`, no audio, no persistence, no lock | [optional] 
 **preview** | **String**| Prefetch mode: live, no persistence, no download lock, Range ignored | [optional] 
 **head** | **String**| With preview=1: cap the response at ~3 s of audio at the server quality (64 KiB – 512 KiB) | [optional] 
 **live** | **String**| Skip the cache check and stream from Deezer; the play still persists (sent by /stream when storage refuses reads, when the cached copy needs an upgrade, or when the only copies are above this instance's quality) | [optional] 
 **range** | **String**|  | [optional] 

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

- **Cached copy** (the best R2 copy of the track, found by trackId — a copy persisted after the share was created is used and re-linked): proxied from R2, Range passed through (206 + `Content-Range`), `Accept-Ranges: bytes`, `Cache-Control: private, no-cache` (a revoked or expired link stops playing at once). - **Fallback** (no cached copy, or the R2 read failed): streamed live through the share owner's Deezer account with the same Range rules as `/stream-progressive` — no Range, `bytes=0-` or `bytes=0-b` → persisting play (200, or 206 `Content-Range: bytes 0-b/n` when the Deezer CDN honours ranges; `Accept-Ranges: none` when it does not); a single range starting above 0 → 206 live-only; past the end → 416 `Content-Range: bytes *_/n`. Limited to 30 fallback requests per client address per 10 min (per server instance): over it → 429 `RATE_LIMITED` + `Retry-After`. Errors before the first byte: 422 `TRACK_UNAVAILABLE` / 502 `UPSTREAM_ERROR`. - **Play counter**: +1 per successful (status < 400) request with no Range, `bytes=0-` or `bytes=0-n` with n > 1 (Safari / AVPlayer after their `bytes=0-1` probe) — not per seek, nor for a refused or failed request.

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

