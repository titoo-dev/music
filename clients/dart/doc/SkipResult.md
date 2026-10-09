# wavelet_api.model.SkipResult

## Load the model package
```dart
import 'package:wavelet_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**kept** | **bool** |  | [optional] 
**reason** | **String** | Why the file was kept: `already_played` (this user logged a real play), `anchored` (saved, in a saved album, shared or recent-played by anyone), `persisting` (a persist of the track is in flight), `recent` (its cached copy is younger than 10 min — another listener may be playing it). | [optional] 
**evicted** | **bool** |  | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


