// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'deezer_page_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeezerPageEnvelope extends DeezerPageEnvelope {
  @override
  final bool success;
  @override
  final BuiltMap<String, JsonObject?> data;

  factory _$DeezerPageEnvelope(
          [void Function(DeezerPageEnvelopeBuilder)? updates]) =>
      (DeezerPageEnvelopeBuilder()..update(updates))._build();

  _$DeezerPageEnvelope._({required this.success, required this.data})
      : super._();
  @override
  DeezerPageEnvelope rebuild(
          void Function(DeezerPageEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeezerPageEnvelopeBuilder toBuilder() =>
      DeezerPageEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeezerPageEnvelope &&
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
    return (newBuiltValueToStringHelper(r'DeezerPageEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class DeezerPageEnvelopeBuilder
    implements Builder<DeezerPageEnvelope, DeezerPageEnvelopeBuilder> {
  _$DeezerPageEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  MapBuilder<String, JsonObject?>? _data;
  MapBuilder<String, JsonObject?> get data =>
      _$this._data ??= MapBuilder<String, JsonObject?>();
  set data(MapBuilder<String, JsonObject?>? data) => _$this._data = data;

  DeezerPageEnvelopeBuilder() {
    DeezerPageEnvelope._defaults(this);
  }

  DeezerPageEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeezerPageEnvelope other) {
    _$v = other as _$DeezerPageEnvelope;
  }

  @override
  void update(void Function(DeezerPageEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeezerPageEnvelope build() => _build();

  _$DeezerPageEnvelope _build() {
    _$DeezerPageEnvelope _$result;
    try {
      _$result = _$v ??
          _$DeezerPageEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'DeezerPageEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DeezerPageEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
