# wavelet_api.api.LibraryApi

## Load the API package
```dart
import 'package:wavelet_api/api.dart';
```

All URIs are relative to *https://wavelet.titosy.dev*

Method | HTTP request | Description
------------- | ------------- | -------------
[**followArtist**](LibraryApi.md#followartist) | **POST** /api/v1/library/artists | Follow an artist (upsert)
[**getLibraryStatus**](LibraryApi.md#getlibrarystatus) | **POST** /api/v1/library/status | Batch: which of these tracks/albums are saved?
[**getSavedAlbum**](LibraryApi.md#getsavedalbum) | **GET** /api/v1/library/albums/{albumId} | Saved album with tracklist
[**isTrackSaved**](LibraryApi.md#istracksaved) | **GET** /api/v1/library/tracks/{trackId} | Is this track liked?
[**listFollowedArtists**](LibraryApi.md#listfollowedartists) | **GET** /api/v1/library/artists | Followed artists
[**listSavedAlbums**](LibraryApi.md#listsavedalbums) | **GET** /api/v1/library/albums | Saved albums
[**listSavedTracks**](LibraryApi.md#listsavedtracks) | **GET** /api/v1/library/tracks | Liked tracks (most recent first)
[**saveAlbum**](LibraryApi.md#savealbum) | **POST** /api/v1/library/albums | Save an album with its tracklist (upsert, re-syncs tracks)
[**saveTrack**](LibraryApi.md#savetrack) | **POST** /api/v1/library/tracks | Like a track (upsert)
[**unfollowArtist**](LibraryApi.md#unfollowartist) | **DELETE** /api/v1/library/artists/{deezerArtistId} | Unfollow an artist (idempotent)
[**unsaveAlbum**](LibraryApi.md#unsavealbum) | **DELETE** /api/v1/library/albums/{albumId} | Remove a saved album
[**unsaveTrack**](LibraryApi.md#unsavetrack) | **DELETE** /api/v1/library/tracks/{trackId} | Unlike a track (idempotent)


# **followArtist**
> FollowedArtistEnvelope followArtist(followArtistInput)

Follow an artist (upsert)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getLibraryApi();
final FollowArtistInput followArtistInput = ; // FollowArtistInput | 

try {
    final response = api.followArtist(followArtistInput);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LibraryApi->followArtist: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **followArtistInput** | [**FollowArtistInput**](FollowArtistInput.md)|  | 

### Return type

[**FollowedArtistEnvelope**](FollowedArtistEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getLibraryStatus**
> LibraryStatusEnvelope getLibraryStatus(libraryStatusInput)

Batch: which of these tracks/albums are saved?

Non-array `trackIds` / `albumIds` are silently treated as `[]`.

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getLibraryApi();
final LibraryStatusInput libraryStatusInput = ; // LibraryStatusInput | 

try {
    final response = api.getLibraryStatus(libraryStatusInput);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LibraryApi->getLibraryStatus: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **libraryStatusInput** | [**LibraryStatusInput**](LibraryStatusInput.md)|  | 

### Return type

[**LibraryStatusEnvelope**](LibraryStatusEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSavedAlbum**
> AlbumWithTracksEnvelope getSavedAlbum(albumId)

Saved album with tracklist

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getLibraryApi();
final String albumId = albumId_example; // String | Internal Album.id (cuid), NOT the Deezer album id

try {
    final response = api.getSavedAlbum(albumId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LibraryApi->getSavedAlbum: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **albumId** | **String**| Internal Album.id (cuid), NOT the Deezer album id | 

### Return type

[**AlbumWithTracksEnvelope**](AlbumWithTracksEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **isTrackSaved**
> SavedFlagEnvelope isTrackSaved(trackId)

Is this track liked?

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getLibraryApi();
final String trackId = trackId_example; // String | Deezer track id

try {
    final response = api.isTrackSaved(trackId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LibraryApi->isTrackSaved: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **trackId** | **String**| Deezer track id | 

### Return type

[**SavedFlagEnvelope**](SavedFlagEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listFollowedArtists**
> FollowedArtistListEnvelope listFollowedArtists()

Followed artists

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getLibraryApi();

try {
    final response = api.listFollowedArtists();
    print(response);
} on DioException catch (e) {
    print('Exception when calling LibraryApi->listFollowedArtists: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**FollowedArtistListEnvelope**](FollowedArtistListEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listSavedAlbums**
> AlbumListEnvelope listSavedAlbums()

Saved albums

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getLibraryApi();

try {
    final response = api.listSavedAlbums();
    print(response);
} on DioException catch (e) {
    print('Exception when calling LibraryApi->listSavedAlbums: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**AlbumListEnvelope**](AlbumListEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listSavedTracks**
> SavedTrackListEnvelope listSavedTracks(limit, offset)

Liked tracks (most recent first)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getLibraryApi();
final int limit = 56; // int | Page size (0 / invalid → 100)
final int offset = 56; // int | Offset

try {
    final response = api.listSavedTracks(limit, offset);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LibraryApi->listSavedTracks: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| Page size (0 / invalid → 100) | [optional] [default to 100]
 **offset** | **int**| Offset | [optional] [default to 0]

### Return type

[**SavedTrackListEnvelope**](SavedTrackListEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **saveAlbum**
> SavedAlbumEnvelope saveAlbum(saveAlbumInput)

Save an album with its tracklist (upsert, re-syncs tracks)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getLibraryApi();
final SaveAlbumInput saveAlbumInput = ; // SaveAlbumInput | 

try {
    final response = api.saveAlbum(saveAlbumInput);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LibraryApi->saveAlbum: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **saveAlbumInput** | [**SaveAlbumInput**](SaveAlbumInput.md)|  | 

### Return type

[**SavedAlbumEnvelope**](SavedAlbumEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **saveTrack**
> SavedTrackEnvelope saveTrack(trackMetaInput)

Like a track (upsert)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getLibraryApi();
final TrackMetaInput trackMetaInput = ; // TrackMetaInput | 

try {
    final response = api.saveTrack(trackMetaInput);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LibraryApi->saveTrack: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **trackMetaInput** | [**TrackMetaInput**](TrackMetaInput.md)|  | 

### Return type

[**SavedTrackEnvelope**](SavedTrackEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **unfollowArtist**
> UnfollowedEnvelope unfollowArtist(deezerArtistId)

Unfollow an artist (idempotent)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getLibraryApi();
final String deezerArtistId = deezerArtistId_example; // String | Deezer artist id

try {
    final response = api.unfollowArtist(deezerArtistId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LibraryApi->unfollowArtist: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **deezerArtistId** | **String**| Deezer artist id | 

### Return type

[**UnfollowedEnvelope**](UnfollowedEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **unsaveAlbum**
> UnsavedEnvelope unsaveAlbum(albumId)

Remove a saved album

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getLibraryApi();
final String albumId = albumId_example; // String | Internal Album.id (cuid), NOT the Deezer album id

try {
    final response = api.unsaveAlbum(albumId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LibraryApi->unsaveAlbum: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **albumId** | **String**| Internal Album.id (cuid), NOT the Deezer album id | 

### Return type

[**UnsavedEnvelope**](UnsavedEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **unsaveTrack**
> UnsavedEnvelope unsaveTrack(trackId)

Unlike a track (idempotent)

### Example
```dart
import 'package:wavelet_api/api.dart';
// TODO Configure API key authorization: sessionCookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('sessionCookie').apiKeyPrefix = 'Bearer';

final api = WaveletApi().getLibraryApi();
final String trackId = trackId_example; // String | Deezer track id

try {
    final response = api.unsaveTrack(trackId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling LibraryApi->unsaveTrack: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **trackId** | **String**| Deezer track id | 

### Return type

[**UnsavedEnvelope**](UnsavedEnvelope.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

