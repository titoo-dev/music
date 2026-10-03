// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'logged_envelope_data.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LoggedEnvelopeData extends LoggedEnvelopeData {
  @override
  final bool logged;

  factory _$LoggedEnvelopeData(
          [void Function(LoggedEnvelopeDataBuilder)? updates]) =>
      (LoggedEnvelopeDataBuilder()..update(updates))._build();

  _$LoggedEnvelopeData._({required this.logged}) : super._();
  @override
  LoggedEnvelopeData rebuild(
          void Function(LoggedEnvelopeDataBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LoggedEnvelopeDataBuilder toBuilder() =>
      LoggedEnvelopeDataBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LoggedEnvelopeData && logged == other.logged;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, logged.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LoggedEnvelopeData')
          ..add('logged', logged))
        .toString();
  }
}

class LoggedEnvelopeDataBuilder
    implements Builder<LoggedEnvelopeData, LoggedEnvelopeDataBuilder> {
  _$LoggedEnvelopeData? _$v;

  bool? _logged;
  bool? get logged => _$this._logged;
  set logged(bool? logged) => _$this._logged = logged;

  LoggedEnvelopeDataBuilder() {
    LoggedEnvelopeData._defaults(this);
  }

  LoggedEnvelopeDataBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _logged = $v.logged;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LoggedEnvelopeData other) {
    _$v = other as _$LoggedEnvelopeData;
  }

  @override
  void update(void Function(LoggedEnvelopeDataBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LoggedEnvelopeData build() => _build();

  _$LoggedEnvelopeData _build() {
    final _$result = _$v ??
        _$LoggedEnvelopeData._(
          logged: BuiltValueNullFieldError.checkNotNull(
              logged, r'LoggedEnvelopeData', 'logged'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
