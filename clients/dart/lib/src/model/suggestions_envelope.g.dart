// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'suggestions_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SuggestionsEnvelope extends SuggestionsEnvelope {
  @override
  final bool success;
  @override
  final Suggestions data;

  factory _$SuggestionsEnvelope(
          [void Function(SuggestionsEnvelopeBuilder)? updates]) =>
      (SuggestionsEnvelopeBuilder()..update(updates))._build();

  _$SuggestionsEnvelope._({required this.success, required this.data})
      : super._();
  @override
  SuggestionsEnvelope rebuild(
          void Function(SuggestionsEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SuggestionsEnvelopeBuilder toBuilder() =>
      SuggestionsEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SuggestionsEnvelope &&
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
    return (newBuiltValueToStringHelper(r'SuggestionsEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SuggestionsEnvelopeBuilder
    implements Builder<SuggestionsEnvelope, SuggestionsEnvelopeBuilder> {
  _$SuggestionsEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SuggestionsBuilder? _data;
  SuggestionsBuilder get data => _$this._data ??= SuggestionsBuilder();
  set data(SuggestionsBuilder? data) => _$this._data = data;

  SuggestionsEnvelopeBuilder() {
    SuggestionsEnvelope._defaults(this);
  }

  SuggestionsEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SuggestionsEnvelope other) {
    _$v = other as _$SuggestionsEnvelope;
  }

  @override
  void update(void Function(SuggestionsEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SuggestionsEnvelope build() => _build();

  _$SuggestionsEnvelope _build() {
    _$SuggestionsEnvelope _$result;
    try {
      _$result = _$v ??
          _$SuggestionsEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SuggestionsEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SuggestionsEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
