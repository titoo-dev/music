// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'playlist_summary_list_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PlaylistSummaryListEnvelope extends PlaylistSummaryListEnvelope {
  @override
  final bool success;
  @override
  final BuiltList<PlaylistSummary> data;

  factory _$PlaylistSummaryListEnvelope(
          [void Function(PlaylistSummaryListEnvelopeBuilder)? updates]) =>
      (PlaylistSummaryListEnvelopeBuilder()..update(updates))._build();

  _$PlaylistSummaryListEnvelope._({required this.success, required this.data})
      : super._();
  @override
  PlaylistSummaryListEnvelope rebuild(
          void Function(PlaylistSummaryListEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PlaylistSummaryListEnvelopeBuilder toBuilder() =>
      PlaylistSummaryListEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PlaylistSummaryListEnvelope &&
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
    return (newBuiltValueToStringHelper(r'PlaylistSummaryListEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class PlaylistSummaryListEnvelopeBuilder
    implements
        Builder<PlaylistSummaryListEnvelope,
            PlaylistSummaryListEnvelopeBuilder> {
  _$PlaylistSummaryListEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  ListBuilder<PlaylistSummary>? _data;
  ListBuilder<PlaylistSummary> get data =>
      _$this._data ??= ListBuilder<PlaylistSummary>();
  set data(ListBuilder<PlaylistSummary>? data) => _$this._data = data;

  PlaylistSummaryListEnvelopeBuilder() {
    PlaylistSummaryListEnvelope._defaults(this);
  }

  PlaylistSummaryListEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PlaylistSummaryListEnvelope other) {
    _$v = other as _$PlaylistSummaryListEnvelope;
  }

  @override
  void update(void Function(PlaylistSummaryListEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PlaylistSummaryListEnvelope build() => _build();

  _$PlaylistSummaryListEnvelope _build() {
    _$PlaylistSummaryListEnvelope _$result;
    try {
      _$result = _$v ??
          _$PlaylistSummaryListEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'PlaylistSummaryListEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'PlaylistSummaryListEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
