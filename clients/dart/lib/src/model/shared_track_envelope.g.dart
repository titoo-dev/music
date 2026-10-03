// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shared_track_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SharedTrackEnvelope extends SharedTrackEnvelope {
  @override
  final bool success;
  @override
  final SharedTrack data;

  factory _$SharedTrackEnvelope(
          [void Function(SharedTrackEnvelopeBuilder)? updates]) =>
      (SharedTrackEnvelopeBuilder()..update(updates))._build();

  _$SharedTrackEnvelope._({required this.success, required this.data})
      : super._();
  @override
  SharedTrackEnvelope rebuild(
          void Function(SharedTrackEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SharedTrackEnvelopeBuilder toBuilder() =>
      SharedTrackEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SharedTrackEnvelope &&
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
    return (newBuiltValueToStringHelper(r'SharedTrackEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SharedTrackEnvelopeBuilder
    implements Builder<SharedTrackEnvelope, SharedTrackEnvelopeBuilder> {
  _$SharedTrackEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SharedTrackBuilder? _data;
  SharedTrackBuilder get data => _$this._data ??= SharedTrackBuilder();
  set data(SharedTrackBuilder? data) => _$this._data = data;

  SharedTrackEnvelopeBuilder() {
    SharedTrackEnvelope._defaults(this);
  }

  SharedTrackEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SharedTrackEnvelope other) {
    _$v = other as _$SharedTrackEnvelope;
  }

  @override
  void update(void Function(SharedTrackEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SharedTrackEnvelope build() => _build();

  _$SharedTrackEnvelope _build() {
    _$SharedTrackEnvelope _$result;
    try {
      _$result = _$v ??
          _$SharedTrackEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SharedTrackEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SharedTrackEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
