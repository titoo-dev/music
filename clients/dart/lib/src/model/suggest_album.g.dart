// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'suggest_album.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SuggestAlbumSource_Enum _$suggestAlbumSourceEnum_deezer =
    const SuggestAlbumSource_Enum._('deezer');

SuggestAlbumSource_Enum _$suggestAlbumSourceEnumValueOf(String name) {
  switch (name) {
    case 'deezer':
      return _$suggestAlbumSourceEnum_deezer;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SuggestAlbumSource_Enum> _$suggestAlbumSourceEnumValues =
    BuiltSet<SuggestAlbumSource_Enum>(const <SuggestAlbumSource_Enum>[
  _$suggestAlbumSourceEnum_deezer,
]);

Serializer<SuggestAlbumSource_Enum> _$suggestAlbumSourceEnumSerializer =
    _$SuggestAlbumSource_EnumSerializer();

class _$SuggestAlbumSource_EnumSerializer
    implements PrimitiveSerializer<SuggestAlbumSource_Enum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'deezer': 'deezer',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'deezer': 'deezer',
  };

  @override
  final Iterable<Type> types = const <Type>[SuggestAlbumSource_Enum];
  @override
  final String wireName = 'SuggestAlbumSource_Enum';

  @override
  Object serialize(Serializers serializers, SuggestAlbumSource_Enum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SuggestAlbumSource_Enum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SuggestAlbumSource_Enum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$SuggestAlbum extends SuggestAlbum {
  @override
  final SuggestAlbumSource_Enum source_;
  @override
  final String sourceId;
  @override
  final String deezerAlbumId;
  @override
  final String title;
  @override
  final BuiltList<String> artists;
  @override
  final String? coverUrl;

  factory _$SuggestAlbum([void Function(SuggestAlbumBuilder)? updates]) =>
      (SuggestAlbumBuilder()..update(updates))._build();

  _$SuggestAlbum._(
      {required this.source_,
      required this.sourceId,
      required this.deezerAlbumId,
      required this.title,
      required this.artists,
      this.coverUrl})
      : super._();
  @override
  SuggestAlbum rebuild(void Function(SuggestAlbumBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SuggestAlbumBuilder toBuilder() => SuggestAlbumBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SuggestAlbum &&
        source_ == other.source_ &&
        sourceId == other.sourceId &&
        deezerAlbumId == other.deezerAlbumId &&
        title == other.title &&
        artists == other.artists &&
        coverUrl == other.coverUrl;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, source_.hashCode);
    _$hash = $jc(_$hash, sourceId.hashCode);
    _$hash = $jc(_$hash, deezerAlbumId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, artists.hashCode);
    _$hash = $jc(_$hash, coverUrl.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SuggestAlbum')
          ..add('source_', source_)
          ..add('sourceId', sourceId)
          ..add('deezerAlbumId', deezerAlbumId)
          ..add('title', title)
          ..add('artists', artists)
          ..add('coverUrl', coverUrl))
        .toString();
  }
}

class SuggestAlbumBuilder
    implements Builder<SuggestAlbum, SuggestAlbumBuilder> {
  _$SuggestAlbum? _$v;

  SuggestAlbumSource_Enum? _source_;
  SuggestAlbumSource_Enum? get source_ => _$this._source_;
  set source_(SuggestAlbumSource_Enum? source_) => _$this._source_ = source_;

  String? _sourceId;
  String? get sourceId => _$this._sourceId;
  set sourceId(String? sourceId) => _$this._sourceId = sourceId;

  String? _deezerAlbumId;
  String? get deezerAlbumId => _$this._deezerAlbumId;
  set deezerAlbumId(String? deezerAlbumId) =>
      _$this._deezerAlbumId = deezerAlbumId;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  ListBuilder<String>? _artists;
  ListBuilder<String> get artists => _$this._artists ??= ListBuilder<String>();
  set artists(ListBuilder<String>? artists) => _$this._artists = artists;

  String? _coverUrl;
  String? get coverUrl => _$this._coverUrl;
  set coverUrl(String? coverUrl) => _$this._coverUrl = coverUrl;

  SuggestAlbumBuilder() {
    SuggestAlbum._defaults(this);
  }

  SuggestAlbumBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _source_ = $v.source_;
      _sourceId = $v.sourceId;
      _deezerAlbumId = $v.deezerAlbumId;
      _title = $v.title;
      _artists = $v.artists.toBuilder();
      _coverUrl = $v.coverUrl;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SuggestAlbum other) {
    _$v = other as _$SuggestAlbum;
  }

  @override
  void update(void Function(SuggestAlbumBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SuggestAlbum build() => _build();

  _$SuggestAlbum _build() {
    _$SuggestAlbum _$result;
    try {
      _$result = _$v ??
          _$SuggestAlbum._(
            source_: BuiltValueNullFieldError.checkNotNull(
                source_, r'SuggestAlbum', 'source_'),
            sourceId: BuiltValueNullFieldError.checkNotNull(
                sourceId, r'SuggestAlbum', 'sourceId'),
            deezerAlbumId: BuiltValueNullFieldError.checkNotNull(
                deezerAlbumId, r'SuggestAlbum', 'deezerAlbumId'),
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'SuggestAlbum', 'title'),
            artists: artists.build(),
            coverUrl: coverUrl,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'artists';
        artists.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SuggestAlbum', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
