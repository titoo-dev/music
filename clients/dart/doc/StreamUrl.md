# wavelet_api.model.StreamUrl

## Load the model package
```dart
import 'package:wavelet_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**url** | **String** | Presigned Cloudflare R2 URL, valid 1 h (3600 s, see `expiresAt`). null → see `status`. | 
**contentType** | **String** | Present only when `url` is set | [optional] 
**expiresAt** | [**DateTime**](DateTime.md) | Present only when `url` is set. ISO-8601 instant the presigned URL lapses (signing time + 3600 s, never later than the real expiry). Refresh it with this endpoint before then. | [optional] 
**status** | **String** | Present only when `url` is null. `not_cached`: no usable cached copy (including a copy below this listener's quality, which the progressive play upgrades) → play /stream-progressive. `unsupported_storage`: only copies in older storage → /stream-progressive. `file_missing`: the object is gone from R2 → /stream-progressive. `presigned_disabled`: presigned URLs are turned off server-side (`WAVELET_DISABLE_PRESIGNED_URLS=1`) → play the same-origin /stream. | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


