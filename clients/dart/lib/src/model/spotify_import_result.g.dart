// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'spotify_import_result.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SpotifyImportResult extends SpotifyImportResult {
  @override
  final Playlist? playlist;
  @override
  final SpotifyImportReport report;

  factory _$SpotifyImportResult(
          [void Function(SpotifyImportResultBuilder)? updates]) =>
      (SpotifyImportResultBuilder()..update(updates))._build();

  _$SpotifyImportResult._({this.playlist, required this.report}) : super._();
  @override
  SpotifyImportResult rebuild(
          void Function(SpotifyImportResultBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SpotifyImportResultBuilder toBuilder() =>
      SpotifyImportResultBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SpotifyImportResult &&
        playlist == other.playlist &&
        report == other.report;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, playlist.hashCode);
    _$hash = $jc(_$hash, report.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SpotifyImportResult')
          ..add('playlist', playlist)
          ..add('report', report))
        .toString();
  }
}

class SpotifyImportResultBuilder
    implements Builder<SpotifyImportResult, SpotifyImportResultBuilder> {
  _$SpotifyImportResult? _$v;

  Playlist? _playlist;
  Playlist? get playlist => _$this._playlist;
  set playlist(Playlist? playlist) => _$this._playlist = playlist;

  SpotifyImportReportBuilder? _report;
  SpotifyImportReportBuilder get report =>
      _$this._report ??= SpotifyImportReportBuilder();
  set report(SpotifyImportReportBuilder? report) => _$this._report = report;

  SpotifyImportResultBuilder() {
    SpotifyImportResult._defaults(this);
  }

  SpotifyImportResultBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _playlist = $v.playlist;
      _report = $v.report.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SpotifyImportResult other) {
    _$v = other as _$SpotifyImportResult;
  }

  @override
  void update(void Function(SpotifyImportResultBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SpotifyImportResult build() => _build();

  _$SpotifyImportResult _build() {
    _$SpotifyImportResult _$result;
    try {
      _$result = _$v ??
          _$SpotifyImportResult._(
            playlist: playlist,
            report: report.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'report';
        report.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SpotifyImportResult', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
