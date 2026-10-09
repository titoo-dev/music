# wavelet_api.model.CreateShareInput

## Load the model package
```dart
import 'package:wavelet_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**trackId** | **String** |  | 
**title** | **String** |  | 
**artist** | **String** |  | 
**album** | **String** |  | [optional] 
**coverUrl** | **String** | https Deezer artwork (*.dzcdn.net, api.deezer.com); any other URL is dropped | [optional] 
**duration** | **int** |  | [optional] 
**expiresIn** | **num** | Hours until expiry, more than 0 and at most 8760 (a year). Null or omitted for a permanent link. | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


