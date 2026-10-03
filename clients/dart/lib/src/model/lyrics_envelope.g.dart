// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lyrics_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LyricsEnvelope extends LyricsEnvelope {
  @override
  final bool success;
  @override
  final Lyrics data;

  factory _$LyricsEnvelope([void Function(LyricsEnvelopeBuilder)? updates]) =>
      (LyricsEnvelopeBuilder()..update(updates))._build();

  _$LyricsEnvelope._({required this.success, required this.data}) : super._();
  @override
  LyricsEnvelope rebuild(void Function(LyricsEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LyricsEnvelopeBuilder toBuilder() => LyricsEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LyricsEnvelope &&
        success == other.success &&
        data == other.data;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, success.hashCode);
    _$hash = $jc(_$hash, data.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LyricsEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class LyricsEnvelopeBuilder
    implements Builder<LyricsEnvelope, LyricsEnvelopeBuilder> {
  _$LyricsEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  LyricsBuilder? _data;
  LyricsBuilder get data => _$this._data ??= LyricsBuilder();
  set data(LyricsBuilder? data) => _$this._data = data;

  LyricsEnvelopeBuilder() {
    LyricsEnvelope._defaults(this);
  }

  LyricsEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LyricsEnvelope other) {
    _$v = other as _$LyricsEnvelope;
  }

  @override
  void update(void Function(LyricsEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LyricsEnvelope build() => _build();

  _$LyricsEnvelope _build() {
    _$LyricsEnvelope _$result;
    try {
      _$result = _$v ??
          _$LyricsEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'LyricsEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'LyricsEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
