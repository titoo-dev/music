// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'saved_track_list_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SavedTrackListEnvelope extends SavedTrackListEnvelope {
  @override
  final bool success;
  @override
  final SavedTrackListEnvelopeData data;

  factory _$SavedTrackListEnvelope(
          [void Function(SavedTrackListEnvelopeBuilder)? updates]) =>
      (SavedTrackListEnvelopeBuilder()..update(updates))._build();

  _$SavedTrackListEnvelope._({required this.success, required this.data})
      : super._();
  @override
  SavedTrackListEnvelope rebuild(
          void Function(SavedTrackListEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SavedTrackListEnvelopeBuilder toBuilder() =>
      SavedTrackListEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SavedTrackListEnvelope &&
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
    return (newBuiltValueToStringHelper(r'SavedTrackListEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SavedTrackListEnvelopeBuilder
    implements Builder<SavedTrackListEnvelope, SavedTrackListEnvelopeBuilder> {
  _$SavedTrackListEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SavedTrackListEnvelopeDataBuilder? _data;
  SavedTrackListEnvelopeDataBuilder get data =>
      _$this._data ??= SavedTrackListEnvelopeDataBuilder();
  set data(SavedTrackListEnvelopeDataBuilder? data) => _$this._data = data;

  SavedTrackListEnvelopeBuilder() {
    SavedTrackListEnvelope._defaults(this);
  }

  SavedTrackListEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SavedTrackListEnvelope other) {
    _$v = other as _$SavedTrackListEnvelope;
  }

  @override
  void update(void Function(SavedTrackListEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SavedTrackListEnvelope build() => _build();

  _$SavedTrackListEnvelope _build() {
    _$SavedTrackListEnvelope _$result;
    try {
      _$result = _$v ??
          _$SavedTrackListEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SavedTrackListEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SavedTrackListEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
