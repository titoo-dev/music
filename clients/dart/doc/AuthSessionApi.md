# wavelet_api.api.AuthSessionApi

## Load the API package
```dart
import 'package:wavelet_api/api.dart';
```

All URIs are relative to *https://wavelet.titosy.dev*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getSession**](AuthSessionApi.md#getsession) | **GET** /api/auth/get-session | Current better-auth session
[**signInSocial**](AuthSessionApi.md#signinsocial) | **POST** /api/auth/sign-in/social | Sign in with Google (better-auth)
[**signOut**](AuthSessionApi.md#signout) | **POST** /api/auth/sign-out | Sign out (invalidate the session)


# **getSession**
> BetterAuthSession getSession()

Current better-auth session

Returns `null` (JSON) when no valid session cookie is sent.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getAuthSessionApi();

try {
    final response = api.getSession();
    print(response);
} on DioException catch (e) {
    print('Exception when calling AuthSessionApi->getSession: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**BetterAuthSession**](BetterAuthSession.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **signInSocial**
> SocialSignInResult signInSocial(socialSignInInput)

Sign in with Google (better-auth)

Managed by better-auth (not the `{ success, data }` envelope). For Flutter, use the **idToken** flow: get a Google ID token with `google_sign_in` (with the web client ID as `serverClientId`), POST it here, read the `set-auth-token` response header and send it as `Authorization: Bearer <token>` on every subsequent call.

### Example
```dart
import 'package:wavelet_api/api.dart';

final api = WaveletApi().getAuthSessionApi();
final SocialSignInInput socialSignInInput = ; // SocialSignInInput | 

try {
    final response = api.signInSocial(socialSignInInput);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AuthSessionApi->signInSocial: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **socialSignInInput** | [**SocialSignInInput**](SocialSignInInput.md)|  | 

### Return type

[**SocialSignInResult**](SocialSignInResult.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **signOut**
> SignOut200Response signOut(body)

Sign out (invalidate the session)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getAuthSessionApi();
final JsonObject body = Object; // JsonObject | 

try {
    final response = api.signOut(body);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AuthSessionApi->signOut: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | **JsonObject**|  | [optional] 

### Return type

[**SignOut200Response**](SignOut200Response.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

