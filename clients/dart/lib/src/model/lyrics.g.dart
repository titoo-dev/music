// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lyrics.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const LyricsSource_Enum _$lyricsSourceEnum_lrclib =
    const LyricsSource_Enum._('lrclib');
const LyricsSource_Enum _$lyricsSourceEnum_deezer =
    const LyricsSource_Enum._('deezer');

LyricsSource_Enum _$lyricsSourceEnumValueOf(String name) {
  switch (name) {
    case 'lrclib':
      return _$lyricsSourceEnum_lrclib;
    case 'deezer':
      return _$lyricsSourceEnum_deezer;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<LyricsSource_Enum> _$lyricsSourceEnumValues =
    BuiltSet<LyricsSource_Enum>(const <LyricsSource_Enum>[
  _$lyricsSourceEnum_lrclib,
  _$lyricsSourceEnum_deezer,
]);

Serializer<LyricsSource_Enum> _$lyricsSourceEnumSerializer =
    _$LyricsSource_EnumSerializer();

class _$LyricsSource_EnumSerializer
    implements PrimitiveSerializer<LyricsSource_Enum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'lrclib': 'lrclib',
    'deezer': 'deezer',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'lrclib': 'lrclib',
    'deezer': 'deezer',
  };

  @override
  final Iterable<Type> types = const <Type>[LyricsSource_Enum];
  @override
  final String wireName = 'LyricsSource_Enum';

  @override
  Object serialize(Serializers serializers, LyricsSource_Enum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  LyricsSource_Enum deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      LyricsSource_Enum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$Lyrics extends Lyrics {
  @override
  final LyricsSource_Enum? source_;
  @override
  final String? syncedLyrics;
  @override
  final String? plainLyrics;
  @override
  final bool instrumental;

  factory _$Lyrics([void Function(LyricsBuilder)? updates]) =>
      (LyricsBuilder()..update(updates))._build();

  _$Lyrics._(
      {this.source_,
      this.syncedLyrics,
      this.plainLyrics,
      required this.instrumental})
      : super._();
  @override
  Lyrics rebuild(void Function(LyricsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LyricsBuilder toBuilder() => LyricsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is Lyrics &&
        source_ == other.source_ &&
        syncedLyrics == other.syncedLyrics &&
        plainLyrics == other.plainLyrics &&
        instrumental == other.instrumental;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, source_.hashCode);
    _$hash = $jc(_$hash, syncedLyrics.hashCode);
    _$hash = $jc(_$hash, plainLyrics.hashCode);
    _$hash = $jc(_$hash, instrumental.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'Lyrics')
          ..add('source_', source_)
          ..add('syncedLyrics', syncedLyrics)
          ..add('plainLyrics', plainLyrics)
          ..add('instrumental', instrumental))
        .toString();
  }
}

class LyricsBuilder implements Builder<Lyrics, LyricsBuilder> {
  _$Lyrics? _$v;

  LyricsSource_Enum? _source_;
  LyricsSource_Enum? get source_ => _$this._source_;
  set source_(LyricsSource_Enum? source_) => _$this._source_ = source_;

  String? _syncedLyrics;
  String? get syncedLyrics => _$this._syncedLyrics;
  set syncedLyrics(String? syncedLyrics) => _$this._syncedLyrics = syncedLyrics;

  String? _plainLyrics;
  String? get plainLyrics => _$this._plainLyrics;
  set plainLyrics(String? plainLyrics) => _$this._plainLyrics = plainLyrics;

  bool? _instrumental;
  bool? get instrumental => _$this._instrumental;
  set instrumental(bool? instrumental) => _$this._instrumental = instrumental;

  LyricsBuilder() {
    Lyrics._defaults(this);
  }

  LyricsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _source_ = $v.source_;
      _syncedLyrics = $v.syncedLyrics;
      _plainLyrics = $v.plainLyrics;
      _instrumental = $v.instrumental;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(Lyrics other) {
    _$v = other as _$Lyrics;
  }

  @override
  void update(void Function(LyricsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  Lyrics build() => _build();

  _$Lyrics _build() {
    final _$result = _$v ??
        _$Lyrics._(
          source_: source_,
          syncedLyrics: syncedLyrics,
          plainLyrics: plainLyrics,
          instrumental: BuiltValueNullFieldError.checkNotNull(
              instrumental, r'Lyrics', 'instrumental'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
