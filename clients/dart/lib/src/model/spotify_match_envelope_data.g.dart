// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_match_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SpotifyMatchEnvelopeData extends SpotifyMatchEnvelopeData {
  @override
  final BuiltList<SpotifyMatchResult> results;

  factory _$SpotifyMatchEnvelopeData(
          [void Function(SpotifyMatchEnvelopeDataBuilder)? updates]) =>
      (SpotifyMatchEnvelopeDataBuilder()..update(updates))._build();

  _$SpotifyMatchEnvelopeData._({required this.results}) : super._();
  @override
  SpotifyMatchEnvelopeData rebuild(
          void Function(SpotifyMatchEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifyMatchEnvelopeDataBuilder toBuilder() =>
      SpotifyMatchEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifyMatchEnvelopeData && results == other.results;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, results.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SpotifyMatchEnvelopeData')
          ..add('results', results))
        .toString();
  }
}

class SpotifyMatchEnvelopeDataBuilder
    implements
        Builder<SpotifyMatchEnvelopeData, SpotifyMatchEnvelopeDataBuilder> {
  _$SpotifyMatchEnvelopeData? _$v;

  ListBuilder<SpotifyMatchResult>? _results;
  ListBuilder<SpotifyMatchResult> get results =>
      _$this._results ??= ListBuilder<SpotifyMatchResult>();
  set results(ListBuilder<SpotifyMatchResult>? results) =>
      _$this._results = results;

  SpotifyMatchEnvelopeDataBuilder() {
    SpotifyMatchEnvelopeData._defaults(this);
  }

  SpotifyMatchEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _results = $v.results.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifyMatchEnvelopeData other) {
    _$v = other as _$SpotifyMatchEnvelopeData;
  }

  @override
  void update(void Function(SpotifyMatchEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifyMatchEnvelopeData build() => _build();

  _$SpotifyMatchEnvelopeData _build() {
    _$SpotifyMatchEnvelopeData _$result;
    try {
      _$result = _$v ??
          _$SpotifyMatchEnvelopeData._(
            results: results.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'results';
        results.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SpotifyMatchEnvelopeData', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
