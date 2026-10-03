// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'deezer_tracklist_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeezerTracklistEnvelope extends DeezerTracklistEnvelope {
  @override
  final bool success;
  @override
  final BuiltMap<String, JsonObject?> data;

  factory _$DeezerTracklistEnvelope(
          [void Function(DeezerTracklistEnvelopeBuilder)? updates]) =>
      (DeezerTracklistEnvelopeBuilder()..update(updates))._build();

  _$DeezerTracklistEnvelope._({required this.success, required this.data})
      : super._();
  @override
  DeezerTracklistEnvelope rebuild(
          void Function(DeezerTracklistEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeezerTracklistEnvelopeBuilder toBuilder() =>
      DeezerTracklistEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeezerTracklistEnvelope &&
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
    return (newBuiltValueToStringHelper(r'DeezerTracklistEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class DeezerTracklistEnvelopeBuilder
    implements
        Builder<DeezerTracklistEnvelope, DeezerTracklistEnvelopeBuilder> {
  _$DeezerTracklistEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  MapBuilder<String, JsonObject?>? _data;
  MapBuilder<String, JsonObject?> get data =>
      _$this._data ??= MapBuilder<String, JsonObject?>();
  set data(MapBuilder<String, JsonObject?>? data) => _$this._data = data;

  DeezerTracklistEnvelopeBuilder() {
    DeezerTracklistEnvelope._defaults(this);
  }

  DeezerTracklistEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeezerTracklistEnvelope other) {
    _$v = other as _$DeezerTracklistEnvelope;
  }

  @override
  void update(void Function(DeezerTracklistEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeezerTracklistEnvelope build() => _build();

  _$DeezerTracklistEnvelope _build() {
    _$DeezerTracklistEnvelope _$result;
    try {
      _$result = _$v ??
          _$DeezerTracklistEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'DeezerTracklistEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DeezerTracklistEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
