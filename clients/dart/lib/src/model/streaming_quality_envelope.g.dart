// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'streaming_quality_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StreamingQualityEnvelope extends StreamingQualityEnvelope {
  @override
  final bool success;
  @override
  final SetStreamingQualityRequest data;

  factory _$StreamingQualityEnvelope(
          [void Function(StreamingQualityEnvelopeBuilder)? updates]) =>
      (StreamingQualityEnvelopeBuilder()..update(updates))._build();

  _$StreamingQualityEnvelope._({required this.success, required this.data})
      : super._();
  @override
  StreamingQualityEnvelope rebuild(
          void Function(StreamingQualityEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StreamingQualityEnvelopeBuilder toBuilder() =>
      StreamingQualityEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StreamingQualityEnvelope &&
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
    return (newBuiltValueToStringHelper(r'StreamingQualityEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class StreamingQualityEnvelopeBuilder
    implements
        Builder<StreamingQualityEnvelope, StreamingQualityEnvelopeBuilder> {
  _$StreamingQualityEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  SetStreamingQualityRequestBuilder? _data;
  SetStreamingQualityRequestBuilder get data =>
      _$this._data ??= SetStreamingQualityRequestBuilder();
  set data(SetStreamingQualityRequestBuilder? data) => _$this._data = data;

  StreamingQualityEnvelopeBuilder() {
    StreamingQualityEnvelope._defaults(this);
  }

  StreamingQualityEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StreamingQualityEnvelope other) {
    _$v = other as _$StreamingQualityEnvelope;
  }

  @override
  void update(void Function(StreamingQualityEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StreamingQualityEnvelope build() => _build();

  _$StreamingQualityEnvelope _build() {
    _$StreamingQualityEnvelope _$result;
    try {
      _$result = _$v ??
          _$StreamingQualityEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'StreamingQualityEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'StreamingQualityEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
