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
[**saveSettings**](SettingsApi.md#savesettings) | **POST** /api/v1/settings | Save engine settings
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

# **saveSettings**
> SettingsBundleEnvelope saveSettings(saveSettingsRequest)

Save engine settings

`settings` is stored per-user (replaces the previous object) when authenticated. `spotifySettings` is global.

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

