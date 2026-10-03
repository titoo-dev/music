# wavelet_api.api.LyricsApi

## Load the API package
```dart
import 'package:wavelet_api/api.dart';
```

All URIs are relative to *https://wavelet.titosy.dev*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getLyrics**](LyricsApi.md#getlyrics) | **GET** /api/v1/lyrics/{trackId} | Lyrics (LRCLIB first, Deezer fallback)


# **getLyrics**
> LyricsEnvelope getLyrics(trackId, title, artist, album, duration)

Lyrics (LRCLIB first, Deezer fallback)

Pass title/artist when the track is not in the library nor recent plays. No lyrics → 200 with `source: null`.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getLyricsApi();
final String trackId = trackId_example; // String | Deezer track id
final String title = title_example; // String | Track title
final String artist = artist_example; // String | Artist name
final String album = album_example; // String | Album title
final int duration = 56; // int | Duration in seconds (improves matching)

try {
    final response = api.getLyrics(trackId, title, artist, album, duration);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LyricsApi->getLyrics: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **trackId** | **String**| Deezer track id | 
 **title** | **String**| Track title | [optional] 
 **artist** | **String**| Artist name | [optional] 
 **album** | **String**| Album title | [optional] 
 **duration** | **int**| Duration in seconds (improves matching) | [optional] 

### Return type

[**LyricsEnvelope**](LyricsEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

