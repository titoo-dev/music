// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'suggest_track.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SuggestTrackSource_Enum _$suggestTrackSourceEnum_deezer =
    const SuggestTrackSource_Enum._('deezer');

SuggestTrackSource_Enum _$suggestTrackSourceEnumValueOf(String name) {
  switch (name) {
    case 'deezer':
      return _$suggestTrackSourceEnum_deezer;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SuggestTrackSource_Enum> _$suggestTrackSourceEnumValues =
    BuiltSet<SuggestTrackSource_Enum>(const <SuggestTrackSource_Enum>[
  _$suggestTrackSourceEnum_deezer,
]);

Serializer<SuggestTrackSource_Enum> _$suggestTrackSourceEnumSerializer =
    _$SuggestTrackSource_EnumSerializer();

class _$SuggestTrackSource_EnumSerializer
    implements PrimitiveSerializer<SuggestTrackSource_Enum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'deezer': 'deezer',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'deezer': 'deezer',
  };

  @override
  final Iterable<Type> types = const <Type>[SuggestTrackSource_Enum];
  @override
  final String wireName = 'SuggestTrackSource_Enum';

  @override
  Object serialize(Serializers serializers, SuggestTrackSource_Enum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SuggestTrackSource_Enum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SuggestTrackSource_Enum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$SuggestTrack extends SuggestTrack {
  @override
  final SuggestTrackSource_Enum source_;
  @override
  final String sourceId;
  @override
  final String deezerTrackId;
  @override
  final String title;
  @override
  final BuiltList<String> artists;
  @override
  final String? artistId;
  @override
  final String album;
  @override
  final String? albumId;
  @override
  final int durationMs;
  @override
  final String? coverUrl;

  factory _$SuggestTrack([void Function(SuggestTrackBuilder)? updates]) =>
      (SuggestTrackBuilder()..update(updates))._build();

  _$SuggestTrack._(
      {required this.source_,
      required this.sourceId,
      required this.deezerTrackId,
      required this.title,
      required this.artists,
      this.artistId,
      required this.album,
      this.albumId,
      required this.durationMs,
      this.coverUrl})
      : super._();
  @override
  SuggestTrack rebuild(void Function(SuggestTrackBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SuggestTrackBuilder toBuilder() => SuggestTrackBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SuggestTrack &&
        source_ == other.source_ &&
        sourceId == other.sourceId &&
        deezerTrackId == other.deezerTrackId &&
        title == other.title &&
        artists == other.artists &&
        artistId == other.artistId &&
        album == other.album &&
        albumId == other.albumId &&
        durationMs == other.durationMs &&
        coverUrl == other.coverUrl;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, source_.hashCode);
    _$hash = $jc(_$hash, sourceId.hashCode);
    _$hash = $jc(_$hash, deezerTrackId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artists.hashCode);
    _$hash = $jc(_$hash, artistId.hashCode);
    _$hash = $jc(_$hash, album.hashCode);
    _$hash = $jc(_$hash, albumId.hashCode);
    _$hash = $jc(_$hash, durationMs.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SuggestTrack')
          ..add('source_', source_)
          ..add('sourceId', sourceId)
          ..add('deezerTrackId', deezerTrackId)
          ..add('title', title)
          ..add('artists', artists)
          ..add('artistId', artistId)
          ..add('album', album)
          ..add('albumId', albumId)
          ..add('durationMs', durationMs)
          ..add('coverUrl', coverUrl))
        .toString();
  }
}

class SuggestTrackBuilder
    implements Builder<SuggestTrack, SuggestTrackBuilder> {
  _$SuggestTrack? _$v;

  SuggestTrackSource_Enum? _source_;
  SuggestTrackSource_Enum? get source_ => _$this._source_;
  set source_(SuggestTrackSource_Enum? source_) => _$this._source_ = source_;

  String? _sourceId;
  String? get sourceId => _$this._sourceId;
  set sourceId(String? sourceId) => _$this._sourceId = sourceId;

  String? _deezerTrackId;
  String? get deezerTrackId => _$this._deezerTrackId;
  set deezerTrackId(String? deezerTrackId) =>
      _$this._deezerTrackId = deezerTrackId;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  ListBuilder<String>? _artists;
  ListBuilder<String> get artists => _$this._artists ??= ListBuilder<String>();
  set artists(ListBuilder<String>? artists) => _$this._artists = artists;

  String? _artistId;
  String? get artistId => _$this._artistId;
  set artistId(String? artistId) => _$this._artistId = artistId;

  String? _album;
  String? get album => _$this._album;
  set album(String? album) => _$this._album = album;

  String? _albumId;
  String? get albumId => _$this._albumId;
  set albumId(String? albumId) => _$this._albumId = albumId;

  int? _durationMs;
  int? get durationMs => _$this._durationMs;
  set durationMs(int? durationMs) => _$this._durationMs = durationMs;

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(String? coverUrl) => _$this._coverUrl = coverUrl;

  SuggestTrackBuilder() {
    SuggestTrack._defaults(this);
  }

  SuggestTrackBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _source_ = $v.source_;
      _sourceId = $v.sourceId;
      _deezerTrackId = $v.deezerTrackId;
      _title = $v.title;
      _artists = $v.artists.toBuilder();
      _artistId = $v.artistId;
      _album = $v.album;
      _albumId = $v.albumId;
      _durationMs = $v.durationMs;
      _coverUrl = $v.coverUrl;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SuggestTrack other) {
    _$v = other as _$SuggestTrack;
  }

  @override
  void update(void Function(SuggestTrackBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SuggestTrack build() => _build();

  _$SuggestTrack _build() {
    _$SuggestTrack _$result;
    try {
      _$result = _$v ??
          _$SuggestTrack._(
            source_: BuiltValueNullFieldError.checkNotNull(
                source_, r'SuggestTrack', 'source_'),
            sourceId: BuiltValueNullFieldError.checkNotNull(
                sourceId, r'SuggestTrack', 'sourceId'),
            deezerTrackId: BuiltValueNullFieldError.checkNotNull(
                deezerTrackId, r'SuggestTrack', 'deezerTrackId'),
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'SuggestTrack', 'title'),
            artists: artists.build(),
            artistId: artistId,
            album: BuiltValueNullFieldError.checkNotNull(
                album, r'SuggestTrack', 'album'),
            albumId: albumId,
            durationMs: BuiltValueNullFieldError.checkNotNull(
                durationMs, r'SuggestTrack', 'durationMs'),
            coverUrl: coverUrl,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'artists';
        artists.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SuggestTrack', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
