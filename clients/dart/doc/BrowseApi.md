# wavelet_api.api.BrowseApi

## Load the API package
```dart
import 'package:wavelet_api/api.dart';
```

All URIs are relative to *https://wavelet.titosy.dev*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getHome**](BrowseApi.md#gethome) | **GET** /api/v1/content/home | Deezer explore page (home feed)
[**getNewReleases**](BrowseApi.md#getnewreleases) | **GET** /api/v1/content/new-releases | Editorial new releases (100 max)
[**getTracklist**](BrowseApi.md#gettracklist) | **GET** /api/v1/content/tracklist | Album / playlist / artist page with tracks


# **getHome**
> DeezerPageEnvelope getHome()

Deezer explore page (home feed)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getBrowseApi();

try {
    final response = api.getHome();
    print(response);
} on DioException catch (e) {
    print('Exception when calling BrowseApi->getHome: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**DeezerPageEnvelope**](DeezerPageEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getNewReleases**
> DeezerApiListEnvelope getNewReleases()

Editorial new releases (100 max)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getBrowseApi();

try {
    final response = api.getNewReleases();
    print(response);
} on DioException catch (e) {
    print('Exception when calling BrowseApi->getNewReleases: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**DeezerApiListEnvelope**](DeezerApiListEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getTracklist**
> DeezerTracklistEnvelope getTracklist(id, type)

Album / playlist / artist page with tracks

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getBrowseApi();
final String id = id_example; // String | Numeric Deezer id
final String type = type_example; // String | Entity type

try {
    final response = api.getTracklist(id, type);
    print(response);
} on DioException catch (e) {
    print('Exception when calling BrowseApi->getTracklist: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Numeric Deezer id | 
 **type** | **String**| Entity type | 

### Return type

[**DeezerTracklistEnvelope**](DeezerTracklistEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

