// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'saved_flag_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SavedFlagEnvelope extends SavedFlagEnvelope {
  @override
  final bool success;
  @override
  final SavedFlagEnvelopeData data;

  factory _$SavedFlagEnvelope(
          [void Function(SavedFlagEnvelopeBuilder)? updates]) =>
      (SavedFlagEnvelopeBuilder()..update(updates))._build();

  _$SavedFlagEnvelope._({required this.success, required this.data})
      : super._();
  @override
  SavedFlagEnvelope rebuild(void Function(SavedFlagEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SavedFlagEnvelopeBuilder toBuilder() =>
      SavedFlagEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SavedFlagEnvelope &&
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
    return (newBuiltValueToStringHelper(r'SavedFlagEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SavedFlagEnvelopeBuilder
    implements Builder<SavedFlagEnvelope, SavedFlagEnvelopeBuilder> {
  _$SavedFlagEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SavedFlagEnvelopeDataBuilder? _data;
  SavedFlagEnvelopeDataBuilder get data =>
      _$this._data ??= SavedFlagEnvelopeDataBuilder();
  set data(SavedFlagEnvelopeDataBuilder? data) => _$this._data = data;

  SavedFlagEnvelopeBuilder() {
    SavedFlagEnvelope._defaults(this);
  }

  SavedFlagEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SavedFlagEnvelope other) {
    _$v = other as _$SavedFlagEnvelope;
  }

  @override
  void update(void Function(SavedFlagEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SavedFlagEnvelope build() => _build();

  _$SavedFlagEnvelope _build() {
    _$SavedFlagEnvelope _$result;
    try {
      _$result = _$v ??
          _$SavedFlagEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SavedFlagEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SavedFlagEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
