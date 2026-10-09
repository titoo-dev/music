import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for InternalApi
void main() {
  final instance = WaveletApi().getInternalApi();

  group(InternalApi, () {
    // Daily storage garbage collection (Vercel Cron — not for app clients)
    //
    // Run by the daily cron in `vercel.json`. Requires `Authorization: Bearer <CRON_SECRET>` (Vercel sends it to cron invocations when `CRON_SECRET` is set) → 401 `UNAUTHORIZED` otherwise. While `CRON_SECRET` is unset it is a no-op answering 200 `{ ran: false, reason }`, whatever the Authorization header. Deletes StoredTrack rows older than 24 h that nothing references and no persist is writing (with their object unless another row uses it), then objects under `tracks/` older than 24 h that no row points at. Bounded per run.
    //
    //Future<GcEnvelope> runStorageGc() async
    test('test runStorageGc', () async {
      // TODO
    });

  });
}
