# wavelet_api.model.DeezerSearchMainEnvelope

## Load the model package
```dart
import 'package:wavelet_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**success** | **bool** |  | 
**data** | [**BuiltMap&lt;String, JsonObject&gt;**](JsonObject.md) | Merged GW search payload with `TRACK`, `ALBUM`, `ARTIST`, `PLAYLIST`, `TOP_RESULT`, `ORDER`, … Each bucket is `{ data: [], count }`. Items are GW objects (uppercase keys) possibly mixed with public-API objects (lowercase keys) appended for extra coverage. | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


