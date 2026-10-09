# wavelet_api.api.SettingsApi

## Load the API package
```dart
import 'package:wavelet_api/api.dart';
```

All URIs are relative to *https://wavelet.titosy.dev*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getPreferences**](SettingsApi.md#getpreferences) | **GET** /api/v1/preferences | UI preferences
[**getSettings**](SettingsApi.md#getsettings) | **GET** /api/v1/settings | Engine settings (per-user overrides merged over global)
[**getStreamingQuality**](SettingsApi.md#getstreamingquality) | **GET** /api/v1/settings/quality | Server-wide streaming quality (maxBitrate)
[**saveSettings**](SettingsApi.md#savesettings) | **POST** /api/v1/settings | Save the signed-in user&#39;s engine settings
[**setStreamingQuality**](SettingsApi.md#setstreamingquality) | **POST** /api/v1/settings/quality | Change the server-wide streaming quality
[**updatePreferences**](SettingsApi.md#updatepreferences) | **PATCH** /api/v1/preferences | Merge UI preferences (unknown keys → 400)


# **getPreferences**
> UserPreferencesEnvelope getPreferences()

UI preferences

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getSettingsApi();

try {
    final response = api.getPreferences();
    print(response);
} on DioException catch (e) {
    print('Exception when calling SettingsApi->getPreferences: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**UserPreferencesEnvelope**](UserPreferencesEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSettings**
> SettingsBundleEnvelope getSettings()

Engine settings (per-user overrides merged over global)

Signed in with stored overrides → `settings` is the global settings with the user's overrides merged on top; otherwise the global settings.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getSettingsApi();

try {
    final response = api.getSettings();
    print(response);
} on DioException catch (e) {
    print('Exception when calling SettingsApi->getSettings: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**SettingsBundleEnvelope**](SettingsBundleEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getStreamingQuality**
> StreamingQualityEnvelope getStreamingQuality()

Server-wide streaming quality (maxBitrate)

The one `maxBitrate` every stream uses (1 = MP3 128, 3 = MP3 320, 9 = FLAC). Per-user `settings.maxBitrate` is not used for streaming.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getSettingsApi();

try {
    final response = api.getStreamingQuality();
    print(response);
} on DioException catch (e) {
    print('Exception when calling SettingsApi->getStreamingQuality: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**StreamingQualityEnvelope**](StreamingQualityEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **saveSettings**
> SettingsBundleEnvelope saveSettings(saveSettingsRequest)

Save the signed-in user's engine settings

`settings` replaces the user's stored overrides (null → `{}`, i.e. back to the global settings; a body without `settings` is a 400 INVALID_BODY so it never wipes them by accident). Server-wide settings are never written here (the streaming quality has its own route). A `spotifySettings` field is ignored. The response's `settings` is the object as sent (not merged over the global settings), or the global settings when none was sent.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getSettingsApi();
final SaveSettingsRequest saveSettingsRequest = ; // SaveSettingsRequest | 

try {
    final response = api.saveSettings(saveSettingsRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling SettingsApi->saveSettings: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **saveSettingsRequest** | [**SaveSettingsRequest**](SaveSettingsRequest.md)|  | 

### Return type

[**SettingsBundleEnvelope**](SettingsBundleEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **setStreamingQuality**
> StreamingQualityEnvelope setStreamingQuality(setStreamingQualityRequest)

Change the server-wide streaming quality

Applies to every listener. Tracks already cached keep the bitrate they were stored in. When `WAVELET_ADMIN_EMAILS` is set (comma-separated, case-insensitive), only those accounts may change it — anyone else gets 403 `FORBIDDEN`; when it is unset or empty, any signed-in user may.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getSettingsApi();
final SetStreamingQualityRequest setStreamingQualityRequest = ; // SetStreamingQualityRequest | 

try {
    final response = api.setStreamingQuality(setStreamingQualityRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling SettingsApi->setStreamingQuality: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **setStreamingQualityRequest** | [**SetStreamingQualityRequest**](SetStreamingQualityRequest.md)|  | 

### Return type

[**StreamingQualityEnvelope**](StreamingQualityEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updatePreferences**
> UserPreferencesEnvelope updatePreferences(userPreferences)

Merge UI preferences (unknown keys → 400)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getSettingsApi();
final UserPreferences userPreferences = ; // UserPreferences | 

try {
    final response = api.updatePreferences(userPreferences);
    print(response);
} on DioException catch (e) {
    print('Exception when calling SettingsApi->updatePreferences: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userPreferences** | [**UserPreferences**](UserPreferences.md)|  | 

### Return type

[**UserPreferencesEnvelope**](UserPreferencesEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

