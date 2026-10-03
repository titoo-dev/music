# wavelet_api.api.DeezerAccountApi

## Load the API package
```dart
import 'package:wavelet_api/api.dart';
```

All URIs are relative to *https://wavelet.titosy.dev*

Method | HTTP request | Description
------------- | ------------- | -------------
[**changeDeezerAccount**](DeezerAccountApi.md#changedeezeraccount) | **POST** /api/v1/auth/change-account | Switch to another Deezer family/child account
[**getConnectStatus**](DeezerAccountApi.md#getconnectstatus) | **GET** /api/v1/auth/connect | Bootstrap: session + Deezer status + app settings
[**loginDeezerArl**](DeezerAccountApi.md#logindeezerarl) | **POST** /api/v1/auth/login-arl | Connect a Deezer account with an ARL cookie
[**loginDeezerEmail**](DeezerAccountApi.md#logindeezeremail) | **POST** /api/v1/auth/login-email | Connect a Deezer account with email/password
[**logoutDeezer**](DeezerAccountApi.md#logoutdeezer) | **POST** /api/v1/auth/logout | Clear the in-memory Deezer session


# **changeDeezerAccount**
> ChangeAccountEnvelope changeDeezerAccount(changeDeezerAccountRequest)

Switch to another Deezer family/child account

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getDeezerAccountApi();
final ChangeDeezerAccountRequest changeDeezerAccountRequest = ; // ChangeDeezerAccountRequest | 

try {
    final response = api.changeDeezerAccount(changeDeezerAccountRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling DeezerAccountApi->changeDeezerAccount: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **changeDeezerAccountRequest** | [**ChangeDeezerAccountRequest**](ChangeDeezerAccountRequest.md)|  | 

### Return type

[**ChangeAccountEnvelope**](ChangeAccountEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getConnectStatus**
> ConnectStatusEnvelope getConnectStatus()

Bootstrap: session + Deezer status + app settings

Call at app start. Works without auth (guest). When signed in, restores the Deezer session from the stored ARL (or the server's service ARL, which is then persisted for the user).

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getDeezerAccountApi();

try {
    final response = api.getConnectStatus();
    print(response);
} on DioException catch (e) {
    print('Exception when calling DeezerAccountApi->getConnectStatus: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ConnectStatusEnvelope**](ConnectStatusEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **loginDeezerArl**
> DeezerLoginEnvelope loginDeezerArl(loginDeezerArlRequest)

Connect a Deezer account with an ARL cookie

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getDeezerAccountApi();
final LoginDeezerArlRequest loginDeezerArlRequest = ; // LoginDeezerArlRequest | 

try {
    final response = api.loginDeezerArl(loginDeezerArlRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling DeezerAccountApi->loginDeezerArl: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **loginDeezerArlRequest** | [**LoginDeezerArlRequest**](LoginDeezerArlRequest.md)|  | 

### Return type

[**DeezerLoginEnvelope**](DeezerLoginEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **loginDeezerEmail**
> DeezerLoginEnvelope loginDeezerEmail(loginDeezerEmailRequest)

Connect a Deezer account with email/password

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getDeezerAccountApi();
final LoginDeezerEmailRequest loginDeezerEmailRequest = ; // LoginDeezerEmailRequest | 

try {
    final response = api.loginDeezerEmail(loginDeezerEmailRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling DeezerAccountApi->loginDeezerEmail: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **loginDeezerEmailRequest** | [**LoginDeezerEmailRequest**](LoginDeezerEmailRequest.md)|  | 

### Return type

[**DeezerLoginEnvelope**](DeezerLoginEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **logoutDeezer**
> MessageEnvelope logoutDeezer()

Clear the in-memory Deezer session

Does not delete the stored ARL nor the better-auth session (use `/api/auth/sign-out`).

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getDeezerAccountApi();

try {
    final response = api.logoutDeezer();
    print(response);
} on DioException catch (e) {
    print('Exception when calling DeezerAccountApi->logoutDeezer: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**MessageEnvelope**](MessageEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

