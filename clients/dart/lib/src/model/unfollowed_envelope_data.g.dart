// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'unfollowed_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UnfollowedEnvelopeData extends UnfollowedEnvelopeData {
  @override
  final bool unfollowed;

  factory _$UnfollowedEnvelopeData(
          [void Function(UnfollowedEnvelopeDataBuilder)? updates]) =>
      (UnfollowedEnvelopeDataBuilder()..update(updates))._build();

  _$UnfollowedEnvelopeData._({required this.unfollowed}) : super._();
  @override
  UnfollowedEnvelopeData rebuild(
          void Function(UnfollowedEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UnfollowedEnvelopeDataBuilder toBuilder() =>
      UnfollowedEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UnfollowedEnvelopeData && unfollowed == other.unfollowed;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, unfollowed.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UnfollowedEnvelopeData')
          ..add('unfollowed', unfollowed))
        .toString();
  }
}

class UnfollowedEnvelopeDataBuilder
    implements Builder<UnfollowedEnvelopeData, UnfollowedEnvelopeDataBuilder> {
  _$UnfollowedEnvelopeData? _$v;

  bool? _unfollowed;
  bool? get unfollowed => _$this._unfollowed;
  set unfollowed(bool? unfollowed) => _$this._unfollowed = unfollowed;

  UnfollowedEnvelopeDataBuilder() {
    UnfollowedEnvelopeData._defaults(this);
  }

  UnfollowedEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _unfollowed = $v.unfollowed;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UnfollowedEnvelopeData other) {
    _$v = other as _$UnfollowedEnvelopeData;
  }

  @override
  void update(void Function(UnfollowedEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UnfollowedEnvelopeData build() => _build();

  _$UnfollowedEnvelopeData _build() {
    final _$result = _$v ??
        _$UnfollowedEnvelopeData._(
          unfollowed: BuiltValueNullFieldError.checkNotNull(
              unfollowed, r'UnfollowedEnvelopeData', 'unfollowed'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
