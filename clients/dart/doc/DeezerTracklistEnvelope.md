# wavelet_api.model.DeezerTracklistEnvelope

## Load the model package
```dart
import 'package:wavelet_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**success** | **bool** |  | 
**data** | [**BuiltMap&lt;String, JsonObject&gt;**](JsonObject.md) | Raw Deezer GW payload. `type=album` → album page + `tracks[]`; `type=playlist` → playlist page + `tracks[]`; `type=artist` → artist page + `topTracks[]` + `discography`. GW objects use uppercase keys (SNG_ID, ALB_ID, ART_ID, …). | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


