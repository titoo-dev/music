// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stream_url.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const StreamUrlStatusEnum _$streamUrlStatusEnum_notCached =
    const StreamUrlStatusEnum._('notCached');
const StreamUrlStatusEnum _$streamUrlStatusEnum_unsupportedStorage =
    const StreamUrlStatusEnum._('unsupportedStorage');
const StreamUrlStatusEnum _$streamUrlStatusEnum_fileMissing =
    const StreamUrlStatusEnum._('fileMissing');
const StreamUrlStatusEnum _$streamUrlStatusEnum_presignedDisabled =
    const StreamUrlStatusEnum._('presignedDisabled');

StreamUrlStatusEnum _$streamUrlStatusEnumValueOf(String name) {
  switch (name) {
    case 'notCached':
      return _$streamUrlStatusEnum_notCached;
    case 'unsupportedStorage':
      return _$streamUrlStatusEnum_unsupportedStorage;
    case 'fileMissing':
      return _$streamUrlStatusEnum_fileMissing;
    case 'presignedDisabled':
      return _$streamUrlStatusEnum_presignedDisabled;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<StreamUrlStatusEnum> _$streamUrlStatusEnumValues =
    BuiltSet<StreamUrlStatusEnum>(const <StreamUrlStatusEnum>[
  _$streamUrlStatusEnum_notCached,
  _$streamUrlStatusEnum_unsupportedStorage,
  _$streamUrlStatusEnum_fileMissing,
  _$streamUrlStatusEnum_presignedDisabled,
]);

Serializer<StreamUrlStatusEnum> _$streamUrlStatusEnumSerializer =
    _$StreamUrlStatusEnumSerializer();

class _$StreamUrlStatusEnumSerializer
    implements PrimitiveSerializer<StreamUrlStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'notCached': 'not_cached',
    'unsupportedStorage': 'unsupported_storage',
    'fileMissing': 'file_missing',
    'presignedDisabled': 'presigned_disabled',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'not_cached': 'notCached',
    'unsupported_storage': 'unsupportedStorage',
    'file_missing': 'fileMissing',
    'presigned_disabled': 'presignedDisabled',
  };

  @override
  final Iterable<Type> types = const <Type>[StreamUrlStatusEnum];
  @override
  final String wireName = 'StreamUrlStatusEnum';

  @override
  Object serialize(Serializers serializers, StreamUrlStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  StreamUrlStatusEnum deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      StreamUrlStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$StreamUrl extends StreamUrl {
  @override
  final String? url;
  @override
  final String? contentType;
  @override
  final StreamUrlStatusEnum? status;

  factory _$StreamUrl([void Function(StreamUrlBuilder)? updates]) =>
      (StreamUrlBuilder()..update(updates))._build();

  _$StreamUrl._({this.url, this.contentType, this.status}) : super._();
  @override
  StreamUrl rebuild(void Function(StreamUrlBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StreamUrlBuilder toBuilder() => StreamUrlBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StreamUrl &&
        url == other.url &&
        contentType == other.contentType &&
        status == other.status;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, url.hashCode);
    _$hash = $jc(_$hash, contentType.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'StreamUrl')
          ..add('url', url)
          ..add('contentType', contentType)
          ..add('status', status))
        .toString();
  }
}

class StreamUrlBuilder implements Builder<StreamUrl, StreamUrlBuilder> {
  _$StreamUrl? _$v;

  String? _url;
  String? get url => _$this._url;
  set url(String? url) => _$this._url = url;

  String? _contentType;
  String? get contentType => _$this._contentType;
  set contentType(String? contentType) => _$this._contentType = contentType;

  StreamUrlStatusEnum? _status;
  StreamUrlStatusEnum? get status => _$this._status;
  set status(StreamUrlStatusEnum? status) => _$this._status = status;

  StreamUrlBuilder() {
    StreamUrl._defaults(this);
  }

  StreamUrlBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _url = $v.url;
      _contentType = $v.contentType;
      _status = $v.status;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StreamUrl other) {
    _$v = other as _$StreamUrl;
  }

  @override
  void update(void Function(StreamUrlBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StreamUrl build() => _build();

  _$StreamUrl _build() {
    final _$result = _$v ??
        _$StreamUrl._(
          url: url,
          contentType: contentType,
          status: status,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
