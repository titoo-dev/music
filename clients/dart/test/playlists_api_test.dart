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

    // Import a Spotify playlist (matched to Deezer, max 500 tracks)
    //
    // Synchronous; can take tens of seconds on large playlists — use a long client timeout.
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

    // Rename / edit description
    //
    //Future<PlaylistEnvelope> updatePlaylist(String id, UpdatePlaylistInput updatePlaylistInput) async
    test('test updatePlaylist', () async {
      // TODO
    });

  });
}
