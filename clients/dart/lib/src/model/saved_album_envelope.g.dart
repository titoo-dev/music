// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'saved_album_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SavedAlbumEnvelope extends SavedAlbumEnvelope {
  @override
  final bool success;
  @override
  final SavedAlbumEnvelopeData data;

  factory _$SavedAlbumEnvelope(
          [void Function(SavedAlbumEnvelopeBuilder)? updates]) =>
      (SavedAlbumEnvelopeBuilder()..update(updates))._build();

  _$SavedAlbumEnvelope._({required this.success, required this.data})
      : super._();
  @override
  SavedAlbumEnvelope rebuild(
          void Function(SavedAlbumEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SavedAlbumEnvelopeBuilder toBuilder() =>
      SavedAlbumEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SavedAlbumEnvelope &&
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
    return (newBuiltValueToStringHelper(r'SavedAlbumEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SavedAlbumEnvelopeBuilder
    implements Builder<SavedAlbumEnvelope, SavedAlbumEnvelopeBuilder> {
  _$SavedAlbumEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SavedAlbumEnvelopeDataBuilder? _data;
  SavedAlbumEnvelopeDataBuilder get data =>
      _$this._data ??= SavedAlbumEnvelopeDataBuilder();
  set data(SavedAlbumEnvelopeDataBuilder? data) => _$this._data = data;

  SavedAlbumEnvelopeBuilder() {
    SavedAlbumEnvelope._defaults(this);
  }

  SavedAlbumEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SavedAlbumEnvelope other) {
    _$v = other as _$SavedAlbumEnvelope;
  }

  @override
  void update(void Function(SavedAlbumEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SavedAlbumEnvelope build() => _build();

  _$SavedAlbumEnvelope _build() {
    _$SavedAlbumEnvelope _$result;
    try {
      _$result = _$v ??
          _$SavedAlbumEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SavedAlbumEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SavedAlbumEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
