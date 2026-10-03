// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'saved_track_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SavedTrackEnvelope extends SavedTrackEnvelope {
  @override
  final bool success;
  @override
  final SavedTrackEnvelopeData data;

  factory _$SavedTrackEnvelope(
          [void Function(SavedTrackEnvelopeBuilder)? updates]) =>
      (SavedTrackEnvelopeBuilder()..update(updates))._build();

  _$SavedTrackEnvelope._({required this.success, required this.data})
      : super._();
  @override
  SavedTrackEnvelope rebuild(
          void Function(SavedTrackEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SavedTrackEnvelopeBuilder toBuilder() =>
      SavedTrackEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SavedTrackEnvelope &&
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
    return (newBuiltValueToStringHelper(r'SavedTrackEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SavedTrackEnvelopeBuilder
    implements Builder<SavedTrackEnvelope, SavedTrackEnvelopeBuilder> {
  _$SavedTrackEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SavedTrackEnvelopeDataBuilder? _data;
  SavedTrackEnvelopeDataBuilder get data =>
      _$this._data ??= SavedTrackEnvelopeDataBuilder();
  set data(SavedTrackEnvelopeDataBuilder? data) => _$this._data = data;

  SavedTrackEnvelopeBuilder() {
    SavedTrackEnvelope._defaults(this);
  }

  SavedTrackEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SavedTrackEnvelope other) {
    _$v = other as _$SavedTrackEnvelope;
  }

  @override
  void update(void Function(SavedTrackEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SavedTrackEnvelope build() => _build();

  _$SavedTrackEnvelope _build() {
    _$SavedTrackEnvelope _$result;
    try {
      _$result = _$v ??
          _$SavedTrackEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SavedTrackEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SavedTrackEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
