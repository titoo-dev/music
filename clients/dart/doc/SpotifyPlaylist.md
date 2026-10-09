# wavelet_api.model.SpotifyPlaylist

## Load the model package
```dart
import 'package:wavelet_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**spotifyId** | **String** |  | 
**title** | **String** |  | 
**description** | **String** |  | [optional] 
**ownerName** | **String** |  | [optional] 
**coverUrl** | **String** |  | [optional] 
**totalTracks** | **int** | real size of the playlist (tracks is capped at 1000) | 
**tracks** | [**BuiltList&lt;SpotifyTrack&gt;**](SpotifyTrack.md) |  | 
**source_** | **String** |  | 
**limited** | **bool** | true when Spotify only exposed the first 100 tracks | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


