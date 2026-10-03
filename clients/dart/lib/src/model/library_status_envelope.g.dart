// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'library_status_envelope.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LibraryStatusEnvelope extends LibraryStatusEnvelope {
  @override
  final bool success;
  @override
  final LibraryStatus data;

  factory _$LibraryStatusEnvelope(
          [void Function(LibraryStatusEnvelopeBuilder)? updates]) =>
      (LibraryStatusEnvelopeBuilder()..update(updates))._build();

  _$LibraryStatusEnvelope._({required this.success, required this.data})
      : super._();
  @override
  LibraryStatusEnvelope rebuild(
          void Function(LibraryStatusEnvelopeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LibraryStatusEnvelopeBuilder toBuilder() =>
      LibraryStatusEnvelopeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LibraryStatusEnvelope &&
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
    return (newBuiltValueToStringHelper(r'LibraryStatusEnvelope')
          ..add('success', success)
          ..add('data', data))
        .toString();
  }
}

class LibraryStatusEnvelopeBuilder
    implements Builder<LibraryStatusEnvelope, LibraryStatusEnvelopeBuilder> {
  _$LibraryStatusEnvelope? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  LibraryStatusBuilder? _data;
  LibraryStatusBuilder get data => _$this._data ??= LibraryStatusBuilder();
  set data(LibraryStatusBuilder? data) => _$this._data = data;

  LibraryStatusEnvelopeBuilder() {
    LibraryStatusEnvelope._defaults(this);
  }

  LibraryStatusEnvelopeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _data = $v.data.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LibraryStatusEnvelope other) {
    _$v = other as _$LibraryStatusEnvelope;
  }

  @override
  void update(void Function(LibraryStatusEnvelopeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LibraryStatusEnvelope build() => _build();

  _$LibraryStatusEnvelope _build() {
    _$LibraryStatusEnvelope _$result;
    try {
      _$result = _$v ??
          _$LibraryStatusEnvelope._(
            success: BuiltValueNullFieldError.checkNotNull(
                success, r'LibraryStatusEnvelope', 'success'),
            data: data.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'data';
        data.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'LibraryStatusEnvelope', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
