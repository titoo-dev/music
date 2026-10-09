// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_save_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SpotifySaveEnvelopeData extends SpotifySaveEnvelopeData {
  @override
  final Playlist playlist;

  factory _$SpotifySaveEnvelopeData(
          [void Function(SpotifySaveEnvelopeDataBuilder)? updates]) =>
      (SpotifySaveEnvelopeDataBuilder()..update(updates))._build();

  _$SpotifySaveEnvelopeData._({required this.playlist}) : super._();
  @override
  SpotifySaveEnvelopeData rebuild(
          void Function(SpotifySaveEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifySaveEnvelopeDataBuilder toBuilder() =>
      SpotifySaveEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifySaveEnvelopeData && playlist == other.playlist;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, playlist.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SpotifySaveEnvelopeData')
          ..add('playlist', playlist))
        .toString();
  }
}

class SpotifySaveEnvelopeDataBuilder
    implements
        Builder<SpotifySaveEnvelopeData, SpotifySaveEnvelopeDataBuilder> {
  _$SpotifySaveEnvelopeData? _$v;

  Playlist? _playlist;
  Playlist? get playlist => _$this._playlist;
  set playlist(Playlist? playlist) => _$this._playlist = playlist;

  SpotifySaveEnvelopeDataBuilder() {
    SpotifySaveEnvelopeData._defaults(this);
  }

  SpotifySaveEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _playlist = $v.playlist;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifySaveEnvelopeData other) {
    _$v = other as _$SpotifySaveEnvelopeData;
  }

  @override
  void update(void Function(SpotifySaveEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifySaveEnvelopeData build() => _build();

  _$SpotifySaveEnvelopeData _build() {
    final _$result = _$v ??
        _$SpotifySaveEnvelopeData._(
          playlist: BuiltValueNullFieldError.checkNotNull(
              playlist, r'SpotifySaveEnvelopeData', 'playlist'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
