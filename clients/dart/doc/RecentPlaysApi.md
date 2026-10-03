# wavelet_api.api.RecentPlaysApi

## Load the API package
```dart
import 'package:wavelet_api/api.dart';
```

All URIs are relative to *https://wavelet.titosy.dev*

Method | HTTP request | Description
------------- | ------------- | -------------
[**listRecentPlays**](RecentPlaysApi.md#listrecentplays) | **GET** /api/v1/recent-plays | Listening history (most recent first, cap 100)
[**logRecentPlay**](RecentPlaysApi.md#logrecentplay) | **POST** /api/v1/recent-plays | Log a play — call after 30 s of continuous playback
[**reportSkip**](RecentPlaysApi.md#reportskip) | **POST** /api/v1/recent-plays/{trackId}/skip | Report a skip before 30 s (lets the server free the cached file)


# **listRecentPlays**
> RecentPlayListEnvelope listRecentPlays(limit)

Listening history (most recent first, cap 100)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getRecentPlaysApi();
final int limit = 56; // int | Page size (0 / invalid → 50)

try {
    final response = api.listRecentPlays(limit);
    print(response);
} on DioException catch (e) {
    print('Exception when calling RecentPlaysApi->listRecentPlays: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| Page size (0 / invalid → 50) | [optional] [default to 50]

### Return type

[**RecentPlayListEnvelope**](RecentPlayListEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **logRecentPlay**
> LoggedEnvelope logRecentPlay(recentPlayInput)

Log a play — call after 30 s of continuous playback

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getRecentPlaysApi();
final RecentPlayInput recentPlayInput = ; // RecentPlayInput | 

try {
    final response = api.logRecentPlay(recentPlayInput);
    print(response);
} on DioException catch (e) {
    print('Exception when calling RecentPlaysApi->logRecentPlay: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **recentPlayInput** | [**RecentPlayInput**](RecentPlayInput.md)|  | 

### Return type

[**LoggedEnvelope**](LoggedEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **reportSkip**
> SkipEnvelope reportSkip(trackId)

Report a skip before 30 s (lets the server free the cached file)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getRecentPlaysApi();
final String trackId = trackId_example; // String | Deezer track id

try {
    final response = api.reportSkip(trackId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling RecentPlaysApi->reportSkip: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **trackId** | **String**| Deezer track id | 

### Return type

[**SkipEnvelope**](SkipEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

