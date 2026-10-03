# wavelet_api.model.PlaylistSummary

## Load the model package
```dart
import 'package:wavelet_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**userId** | **String** |  | 
**title** | **String** |  | 
**description** | **String** |  | 
**coverUrl** | **String** |  | 
**isPublic** | **bool** |  | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**updatedAt** | [**DateTime**](DateTime.md) |  | 
**count** | [**PlaylistSummaryAllOfCount**](PlaylistSummaryAllOfCount.md) |  | 
**covers** | **BuiltList&lt;String&gt;** | Cover URLs of the first 4 tracks | 
**containsTrack** | **bool** | Only present when `?trackId=` is passed | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


