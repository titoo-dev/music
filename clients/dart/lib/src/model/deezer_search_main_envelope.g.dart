// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'deezer_search_main_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeezerSearchMainEnvelope extends DeezerSearchMainEnvelope {
  @override
  final bool success;
  @override
  final BuiltMap<String, JsonObject?> data;

  factory _$DeezerSearchMainEnvelope(
          [void Function(DeezerSearchMainEnvelopeBuilder)? updates]) =>
      (DeezerSearchMainEnvelopeBuilder()..update(updates))._build();

  _$DeezerSearchMainEnvelope._({required this.success, required this.data})
      : super._();
  @override
  DeezerSearchMainEnvelope rebuild(
          void Function(DeezerSearchMainEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeezerSearchMainEnvelopeBuilder toBuilder() =>
      DeezerSearchMainEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeezerSearchMainEnvelope &&
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
    return (newBuiltValueToStringHelper(r'DeezerSearchMainEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class DeezerSearchMainEnvelopeBuilder
    implements
        Builder<DeezerSearchMainEnvelope, DeezerSearchMainEnvelopeBuilder> {
  _$DeezerSearchMainEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  MapBuilder<String, JsonObject?>? _data;
  MapBuilder<String, JsonObject?> get data =>
      _$this._data ??= MapBuilder<String, JsonObject?>();
  set data(MapBuilder<String, JsonObject?>? data) => _$this._data = data;

  DeezerSearchMainEnvelopeBuilder() {
    DeezerSearchMainEnvelope._defaults(this);
  }

  DeezerSearchMainEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeezerSearchMainEnvelope other) {
    _$v = other as _$DeezerSearchMainEnvelope;
  }

  @override
  void update(void Function(DeezerSearchMainEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeezerSearchMainEnvelope build() => _build();

  _$DeezerSearchMainEnvelope _build() {
    _$DeezerSearchMainEnvelope _$result;
    try {
      _$result = _$v ??
          _$DeezerSearchMainEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'DeezerSearchMainEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DeezerSearchMainEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
