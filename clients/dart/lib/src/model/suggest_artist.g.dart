// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'suggest_artist.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SuggestArtistSource_Enum _$suggestArtistSourceEnum_deezer =
    const SuggestArtistSource_Enum._('deezer');

SuggestArtistSource_Enum _$suggestArtistSourceEnumValueOf(String name) {
  switch (name) {
    case 'deezer':
      return _$suggestArtistSourceEnum_deezer;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SuggestArtistSource_Enum> _$suggestArtistSourceEnumValues =
    BuiltSet<SuggestArtistSource_Enum>(const <SuggestArtistSource_Enum>[
  _$suggestArtistSourceEnum_deezer,
]);

Serializer<SuggestArtistSource_Enum> _$suggestArtistSourceEnumSerializer =
    _$SuggestArtistSource_EnumSerializer();

class _$SuggestArtistSource_EnumSerializer
    implements PrimitiveSerializer<SuggestArtistSource_Enum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'deezer': 'deezer',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'deezer': 'deezer',
  };

  @override
  final Iterable<Type> types = const <Type>[SuggestArtistSource_Enum];
  @override
  final String wireName = 'SuggestArtistSource_Enum';

  @override
  Object serialize(Serializers serializers, SuggestArtistSource_Enum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SuggestArtistSource_Enum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SuggestArtistSource_Enum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$SuggestArtist extends SuggestArtist {
  @override
  final SuggestArtistSource_Enum source_;
  @override
  final String sourceId;
  @override
  final String deezerArtistId;
  @override
  final String name;
  @override
  final String? imageUrl;

  factory _$SuggestArtist([void Function(SuggestArtistBuilder)? updates]) =>
      (SuggestArtistBuilder()..update(updates))._build();

  _$SuggestArtist._(
      {required this.source_,
      required this.sourceId,
      required this.deezerArtistId,
      required this.name,
      this.imageUrl})
      : super._();
  @override
  SuggestArtist rebuild(void Function(SuggestArtistBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SuggestArtistBuilder toBuilder() => SuggestArtistBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SuggestArtist &&
        source_ == other.source_ &&
        sourceId == other.sourceId &&
        deezerArtistId == other.deezerArtistId &&
        name == other.name &&
        imageUrl == other.imageUrl;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, source_.hashCode);
    _$hash = $jc(_$hash, sourceId.hashCode);
    _$hash = $jc(_$hash, deezerArtistId.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, imageUrl.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SuggestArtist')
          ..add('source_', source_)
          ..add('sourceId', sourceId)
          ..add('deezerArtistId', deezerArtistId)
          ..add('name', name)
          ..add('imageUrl', imageUrl))
        .toString();
  }
}

class SuggestArtistBuilder
    implements Builder<SuggestArtist, SuggestArtistBuilder> {
  _$SuggestArtist? _$v;

  SuggestArtistSource_Enum? _source_;
  SuggestArtistSource_Enum? get source_ => _$this._source_;
  set source_(SuggestArtistSource_Enum? source_) => _$this._source_ = source_;

  String? _sourceId;
  String? get sourceId => _$this._sourceId;
  set sourceId(String? sourceId) => _$this._sourceId = sourceId;

  String? _deezerArtistId;
  String? get deezerArtistId => _$this._deezerArtistId;
  set deezerArtistId(String? deezerArtistId) =>
      _$this._deezerArtistId = deezerArtistId;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _imageUrl;
  String? get imageUrl => _$this._imageUrl;
  set imageUrl(String? imageUrl) => _$this._imageUrl = imageUrl;

  SuggestArtistBuilder() {
    SuggestArtist._defaults(this);
  }

  SuggestArtistBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _source_ = $v.source_;
      _sourceId = $v.sourceId;
      _deezerArtistId = $v.deezerArtistId;
      _name = $v.name;
      _imageUrl = $v.imageUrl;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SuggestArtist other) {
    _$v = other as _$SuggestArtist;
  }

  @override
  void update(void Function(SuggestArtistBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SuggestArtist build() => _build();

  _$SuggestArtist _build() {
    final _$result = _$v ??
        _$SuggestArtist._(
          source_: BuiltValueNullFieldError.checkNotNull(
              source_, r'SuggestArtist', 'source_'),
          sourceId: BuiltValueNullFieldError.checkNotNull(
              sourceId, r'SuggestArtist', 'sourceId'),
          deezerArtistId: BuiltValueNullFieldError.checkNotNull(
              deezerArtistId, r'SuggestArtist', 'deezerArtistId'),
          name: BuiltValueNullFieldError.checkNotNull(
              name, r'SuggestArtist', 'name'),
          imageUrl: imageUrl,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
