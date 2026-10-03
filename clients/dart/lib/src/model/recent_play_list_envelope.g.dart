// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recent_play_list_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RecentPlayListEnvelope extends RecentPlayListEnvelope {
  @override
  final bool success;
  @override
  final RecentPlayListEnvelopeData data;

  factory _$RecentPlayListEnvelope(
          [void Function(RecentPlayListEnvelopeBuilder)? updates]) =>
      (RecentPlayListEnvelopeBuilder()..update(updates))._build();

  _$RecentPlayListEnvelope._({required this.success, required this.data})
      : super._();
  @override
  RecentPlayListEnvelope rebuild(
          void Function(RecentPlayListEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RecentPlayListEnvelopeBuilder toBuilder() =>
      RecentPlayListEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RecentPlayListEnvelope &&
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
    return (newBuiltValueToStringHelper(r'RecentPlayListEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class RecentPlayListEnvelopeBuilder
    implements Builder<RecentPlayListEnvelope, RecentPlayListEnvelopeBuilder> {
  _$RecentPlayListEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  RecentPlayListEnvelopeDataBuilder? _data;
  RecentPlayListEnvelopeDataBuilder get data =>
      _$this._data ??= RecentPlayListEnvelopeDataBuilder();
  set data(RecentPlayListEnvelopeDataBuilder? data) => _$this._data = data;

  RecentPlayListEnvelopeBuilder() {
    RecentPlayListEnvelope._defaults(this);
  }

  RecentPlayListEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RecentPlayListEnvelope other) {
    _$v = other as _$RecentPlayListEnvelope;
  }

  @override
  void update(void Function(RecentPlayListEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RecentPlayListEnvelope build() => _build();

  _$RecentPlayListEnvelope _build() {
    _$RecentPlayListEnvelope _$result;
    try {
      _$result = _$v ??
          _$RecentPlayListEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'RecentPlayListEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'RecentPlayListEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
