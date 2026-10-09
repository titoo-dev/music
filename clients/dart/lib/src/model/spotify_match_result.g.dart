// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_match_result.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SpotifyMatchResultStatusEnum _$spotifyMatchResultStatusEnum_matched =
    const SpotifyMatchResultStatusEnum._('matched');
const SpotifyMatchResultStatusEnum _$spotifyMatchResultStatusEnum_notFound =
    const SpotifyMatchResultStatusEnum._('notFound');

SpotifyMatchResultStatusEnum _$spotifyMatchResultStatusEnumValueOf(
    String name) {
  switch (name) {
    case 'matched':
      return _$spotifyMatchResultStatusEnum_matched;
    case 'notFound':
      return _$spotifyMatchResultStatusEnum_notFound;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SpotifyMatchResultStatusEnum>
    _$spotifyMatchResultStatusEnumValues =
    BuiltSet<SpotifyMatchResultStatusEnum>(const <SpotifyMatchResultStatusEnum>[
  _$spotifyMatchResultStatusEnum_matched,
  _$spotifyMatchResultStatusEnum_notFound,
]);

const SpotifyMatchResultStrategyEnum _$spotifyMatchResultStrategyEnum_isrc =
    const SpotifyMatchResultStrategyEnum._('isrc');
const SpotifyMatchResultStrategyEnum _$spotifyMatchResultStrategyEnum_advanced =
    const SpotifyMatchResultStrategyEnum._('advanced');
const SpotifyMatchResultStrategyEnum
    _$spotifyMatchResultStrategyEnum_advancedClean =
    const SpotifyMatchResultStrategyEnum._('advancedClean');
const SpotifyMatchResultStrategyEnum _$spotifyMatchResultStrategyEnum_fuzzy =
    const SpotifyMatchResultStrategyEnum._('fuzzy');

SpotifyMatchResultStrategyEnum _$spotifyMatchResultStrategyEnumValueOf(
    String name) {
  switch (name) {
    case 'isrc':
      return _$spotifyMatchResultStrategyEnum_isrc;
    case 'advanced':
      return _$spotifyMatchResultStrategyEnum_advanced;
    case 'advancedClean':
      return _$spotifyMatchResultStrategyEnum_advancedClean;
    case 'fuzzy':
      return _$spotifyMatchResultStrategyEnum_fuzzy;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SpotifyMatchResultStrategyEnum>
    _$spotifyMatchResultStrategyEnumValues = BuiltSet<
        SpotifyMatchResultStrategyEnum>(const <SpotifyMatchResultStrategyEnum>[
  _$spotifyMatchResultStrategyEnum_isrc,
  _$spotifyMatchResultStrategyEnum_advanced,
  _$spotifyMatchResultStrategyEnum_advancedClean,
  _$spotifyMatchResultStrategyEnum_fuzzy,
]);

Serializer<SpotifyMatchResultStatusEnum>
    _$spotifyMatchResultStatusEnumSerializer =
    _$SpotifyMatchResultStatusEnumSerializer();
Serializer<SpotifyMatchResultStrategyEnum>
    _$spotifyMatchResultStrategyEnumSerializer =
    _$SpotifyMatchResultStrategyEnumSerializer();

class _$SpotifyMatchResultStatusEnumSerializer
    implements PrimitiveSerializer<SpotifyMatchResultStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'matched': 'matched',
    'notFound': 'not_found',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'matched': 'matched',
    'not_found': 'notFound',
  };

  @override
  final Iterable<Type> types = const <Type>[SpotifyMatchResultStatusEnum];
  @override
  final String wireName = 'SpotifyMatchResultStatusEnum';

  @override
  Object serialize(Serializers serializers, SpotifyMatchResultStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SpotifyMatchResultStatusEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SpotifyMatchResultStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$SpotifyMatchResultStrategyEnumSerializer
    implements PrimitiveSerializer<SpotifyMatchResultStrategyEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'isrc': 'isrc',
    'advanced': 'advanced',
    'advancedClean': 'advanced-clean',
    'fuzzy': 'fuzzy',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'isrc': 'isrc',
    'advanced': 'advanced',
    'advanced-clean': 'advancedClean',
    'fuzzy': 'fuzzy',
  };

  @override
  final Iterable<Type> types = const <Type>[SpotifyMatchResultStrategyEnum];
  @override
  final String wireName = 'SpotifyMatchResultStrategyEnum';

  @override
  Object serialize(
          Serializers serializers, SpotifyMatchResultStrategyEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SpotifyMatchResultStrategyEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SpotifyMatchResultStrategyEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$SpotifyMatchResult extends SpotifyMatchResult {
  @override
  final SpotifyMatchResultStatusEnum status;
  @override
  final SpotifyMatchResultStrategyEnum? strategy;
  @override
  final num? confidence;
  @override
  final String? deezerTrackId;
  @override
  final String? title;
  @override
  final String? artist;
  @override
  final String? album;
  @override
  final String? albumId;
  @override
  final String? coverUrl;
  @override
  final int? duration;
  @override
  final String? reason;

  factory _$SpotifyMatchResult(
          [void Function(SpotifyMatchResultBuilder)? updates]) =>
      (SpotifyMatchResultBuilder()..update(updates))._build();

  _$SpotifyMatchResult._(
      {required this.status,
      this.strategy,
      this.confidence,
      this.deezerTrackId,
      this.title,
      this.artist,
      this.album,
      this.albumId,
      this.coverUrl,
      this.duration,
      this.reason})
      : super._();
  @override
  SpotifyMatchResult rebuild(
          void Function(SpotifyMatchResultBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifyMatchResultBuilder toBuilder() =>
      SpotifyMatchResultBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifyMatchResult &&
        status == other.status &&
        strategy == other.strategy &&
        confidence == other.confidence &&
        deezerTrackId == other.deezerTrackId &&
        title == other.title &&
        artist == other.artist &&
        album == other.album &&
        albumId == other.albumId &&
        coverUrl == other.coverUrl &&
        duration == other.duration &&
        reason == other.reason;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, strategy.hashCode);
    _$hash = $jc(_$hash, confidence.hashCode);
    _$hash = $jc(_$hash, deezerTrackId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artist.hashCode);
    _$hash = $jc(_$hash, album.hashCode);
    _$hash = $jc(_$hash, albumId.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jc(_$hash, duration.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SpotifyMatchResult')
          ..add('status', status)
          ..add('strategy', strategy)
          ..add('confidence', confidence)
          ..add('deezerTrackId', deezerTrackId)
          ..add('title', title)
          ..add('artist', artist)
          ..add('album', album)
          ..add('albumId', albumId)
          ..add('coverUrl', coverUrl)
          ..add('duration', duration)
          ..add('reason', reason))
        .toString();
  }
}

class SpotifyMatchResultBuilder
    implements Builder<SpotifyMatchResult, SpotifyMatchResultBuilder> {
  _$SpotifyMatchResult? _$v;

  SpotifyMatchResultStatusEnum? _status;
  SpotifyMatchResultStatusEnum? get status => _$this._status;
  set status(SpotifyMatchResultStatusEnum? status) => _$this._status = status;

  SpotifyMatchResultStrategyEnum? _strategy;
  SpotifyMatchResultStrategyEnum? get strategy => _$this._strategy;
  set strategy(SpotifyMatchResultStrategyEnum? strategy) =>
      _$this._strategy = strategy;

  num? _confidence;
  num? get confidence => _$this._confidence;
  set confidence(num? confidence) => _$this._confidence = confidence;

  String? _deezerTrackId;
  String? get deezerTrackId => _$this._deezerTrackId;
  set deezerTrackId(String? deezerTrackId) =>
      _$this._deezerTrackId = deezerTrackId;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _artist;
  String? get artist => _$this._artist;
  set artist(String? artist) => _$this._artist = artist;

  String? _album;
  String? get album => _$this._album;
  set album(String? album) => _$this._album = album;

  String? _albumId;
  String? get albumId => _$this._albumId;
  set albumId(String? albumId) => _$this._albumId = albumId;

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(String? coverUrl) => _$this._coverUrl = coverUrl;

  int? _duration;
  int? get duration => _$this._duration;
  set duration(int? duration) => _$this._duration = duration;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  SpotifyMatchResultBuilder() {
    SpotifyMatchResult._defaults(this);
  }

  SpotifyMatchResultBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _status = $v.status;
      _strategy = $v.strategy;
      _confidence = $v.confidence;
      _deezerTrackId = $v.deezerTrackId;
      _title = $v.title;
      _artist = $v.artist;
      _album = $v.album;
      _albumId = $v.albumId;
      _coverUrl = $v.coverUrl;
      _duration = $v.duration;
      _reason = $v.reason;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifyMatchResult other) {
    _$v = other as _$SpotifyMatchResult;
  }

  @override
  void update(void Function(SpotifyMatchResultBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifyMatchResult build() => _build();

  _$SpotifyMatchResult _build() {
    final _$result = _$v ??
        _$SpotifyMatchResult._(
          status: BuiltValueNullFieldError.checkNotNull(
              status, r'SpotifyMatchResult', 'status'),
          strategy: strategy,
          confidence: confidence,
          deezerTrackId: deezerTrackId,
          title: title,
          artist: artist,
          album: album,
          albumId: albumId,
          coverUrl: coverUrl,
          duration: duration,
          reason: reason,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
