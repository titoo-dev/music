// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stream_probe_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StreamProbeEnvelope extends StreamProbeEnvelope {
  @override
  final bool success;
  @override
  final StreamProbe data;

  factory _$StreamProbeEnvelope(
          [void Function(StreamProbeEnvelopeBuilder)? updates]) =>
      (StreamProbeEnvelopeBuilder()..update(updates))._build();

  _$StreamProbeEnvelope._({required this.success, required this.data})
      : super._();
  @override
  StreamProbeEnvelope rebuild(
          void Function(StreamProbeEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StreamProbeEnvelopeBuilder toBuilder() =>
      StreamProbeEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StreamProbeEnvelope &&
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
    return (newBuiltValueToStringHelper(r'StreamProbeEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class StreamProbeEnvelopeBuilder
    implements Builder<StreamProbeEnvelope, StreamProbeEnvelopeBuilder> {
  _$StreamProbeEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  StreamProbeBuilder? _data;
  StreamProbeBuilder get data => _$this._data ??= StreamProbeBuilder();
  set data(StreamProbeBuilder? data) => _$this._data = data;

  StreamProbeEnvelopeBuilder() {
    StreamProbeEnvelope._defaults(this);
  }

  StreamProbeEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StreamProbeEnvelope other) {
    _$v = other as _$StreamProbeEnvelope;
  }

  @override
  void update(void Function(StreamProbeEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StreamProbeEnvelope build() => _build();

  _$StreamProbeEnvelope _build() {
    _$StreamProbeEnvelope _$result;
    try {
      _$result = _$v ??
          _$StreamProbeEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'StreamProbeEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'StreamProbeEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
