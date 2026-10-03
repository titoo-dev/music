# wavelet_api.api.SharesApi

## Load the API package
```dart
import 'package:wavelet_api/api.dart';
```

All URIs are relative to *https://wavelet.titosy.dev*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createShare**](SharesApi.md#createshare) | **POST** /api/v1/shares | Create (or reuse) a public share link for a track
[**deleteShare**](SharesApi.md#deleteshare) | **DELETE** /api/v1/shares/{shareId} | Revoke a share link (owner only)
[**getShare**](SharesApi.md#getshare) | **GET** /api/v1/shares/{shareId} | Public share metadata (no auth)
[**listShares**](SharesApi.md#listshares) | **GET** /api/v1/shares | My share links
[**streamShare**](SharesApi.md#streamshare) | **GET** /api/v1/shares/{shareId}/stream | Public audio stream of a shared track (no auth)


# **createShare**
> SharedTrackEnvelope createShare(createShareInput)

Create (or reuse) a public share link for a track

Returns 200 with the existing share if one already exists for this track, 201 otherwise. Public page: `https://wavelet.titosy.dev/share/t/{shareId}`.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getSharesApi();
final CreateShareInput createShareInput = ; // CreateShareInput | 

try {
    final response = api.createShare(createShareInput);
    print(response);
} on DioException catch (e) {
    print('Exception when calling SharesApi->createShare: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createShareInput** | [**CreateShareInput**](CreateShareInput.md)|  | 

### Return type

[**SharedTrackEnvelope**](SharedTrackEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteShare**
> DeletedEnvelope deleteShare(shareId)

Revoke a share link (owner only)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getSharesApi();
final String shareId = shareId_example; // String | Public share id

try {
    final response = api.deleteShare(shareId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling SharesApi->deleteShare: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **shareId** | **String**| Public share id | 

### Return type

[**DeletedEnvelope**](DeletedEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getShare**
> PublicShareEnvelope getShare(shareId)

Public share metadata (no auth)

### Example
```dart
import 'package:wavelet_api/api.dart';

final api = WaveletApi().getSharesApi();
final String shareId = shareId_example; // String | Public share id

try {
    final response = api.getShare(shareId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling SharesApi->getShare: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **shareId** | **String**| Public share id | 

### Return type

[**PublicShareEnvelope**](PublicShareEnvelope.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listShares**
> SharedTrackListEnvelope listShares()

My share links

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getSharesApi();

try {
    final response = api.listShares();
    print(response);
} on DioException catch (e) {
    print('Exception when calling SharesApi->listShares: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**SharedTrackListEnvelope**](SharedTrackListEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **streamShare**
> Uint8List streamShare(shareId, range)

Public audio stream of a shared track (no auth)

Range supported when served from cache (206); live fallback has `Accept-Ranges: none`. Each call increments the play counter.

### Example
```dart
import 'package:wavelet_api/api.dart';

final api = WaveletApi().getSharesApi();
final String shareId = shareId_example; // String | Public share id
final String range = bytes=0-; // String | 

try {
    final response = api.streamShare(shareId, range);
    print(response);
} on DioException catch (e) {
    print('Exception when calling SharesApi->streamShare: $e\n');
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

