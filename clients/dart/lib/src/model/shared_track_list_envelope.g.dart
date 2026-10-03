// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shared_track_list_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SharedTrackListEnvelope extends SharedTrackListEnvelope {
  @override
  final bool success;
  @override
  final BuiltList<SharedTrack> data;

  factory _$SharedTrackListEnvelope(
          [void Function(SharedTrackListEnvelopeBuilder)? updates]) =>
      (SharedTrackListEnvelopeBuilder()..update(updates))._build();

  _$SharedTrackListEnvelope._({required this.success, required this.data})
      : super._();
  @override
  SharedTrackListEnvelope rebuild(
          void Function(SharedTrackListEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SharedTrackListEnvelopeBuilder toBuilder() =>
      SharedTrackListEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SharedTrackListEnvelope &&
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
    return (newBuiltValueToStringHelper(r'SharedTrackListEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class SharedTrackListEnvelopeBuilder
    implements
        Builder<SharedTrackListEnvelope, SharedTrackListEnvelopeBuilder> {
  _$SharedTrackListEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  ListBuilder<SharedTrack>? _data;
  ListBuilder<SharedTrack> get data =>
      _$this._data ??= ListBuilder<SharedTrack>();
  set data(ListBuilder<SharedTrack>? data) => _$this._data = data;

  SharedTrackListEnvelopeBuilder() {
    SharedTrackListEnvelope._defaults(this);
  }

  SharedTrackListEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SharedTrackListEnvelope other) {
    _$v = other as _$SharedTrackListEnvelope;
  }

  @override
  void update(void Function(SharedTrackListEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SharedTrackListEnvelope build() => _build();

  _$SharedTrackListEnvelope _build() {
    _$SharedTrackListEnvelope _$result;
    try {
      _$result = _$v ??
          _$SharedTrackListEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'SharedTrackListEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SharedTrackListEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
