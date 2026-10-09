// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'import_spotify_playlist_request_one_of1.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ImportSpotifyPlaylistRequestOneOf1
    extends ImportSpotifyPlaylistRequestOneOf1 {
  @override
  final BuiltList<SpotifyTrack> tracks;
  @override
  final BuiltList<String>? unreadable;
  @override
  final int? total;
  @override
  final String? title;

  factory _$ImportSpotifyPlaylistRequestOneOf1(
          [void Function(ImportSpotifyPlaylistRequestOneOf1Builder)?
              updates]) =>
      (ImportSpotifyPlaylistRequestOneOf1Builder()..update(updates))._build();

  _$ImportSpotifyPlaylistRequestOneOf1._(
      {required this.tracks, this.unreadable, this.total, this.title})
      : super._();
  @override
  ImportSpotifyPlaylistRequestOneOf1 rebuild(
          void Function(ImportSpotifyPlaylistRequestOneOf1Builder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ImportSpotifyPlaylistRequestOneOf1Builder toBuilder() =>
      ImportSpotifyPlaylistRequestOneOf1Builder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ImportSpotifyPlaylistRequestOneOf1 &&
        tracks == other.tracks &&
        unreadable == other.unreadable &&
        total == other.total &&
        title == other.title;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, tracks.hashCode);
    _$hash = $jc(_$hash, unreadable.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ImportSpotifyPlaylistRequestOneOf1')
          ..add('tracks', tracks)
          ..add('unreadable', unreadable)
          ..add('total', total)
          ..add('title', title))
        .toString();
  }
}

class ImportSpotifyPlaylistRequestOneOf1Builder
    implements
        Builder<ImportSpotifyPlaylistRequestOneOf1,
            ImportSpotifyPlaylistRequestOneOf1Builder> {
  _$ImportSpotifyPlaylistRequestOneOf1? _$v;

  ListBuilder<SpotifyTrack>? _tracks;
  ListBuilder<SpotifyTrack> get tracks =>
      _$this._tracks ??= ListBuilder<SpotifyTrack>();
  set tracks(ListBuilder<SpotifyTrack>? tracks) => _$this._tracks = tracks;

  ListBuilder<String>? _unreadable;
  ListBuilder<String> get unreadable =>
      _$this._unreadable ??= ListBuilder<String>();
  set unreadable(ListBuilder<String>? unreadable) =>
      _$this._unreadable = unreadable;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  ImportSpotifyPlaylistRequestOneOf1Builder() {
    ImportSpotifyPlaylistRequestOneOf1._defaults(this);
  }

  ImportSpotifyPlaylistRequestOneOf1Builder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tracks = $v.tracks.toBuilder();
      _unreadable = $v.unreadable?.toBuilder();
      _total = $v.total;
      _title = $v.title;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ImportSpotifyPlaylistRequestOneOf1 other) {
    _$v = other as _$ImportSpotifyPlaylistRequestOneOf1;
  }

  @override
  void update(
      void Function(ImportSpotifyPlaylistRequestOneOf1Builder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ImportSpotifyPlaylistRequestOneOf1 build() => _build();

  _$ImportSpotifyPlaylistRequestOneOf1 _build() {
    _$ImportSpotifyPlaylistRequestOneOf1 _$result;
    try {
      _$result = _$v ??
          _$ImportSpotifyPlaylistRequestOneOf1._(
            tracks: tracks.build(),
            unreadable: _unreadable?.build(),
            total: total,
            title: title,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tracks';
        tracks.build();
        _$failedField = 'unreadable';
        _unreadable?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ImportSpotifyPlaylistRequestOneOf1', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
