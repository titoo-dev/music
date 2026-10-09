# wavelet_api.api.InternalApi

## Load the API package
```dart
import 'package:wavelet_api/api.dart';
```

All URIs are relative to *https://wavelet.titosy.dev*

Method | HTTP request | Description
------------- | ------------- | -------------
[**runStorageGc**](InternalApi.md#runstoragegc) | **GET** /api/v1/internal/gc | Daily storage garbage collection (Vercel Cron — not for app clients)


# **runStorageGc**
> GcEnvelope runStorageGc()

Daily storage garbage collection (Vercel Cron — not for app clients)

Run by the daily cron in `vercel.json`. Requires `Authorization: Bearer <CRON_SECRET>` (Vercel sends it to cron invocations when `CRON_SECRET` is set) → 401 `UNAUTHORIZED` otherwise. While `CRON_SECRET` is unset it is a no-op answering 200 `{ ran: false, reason }`, whatever the Authorization header. Deletes StoredTrack rows older than 24 h that nothing references and no persist is writing (with their object unless another row uses it), then objects under `tracks/` older than 24 h that no row points at. Bounded per run.

### Example
```dart
import 'package:wavelet_api/api.dart';

final api = WaveletApi().getInternalApi();

try {
    final response = api.runStorageGc();
    print(response);
} on DioException catch (e) {
    print('Exception when calling InternalApi->runStorageGc: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**GcEnvelope**](GcEnvelope.md)

### Authorization

[cronSecret](../README.md#cronSecret)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

