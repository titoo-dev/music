import 'package:test/test.dart';
import 'package:wavelet_api/wavelet_api.dart';


/// tests for PlaylistsApi
void main() {
  final instance = WaveletApi().getPlaylistsApi();

  group(PlaylistsApi, () {
    // Append track(s) (duplicates skipped)
    //
    //Future<AddedEnvelope> addPlaylistTracks(String id, AddPlaylistTracksRequest addPlaylistTracksRequest) async
    test('test addPlaylistTracks', () async {
      // TODO
    });

    // Create a playlist
    //
    //Future<PlaylistEnvelope> createPlaylist(CreatePlaylistInput createPlaylistInput) async
    test('test createPlaylist', () async {
      // TODO
    });

    // Delete a playlist
    //
    //Future<DeletedEnvelope> deletePlaylist(String id) async
    test('test deletePlaylist', () async {
      // TODO
    });

    // Playlist with tracks (ordered by position)
    //
    //Future<PlaylistWithTracksEnvelope> getPlaylist(String id) async
    test('test getPlaylist', () async {
      // TODO
    });

    // Import a Spotify playlist (matched to Deezer, max 1000 tracks)
    //
    // Synchronous; can take a couple of minutes on large playlists — use a long client timeout, or the chunked flow: POST /playlists/import/spotify/playlist (or …/tracks), then …/match in batches of 50, then …/save.
    //
    //Future<SpotifyImportEnvelope> importSpotifyPlaylist(ImportSpotifyPlaylistRequest importSpotifyPlaylistRequest) async
    test('test importSpotifyPlaylist', () async {
      // TODO
    });

    // User playlists (most recently updated first)
    //
    //Future<PlaylistSummaryListEnvelope> listPlaylists({ String trackId }) async
    test('test listPlaylists', () async {
      // TODO
    });

    // Match up to 50 Spotify tracks on Deezer
    //
    // Step 2 of the chunked import. `results` is in the order of `tracks`; send the matched ones to POST /playlists/import/spotify/save.
    //
    //Future<SpotifyMatchEnvelope> matchSpotifyTracks(MatchSpotifyTracksRequest matchSpotifyTracksRequest) async
    test('test matchSpotifyTracks', () async {
      // TODO
    });

    // Read a public Spotify playlist (no matching)
    //
    // Step 1 of the chunked import from a playlist link. `tracks` is capped at 1000; `totalTracks` keeps the real count.
    //
    //Future<SpotifyPlaylistEnvelope> readSpotifyPlaylist(ReadSpotifyPlaylistRequest readSpotifyPlaylistRequest) async
    test('test readSpotifyPlaylist', () async {
      // TODO
    });

    // Read up to 50 Spotify tracks from their public pages
    //
    // Step 1 of importing pasted track links. Call in batches; when `rateLimited` is non-empty, pause (20 s, then longer) and resend those ids, then send all tracks to POST /playlists/import/spotify.
    //
    //Future<SpotifyTrackBatchEnvelope> readSpotifyTracks(ReadSpotifyTracksRequest readSpotifyTracksRequest) async
    test('test readSpotifyTracks', () async {
      // TODO
    });

    // Remove track(s)
    //
    // ⚠ DELETE with a JSON body. Make sure your HTTP client sends it (Dio does with `data:`).
    //
    //Future<RemovedEnvelope> removePlaylistTracks(String id, RemovePlaylistTracksRequest removePlaylistTracksRequest) async
    test('test removePlaylistTracks', () async {
      // TODO
    });

    // Reorder tracks
    //
    // `trackIds` must contain exactly the playlist's current trackIds in the new order.
    //
    //Future<ReorderedEnvelope> reorderPlaylistTracks(String id, ReorderPlaylistTracksRequest reorderPlaylistTracksRequest) async
    test('test reorderPlaylistTracks', () async {
      // TODO
    });

    // Create the imported playlist from matched tracks
    //
    // Step 3 of the chunked import. Duplicate track ids are dropped.
    //
    //Future<SpotifySaveEnvelope> saveSpotifyImport(SaveSpotifyImportRequest saveSpotifyImportRequest) async
    test('test saveSpotifyImport', () async {
      // TODO
    });

    // Rename / edit description
    //
    //Future<PlaylistEnvelope> updatePlaylist(String id, UpdatePlaylistInput updatePlaylistInput) async
    test('test updatePlaylist', () async {
      // TODO
    });

  });
}
