// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stream_url_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StreamUrlEnvelope extends StreamUrlEnvelope {
  @override
  final bool success;
  @override
  final StreamUrl data;

  factory _$StreamUrlEnvelope(
          [void Function(StreamUrlEnvelopeBuilder)? updates]) =>
      (StreamUrlEnvelopeBuilder()..update(updates))._build();

  _$StreamUrlEnvelope._({required this.success, required this.data})
      : super._();
  @override
  StreamUrlEnvelope rebuild(void Function(StreamUrlEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StreamUrlEnvelopeBuilder toBuilder() =>
      StreamUrlEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StreamUrlEnvelope &&
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
    return (newBuiltValueToStringHelper(r'StreamUrlEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class StreamUrlEnvelopeBuilder
    implements Builder<StreamUrlEnvelope, StreamUrlEnvelopeBuilder> {
  _$StreamUrlEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  StreamUrlBuilder? _data;
  StreamUrlBuilder get data => _$this._data ??= StreamUrlBuilder();
  set data(StreamUrlBuilder? data) => _$this._data = data;

  StreamUrlEnvelopeBuilder() {
    StreamUrlEnvelope._defaults(this);
  }

  StreamUrlEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StreamUrlEnvelope other) {
    _$v = other as _$StreamUrlEnvelope;
  }

  @override
  void update(void Function(StreamUrlEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StreamUrlEnvelope build() => _build();

  _$StreamUrlEnvelope _build() {
    _$StreamUrlEnvelope _$result;
    try {
      _$result = _$v ??
          _$StreamUrlEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'StreamUrlEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'StreamUrlEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
