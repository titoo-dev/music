# wavelet_api.model.ImportSpotifyPlaylistRequest

## Load the model package
```dart
import 'package:wavelet_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**url** | **String** | Spotify playlist URL, URI or id (first 100 tracks without API access) | 
**tracks** | [**BuiltList&lt;SpotifyTrack&gt;**](SpotifyTrack.md) | tracks read with POST /playlists/import/spotify/tracks | 
**unreadable** | **BuiltList&lt;String&gt;** | track ids that could not be read (reported as not found) | [optional] 
**total** | **int** | number of pasted links, for the truncated flag | [optional] 
**title** | **String** | name of the new playlist (default \"Spotify import\") | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


