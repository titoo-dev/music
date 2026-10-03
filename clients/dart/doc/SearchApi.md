# wavelet_api.api.SearchApi

## Load the API package
```dart
import 'package:wavelet_api/api.dart';
```

All URIs are relative to *https://wavelet.titosy.dev*

Method | HTTP request | Description
------------- | ------------- | -------------
[**search**](SearchApi.md#search) | **GET** /api/v1/search | Typed search (Deezer public API)
[**searchAlbum**](SearchApi.md#searchalbum) | **GET** /api/v1/search/album | Album search
[**searchMain**](SearchApi.md#searchmain) | **GET** /api/v1/search/main | Global search (all buckets, GW + API merged)
[**searchSuggest**](SearchApi.md#searchsuggest) | **GET** /api/v1/search/suggest | Autocomplete suggestions (normalized)


# **search**
> DeezerApiListEnvelope search(term, type, start, nb)

Typed search (Deezer public API)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getSearchApi();
final String term = term_example; // String | Search query
final String type = type_example; // String | Result type
final int start = 56; // int | Offset
final int nb = 56; // int | Page size

try {
    final response = api.search(term, type, start, nb);
    print(response);
} on DioException catch (e) {
    print('Exception when calling SearchApi->search: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **term** | **String**| Search query | 
 **type** | **String**| Result type | [optional] [default to 'track']
 **start** | **int**| Offset | [optional] [default to 0]
 **nb** | **int**| Page size | [optional] [default to 100]

### Return type

[**DeezerApiListEnvelope**](DeezerApiListEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchAlbum**
> DeezerApiListEnvelope searchAlbum(term, start, nb)

Album search

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getSearchApi();
final String term = term_example; // String | Search query
final int start = 56; // int | Offset
final int nb = 56; // int | Page size

try {
    final response = api.searchAlbum(term, start, nb);
    print(response);
} on DioException catch (e) {
    print('Exception when calling SearchApi->searchAlbum: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **term** | **String**| Search query | 
 **start** | **int**| Offset | [optional] [default to 0]
 **nb** | **int**| Page size | [optional] [default to 100]

### Return type

[**DeezerApiListEnvelope**](DeezerApiListEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchMain**
> DeezerSearchMainEnvelope searchMain(term)

Global search (all buckets, GW + API merged)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getSearchApi();
final String term = term_example; // String | Search query

try {
    final response = api.searchMain(term);
    print(response);
} on DioException catch (e) {
    print('Exception when calling SearchApi->searchMain: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **term** | **String**| Search query | 

### Return type

[**DeezerSearchMainEnvelope**](DeezerSearchMainEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchSuggest**
> SuggestionsEnvelope searchSuggest(term, limit)

Autocomplete suggestions (normalized)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getSearchApi();
final String term = term_example; // String | Search query
final int limit = 56; // int | Per-bucket limit (clamped 1–10)

try {
    final response = api.searchSuggest(term, limit);
    print(response);
} on DioException catch (e) {
    print('Exception when calling SearchApi->searchSuggest: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **term** | **String**| Search query | 
 **limit** | **int**| Per-bucket limit (clamped 1–10) | [optional] [default to 5]

### Return type

[**SuggestionsEnvelope**](SuggestionsEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

