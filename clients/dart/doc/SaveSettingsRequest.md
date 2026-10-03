# wavelet_api.model.SaveSettingsRequest

## Load the model package
```dart
import 'package:wavelet_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**settings** | [**BuiltMap&lt;String, JsonObject&gt;**](JsonObject.md) | Wavelet engine settings (bitrate, path templates, tagging, …). Key example: `maxBitrate` (1 = MP3 128, 3 = MP3 320, 9 = FLAC). Shape mirrors `src/lib/wavelet/types/Settings.ts`. | [optional] 
**spotifySettings** | [**BuiltMap&lt;String, JsonObject&gt;**](JsonObject.md) | Spotify plugin settings | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


