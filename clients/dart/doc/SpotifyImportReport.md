# wavelet_api.model.SpotifyImportReport

## Load the model package
```dart
import 'package:wavelet_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**totalSpotify** | **int** |  | 
**processed** | **int** |  | 
**matched** | **int** |  | 
**notFound** | [**BuiltList&lt;SpotifyImportReportNotFoundInner&gt;**](SpotifyImportReportNotFoundInner.md) |  | 
**truncated** | **bool** | true when the playlist had more than 1000 tracks | 
**limited** | **bool** | true when Spotify only exposed the first 100 tracks of a playlist link (paste track links for the full list) | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


