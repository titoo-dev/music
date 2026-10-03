# wavelet_api.model.ConnectStatus

## Load the model package
```dart
import 'package:wavelet_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**authenticated** | **bool** | A better-auth session is present | 
**user** | [**AuthUser**](AuthUser.md) |  | 
**deezerLoggedIn** | **bool** |  | 
**deezerUser** | [**DeezerUser**](DeezerUser.md) |  | 
**deezerAvailable** | **String** |  | 
**settings** | [**BuiltMap&lt;String, JsonObject&gt;**](JsonObject.md) | Same shape as SettingsBundle, or `{}` if the app is not initialized. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


