// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_playlist.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SpotifyPlaylistSource_Enum _$spotifyPlaylistSourceEnum_api =
    const SpotifyPlaylistSource_Enum._('api');
const SpotifyPlaylistSource_Enum _$spotifyPlaylistSourceEnum_embed =
    const SpotifyPlaylistSource_Enum._('embed');

SpotifyPlaylistSource_Enum _$spotifyPlaylistSourceEnumValueOf(String name) {
  switch (name) {
    case 'api':
      return _$spotifyPlaylistSourceEnum_api;
    case 'embed':
      return _$spotifyPlaylistSourceEnum_embed;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SpotifyPlaylistSource_Enum> _$spotifyPlaylistSourceEnumValues =
    BuiltSet<SpotifyPlaylistSource_Enum>(const <SpotifyPlaylistSource_Enum>[
  _$spotifyPlaylistSourceEnum_api,
  _$spotifyPlaylistSourceEnum_embed,
]);

Serializer<SpotifyPlaylistSource_Enum> _$spotifyPlaylistSourceEnumSerializer =
    _$SpotifyPlaylistSource_EnumSerializer();

class _$SpotifyPlaylistSource_EnumSerializer
    implements PrimitiveSerializer<SpotifyPlaylistSource_Enum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'api': 'api',
    'embed': 'embed',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'api': 'api',
    'embed': 'embed',
  };

  @override
  final Iterable<Type> types = const <Type>[SpotifyPlaylistSource_Enum];
  @override
  final String wireName = 'SpotifyPlaylistSource_Enum';

  @override
  Object serialize(Serializers serializers, SpotifyPlaylistSource_Enum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SpotifyPlaylistSource_Enum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SpotifyPlaylistSource_Enum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$SpotifyPlaylist extends SpotifyPlaylist {
  @override
  final String spotifyId;
  @override
  final String title;
  @override
  final String? description;
  @override
  final String? ownerName;
  @override
  final String? coverUrl;
  @override
  final int totalTracks;
  @override
  final BuiltList<SpotifyTrack> tracks;
  @override
  final SpotifyPlaylistSource_Enum source_;
  @override
  final bool limited;

  factory _$SpotifyPlaylist([void Function(SpotifyPlaylistBuilder)? updates]) =>
      (SpotifyPlaylistBuilder()..update(updates))._build();

  _$SpotifyPlaylist._(
      {required this.spotifyId,
      required this.title,
      this.description,
      this.ownerName,
      this.coverUrl,
      required this.totalTracks,
      required this.tracks,
      required this.source_,
      required this.limited})
      : super._();
  @override
  SpotifyPlaylist rebuild(void Function(SpotifyPlaylistBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifyPlaylistBuilder toBuilder() => SpotifyPlaylistBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifyPlaylist &&
        spotifyId == other.spotifyId &&
        title == other.title &&
        description == other.description &&
        ownerName == other.ownerName &&
        coverUrl == other.coverUrl &&
        totalTracks == other.totalTracks &&
        tracks == other.tracks &&
        source_ == other.source_ &&
        limited == other.limited;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, spotifyId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, ownerName.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jc(_$hash, totalTracks.hashCode);
    _$hash = $jc(_$hash, tracks.hashCode);
    _$hash = $jc(_$hash, source_.hashCode);
    _$hash = $jc(_$hash, limited.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SpotifyPlaylist')
          ..add('spotifyId', spotifyId)
          ..add('title', title)
          ..add('description', description)
          ..add('ownerName', ownerName)
          ..add('coverUrl', coverUrl)
          ..add('totalTracks', totalTracks)
          ..add('tracks', tracks)
          ..add('source_', source_)
          ..add('limited', limited))
        .toString();
  }
}

class SpotifyPlaylistBuilder
    implements Builder<SpotifyPlaylist, SpotifyPlaylistBuilder> {
  _$SpotifyPlaylist? _$v;

  String? _spotifyId;
  String? get spotifyId => _$this._spotifyId;
  set spotifyId(String? spotifyId) => _$this._spotifyId = spotifyId;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  String? _ownerName;
  String? get ownerName => _$this._ownerName;
  set ownerName(String? ownerName) => _$this._ownerName = ownerName;

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(String? coverUrl) => _$this._coverUrl = coverUrl;

  int? _totalTracks;
  int? get totalTracks => _$this._totalTracks;
  set totalTracks(int? totalTracks) => _$this._totalTracks = totalTracks;

  ListBuilder<SpotifyTrack>? _tracks;
  ListBuilder<SpotifyTrack> get tracks =>
      _$this._tracks ??= ListBuilder<SpotifyTrack>();
  set tracks(ListBuilder<SpotifyTrack>? tracks) => _$this._tracks = tracks;

  SpotifyPlaylistSource_Enum? _source_;
  SpotifyPlaylistSource_Enum? get source_ => _$this._source_;
  set source_(SpotifyPlaylistSource_Enum? source_) => _$this._source_ = source_;

  bool? _limited;
  bool? get limited => _$this._limited;
  set limited(bool? limited) => _$this._limited = limited;

  SpotifyPlaylistBuilder() {
    SpotifyPlaylist._defaults(this);
  }

  SpotifyPlaylistBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _spotifyId = $v.spotifyId;
      _title = $v.title;
      _description = $v.description;
      _ownerName = $v.ownerName;
      _coverUrl = $v.coverUrl;
      _totalTracks = $v.totalTracks;
      _tracks = $v.tracks.toBuilder();
      _source_ = $v.source_;
      _limited = $v.limited;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifyPlaylist other) {
    _$v = other as _$SpotifyPlaylist;
  }

  @override
  void update(void Function(SpotifyPlaylistBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifyPlaylist build() => _build();

  _$SpotifyPlaylist _build() {
    _$SpotifyPlaylist _$result;
    try {
      _$result = _$v ??
          _$SpotifyPlaylist._(
            spotifyId: BuiltValueNullFieldError.checkNotNull(
                spotifyId, r'SpotifyPlaylist', 'spotifyId'),
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'SpotifyPlaylist', 'title'),
            description: description,
            ownerName: ownerName,
            coverUrl: coverUrl,
            totalTracks: BuiltValueNullFieldError.checkNotNull(
                totalTracks, r'SpotifyPlaylist', 'totalTracks'),
            tracks: tracks.build(),
            source_: BuiltValueNullFieldError.checkNotNull(
                source_, r'SpotifyPlaylist', 'source_'),
            limited: BuiltValueNullFieldError.checkNotNull(
                limited, r'SpotifyPlaylist', 'limited'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tracks';
        tracks.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SpotifyPlaylist', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
