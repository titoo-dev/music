// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'unfollowed_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UnfollowedEnvelope extends UnfollowedEnvelope {
  @override
  final bool success;
  @override
  final UnfollowedEnvelopeData data;

  factory _$UnfollowedEnvelope(
          [void Function(UnfollowedEnvelopeBuilder)? updates]) =>
      (UnfollowedEnvelopeBuilder()..update(updates))._build();

  _$UnfollowedEnvelope._({required this.success, required this.data})
      : super._();
  @override
  UnfollowedEnvelope rebuild(
          void Function(UnfollowedEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UnfollowedEnvelopeBuilder toBuilder() =>
      UnfollowedEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UnfollowedEnvelope &&
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
    return (newBuiltValueToStringHelper(r'UnfollowedEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class UnfollowedEnvelopeBuilder
    implements Builder<UnfollowedEnvelope, UnfollowedEnvelopeBuilder> {
  _$UnfollowedEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  UnfollowedEnvelopeDataBuilder? _data;
  UnfollowedEnvelopeDataBuilder get data =>
      _$this._data ??= UnfollowedEnvelopeDataBuilder();
  set data(UnfollowedEnvelopeDataBuilder? data) => _$this._data = data;

  UnfollowedEnvelopeBuilder() {
    UnfollowedEnvelope._defaults(this);
  }

  UnfollowedEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UnfollowedEnvelope other) {
    _$v = other as _$UnfollowedEnvelope;
  }

  @override
  void update(void Function(UnfollowedEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UnfollowedEnvelope build() => _build();

  _$UnfollowedEnvelope _build() {
    _$UnfollowedEnvelope _$result;
    try {
      _$result = _$v ??
          _$UnfollowedEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'UnfollowedEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'UnfollowedEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
