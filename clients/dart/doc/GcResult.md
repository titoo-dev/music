# wavelet_api.model.GcResult

## Load the model package
```dart
import 'package:wavelet_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**ran** | **bool** | false while `CRON_SECRET` is unset (no work done) | 
**reason** | **String** | Only when `ran` is false | [optional] 
**rowsDeleted** | **int** | Unreferenced StoredTrack rows deleted (only when `ran` is true) | [optional] 
**objectsDeleted** | **int** | R2 objects of those rows deleted (only when `ran` is true) | [optional] 
**objectsScanned** | **int** | Objects listed under `tracks/` (only when `ran` is true) | [optional] 
**orphanObjectsDeleted** | **int** | Objects under `tracks/` without any row deleted (only when `ran` is true) | [optional] 
**expiredSharesDeleted** | **int** | Share links expired for more than 30 days deleted (only when `ran` is true) | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


