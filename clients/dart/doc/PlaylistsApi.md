# wavelet_api.api.PlaylistsApi

## Load the API package
```dart
import 'package:wavelet_api/api.dart';
```

All URIs are relative to *https://wavelet.titosy.dev*

Method | HTTP request | Description
------------- | ------------- | -------------
[**addPlaylistTracks**](PlaylistsApi.md#addplaylisttracks) | **POST** /api/v1/playlists/{id}/tracks | Append track(s) (duplicates skipped)
[**createPlaylist**](PlaylistsApi.md#createplaylist) | **POST** /api/v1/playlists | Create a playlist
[**deletePlaylist**](PlaylistsApi.md#deleteplaylist) | **DELETE** /api/v1/playlists/{id} | Delete a playlist
[**getPlaylist**](PlaylistsApi.md#getplaylist) | **GET** /api/v1/playlists/{id} | Playlist with tracks (ordered by position)
[**importSpotifyPlaylist**](PlaylistsApi.md#importspotifyplaylist) | **POST** /api/v1/playlists/import/spotify | Import a Spotify playlist (matched to Deezer, max 500 tracks)
[**listPlaylists**](PlaylistsApi.md#listplaylists) | **GET** /api/v1/playlists | User playlists (most recently updated first)
[**removePlaylistTracks**](PlaylistsApi.md#removeplaylisttracks) | **DELETE** /api/v1/playlists/{id}/tracks | Remove track(s)
[**reorderPlaylistTracks**](PlaylistsApi.md#reorderplaylisttracks) | **PATCH** /api/v1/playlists/{id}/tracks | Reorder tracks
[**updatePlaylist**](PlaylistsApi.md#updateplaylist) | **PATCH** /api/v1/playlists/{id} | Rename / edit description


# **addPlaylistTracks**
> AddedEnvelope addPlaylistTracks(id, addPlaylistTracksRequest)

Append track(s) (duplicates skipped)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getPlaylistsApi();
final String id = id_example; // String | Playlist id
final AddPlaylistTracksRequest addPlaylistTracksRequest = ; // AddPlaylistTracksRequest | 

try {
    final response = api.addPlaylistTracks(id, addPlaylistTracksRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling PlaylistsApi->addPlaylistTracks: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Playlist id | 
 **addPlaylistTracksRequest** | [**AddPlaylistTracksRequest**](AddPlaylistTracksRequest.md)|  | 

### Return type

[**AddedEnvelope**](AddedEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createPlaylist**
> PlaylistEnvelope createPlaylist(createPlaylistInput)

Create a playlist

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getPlaylistsApi();
final CreatePlaylistInput createPlaylistInput = ; // CreatePlaylistInput | 

try {
    final response = api.createPlaylist(createPlaylistInput);
    print(response);
} on DioException catch (e) {
    print('Exception when calling PlaylistsApi->createPlaylist: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createPlaylistInput** | [**CreatePlaylistInput**](CreatePlaylistInput.md)|  | 

### Return type

[**PlaylistEnvelope**](PlaylistEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deletePlaylist**
> DeletedEnvelope deletePlaylist(id)

Delete a playlist

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getPlaylistsApi();
final String id = id_example; // String | Playlist id

try {
    final response = api.deletePlaylist(id);
    print(response);
} on DioException catch (e) {
    print('Exception when calling PlaylistsApi->deletePlaylist: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Playlist id | 

### Return type

[**DeletedEnvelope**](DeletedEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPlaylist**
> PlaylistWithTracksEnvelope getPlaylist(id)

Playlist with tracks (ordered by position)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getPlaylistsApi();
final String id = id_example; // String | Playlist id

try {
    final response = api.getPlaylist(id);
    print(response);
} on DioException catch (e) {
    print('Exception when calling PlaylistsApi->getPlaylist: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Playlist id | 

### Return type

[**PlaylistWithTracksEnvelope**](PlaylistWithTracksEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **importSpotifyPlaylist**
> SpotifyImportEnvelope importSpotifyPlaylist(importSpotifyPlaylistRequest)

Import a Spotify playlist (matched to Deezer, max 500 tracks)

Synchronous; can take tens of seconds on large playlists — use a long client timeout.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getPlaylistsApi();
final ImportSpotifyPlaylistRequest importSpotifyPlaylistRequest = ; // ImportSpotifyPlaylistRequest | 

try {
    final response = api.importSpotifyPlaylist(importSpotifyPlaylistRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling PlaylistsApi->importSpotifyPlaylist: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **importSpotifyPlaylistRequest** | [**ImportSpotifyPlaylistRequest**](ImportSpotifyPlaylistRequest.md)|  | 

### Return type

[**SpotifyImportEnvelope**](SpotifyImportEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listPlaylists**
> PlaylistSummaryListEnvelope listPlaylists(trackId)

User playlists (most recently updated first)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getPlaylistsApi();
final String trackId = trackId_example; // String | If set, each playlist gets `containsTrack`

try {
    final response = api.listPlaylists(trackId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling PlaylistsApi->listPlaylists: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **trackId** | **String**| If set, each playlist gets `containsTrack` | [optional] 

### Return type

[**PlaylistSummaryListEnvelope**](PlaylistSummaryListEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **removePlaylistTracks**
> RemovedEnvelope removePlaylistTracks(id, removePlaylistTracksRequest)

Remove track(s)

⚠ DELETE with a JSON body. Make sure your HTTP client sends it (Dio does with `data:`).

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getPlaylistsApi();
final String id = id_example; // String | Playlist id
final RemovePlaylistTracksRequest removePlaylistTracksRequest = ; // RemovePlaylistTracksRequest | 

try {
    final response = api.removePlaylistTracks(id, removePlaylistTracksRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling PlaylistsApi->removePlaylistTracks: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Playlist id | 
 **removePlaylistTracksRequest** | [**RemovePlaylistTracksRequest**](RemovePlaylistTracksRequest.md)|  | 

### Return type

[**RemovedEnvelope**](RemovedEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **reorderPlaylistTracks**
> ReorderedEnvelope reorderPlaylistTracks(id, reorderPlaylistTracksRequest)

Reorder tracks

`trackIds` must contain exactly the playlist's current trackIds in the new order.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getPlaylistsApi();
final String id = id_example; // String | Playlist id
final ReorderPlaylistTracksRequest reorderPlaylistTracksRequest = ; // ReorderPlaylistTracksRequest | 

try {
    final response = api.reorderPlaylistTracks(id, reorderPlaylistTracksRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling PlaylistsApi->reorderPlaylistTracks: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Playlist id | 
 **reorderPlaylistTracksRequest** | [**ReorderPlaylistTracksRequest**](ReorderPlaylistTracksRequest.md)|  | 

### Return type

[**ReorderedEnvelope**](ReorderedEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updatePlaylist**
> PlaylistEnvelope updatePlaylist(id, updatePlaylistInput)

Rename / edit description

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getPlaylistsApi();
final String id = id_example; // String | Playlist id
final UpdatePlaylistInput updatePlaylistInput = ; // UpdatePlaylistInput | 

try {
    final response = api.updatePlaylist(id, updatePlaylistInput);
    print(response);
} on DioException catch (e) {
    print('Exception when calling PlaylistsApi->updatePlaylist: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Playlist id | 
 **updatePlaylistInput** | [**UpdatePlaylistInput**](UpdatePlaylistInput.md)|  | 

### Return type

[**PlaylistEnvelope**](PlaylistEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

