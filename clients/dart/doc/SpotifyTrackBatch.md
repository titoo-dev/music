# wavelet_api.model.SpotifyTrackBatch

## Load the model package
```dart
import 'package:wavelet_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**tracks** | [**BuiltList&lt;SpotifyTrack&gt;**](SpotifyTrack.md) |  | 
**failed** | **BuiltList&lt;String&gt;** | ids Spotify did not return (removed, region-locked) | 
**rateLimited** | **BuiltList&lt;String&gt;** | ids not read because Spotify started refusing — retry after a pause | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


