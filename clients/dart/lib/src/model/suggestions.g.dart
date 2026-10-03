// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'suggestions.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SuggestionsSource_Enum _$suggestionsSourceEnum_deezer =
    const SuggestionsSource_Enum._('deezer');

SuggestionsSource_Enum _$suggestionsSourceEnumValueOf(String name) {
  switch (name) {
    case 'deezer':
      return _$suggestionsSourceEnum_deezer;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SuggestionsSource_Enum> _$suggestionsSourceEnumValues =
    BuiltSet<SuggestionsSource_Enum>(const <SuggestionsSource_Enum>[
  _$suggestionsSourceEnum_deezer,
]);

Serializer<SuggestionsSource_Enum> _$suggestionsSourceEnumSerializer =
    _$SuggestionsSource_EnumSerializer();

class _$SuggestionsSource_EnumSerializer
    implements PrimitiveSerializer<SuggestionsSource_Enum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'deezer': 'deezer',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'deezer': 'deezer',
  };

  @override
  final Iterable<Type> types = const <Type>[SuggestionsSource_Enum];
  @override
  final String wireName = 'SuggestionsSource_Enum';

  @override
  Object serialize(Serializers serializers, SuggestionsSource_Enum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SuggestionsSource_Enum deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SuggestionsSource_Enum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$Suggestions extends Suggestions {
  @override
  final BuiltList<SuggestTrack> tracks;
  @override
  final BuiltList<SuggestAlbum> albums;
  @override
  final BuiltList<SuggestArtist> artists;
  @override
  final SuggestionsSource_Enum source_;

  factory _$Suggestions([void Function(SuggestionsBuilder)? updates]) =>
      (SuggestionsBuilder()..update(updates))._build();

  _$Suggestions._(
      {required this.tracks,
      required this.albums,
      required this.artists,
      required this.source_})
      : super._();
  @override
  Suggestions rebuild(void Function(SuggestionsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SuggestionsBuilder toBuilder() => SuggestionsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is Suggestions &&
        tracks == other.tracks &&
        albums == other.albums &&
        artists == other.artists &&
        source_ == other.source_;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, tracks.hashCode);
    _$hash = $jc(_$hash, albums.hashCode);
    _$hash = $jc(_$hash, artists.hashCode);
    _$hash = $jc(_$hash, source_.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'Suggestions')
          ..add('tracks', tracks)
          ..add('albums', albums)
          ..add('artists', artists)
          ..add('source_', source_))
        .toString();
  }
}

class SuggestionsBuilder implements Builder<Suggestions, SuggestionsBuilder> {
  _$Suggestions? _$v;

  ListBuilder<SuggestTrack>? _tracks;
  ListBuilder<SuggestTrack> get tracks =>
      _$this._tracks ??= ListBuilder<SuggestTrack>();
  set tracks(ListBuilder<SuggestTrack>? tracks) => _$this._tracks = tracks;

  ListBuilder<SuggestAlbum>? _albums;
  ListBuilder<SuggestAlbum> get albums =>
      _$this._albums ??= ListBuilder<SuggestAlbum>();
  set albums(ListBuilder<SuggestAlbum>? albums) => _$this._albums = albums;

  ListBuilder<SuggestArtist>? _artists;
  ListBuilder<SuggestArtist> get artists =>
      _$this._artists ??= ListBuilder<SuggestArtist>();
  set artists(ListBuilder<SuggestArtist>? artists) => _$this._artists = artists;

  SuggestionsSource_Enum? _source_;
  SuggestionsSource_Enum? get source_ => _$this._source_;
  set source_(SuggestionsSource_Enum? source_) => _$this._source_ = source_;

  SuggestionsBuilder() {
    Suggestions._defaults(this);
  }

  SuggestionsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tracks = $v.tracks.toBuilder();
      _albums = $v.albums.toBuilder();
      _artists = $v.artists.toBuilder();
      _source_ = $v.source_;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(Suggestions other) {
    _$v = other as _$Suggestions;
  }

  @override
  void update(void Function(SuggestionsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  Suggestions build() => _build();

  _$Suggestions _build() {
    _$Suggestions _$result;
    try {
      _$result = _$v ??
          _$Suggestions._(
            tracks: tracks.build(),
            albums: albums.build(),
            artists: artists.build(),
            source_: BuiltValueNullFieldError.checkNotNull(
                source_, r'Suggestions', 'source_'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tracks';
        tracks.build();
        _$failedField = 'albums';
        albums.build();
        _$failedField = 'artists';
        artists.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'Suggestions', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
