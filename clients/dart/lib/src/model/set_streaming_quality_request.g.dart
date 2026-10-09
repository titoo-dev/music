// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'set_streaming_quality_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SetStreamingQualityRequestMaxBitrateEnum
    _$setStreamingQualityRequestMaxBitrateEnum_number1 =
    const SetStreamingQualityRequestMaxBitrateEnum._('number1');
const SetStreamingQualityRequestMaxBitrateEnum
    _$setStreamingQualityRequestMaxBitrateEnum_number3 =
    const SetStreamingQualityRequestMaxBitrateEnum._('number3');
const SetStreamingQualityRequestMaxBitrateEnum
    _$setStreamingQualityRequestMaxBitrateEnum_number9 =
    const SetStreamingQualityRequestMaxBitrateEnum._('number9');

SetStreamingQualityRequestMaxBitrateEnum
    _$setStreamingQualityRequestMaxBitrateEnumValueOf(String name) {
  switch (name) {
    case 'number1':
      return _$setStreamingQualityRequestMaxBitrateEnum_number1;
    case 'number3':
      return _$setStreamingQualityRequestMaxBitrateEnum_number3;
    case 'number9':
      return _$setStreamingQualityRequestMaxBitrateEnum_number9;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SetStreamingQualityRequestMaxBitrateEnum>
    _$setStreamingQualityRequestMaxBitrateEnumValues = BuiltSet<
        SetStreamingQualityRequestMaxBitrateEnum>(const <SetStreamingQualityRequestMaxBitrateEnum>[
  _$setStreamingQualityRequestMaxBitrateEnum_number1,
  _$setStreamingQualityRequestMaxBitrateEnum_number3,
  _$setStreamingQualityRequestMaxBitrateEnum_number9,
]);

Serializer<SetStreamingQualityRequestMaxBitrateEnum>
    _$setStreamingQualityRequestMaxBitrateEnumSerializer =
    _$SetStreamingQualityRequestMaxBitrateEnumSerializer();

class _$SetStreamingQualityRequestMaxBitrateEnumSerializer
    implements PrimitiveSerializer<SetStreamingQualityRequestMaxBitrateEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'number1': 1,
    'number3': 3,
    'number9': 9,
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    1: 'number1',
    3: 'number3',
    9: 'number9',
  };

  @override
  final Iterable<Type> types = const <Type>[
    SetStreamingQualityRequestMaxBitrateEnum
  ];
  @override
  final String wireName = 'SetStreamingQualityRequestMaxBitrateEnum';

  @override
  Object serialize(Serializers serializers,
          SetStreamingQualityRequestMaxBitrateEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SetStreamingQualityRequestMaxBitrateEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SetStreamingQualityRequestMaxBitrateEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$SetStreamingQualityRequest extends SetStreamingQualityRequest {
  @override
  final SetStreamingQualityRequestMaxBitrateEnum maxBitrate;

  factory _$SetStreamingQualityRequest(
          [void Function(SetStreamingQualityRequestBuilder)? updates]) =>
      (SetStreamingQualityRequestBuilder()..update(updates))._build();

  _$SetStreamingQualityRequest._({required this.maxBitrate}) : super._();
  @override
  SetStreamingQualityRequest rebuild(
          void Function(SetStreamingQualityRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SetStreamingQualityRequestBuilder toBuilder() =>
      SetStreamingQualityRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SetStreamingQualityRequest &&
        maxBitrate == other.maxBitrate;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, maxBitrate.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SetStreamingQualityRequest')
          ..add('maxBitrate', maxBitrate))
        .toString();
  }
}

class SetStreamingQualityRequestBuilder
    implements
        Builder<SetStreamingQualityRequest, SetStreamingQualityRequestBuilder> {
  _$SetStreamingQualityRequest? _$v;

  SetStreamingQualityRequestMaxBitrateEnum? _maxBitrate;
  SetStreamingQualityRequestMaxBitrateEnum? get maxBitrate =>
      _$this._maxBitrate;
  set maxBitrate(SetStreamingQualityRequestMaxBitrateEnum? maxBitrate) =>
      _$this._maxBitrate = maxBitrate;

  SetStreamingQualityRequestBuilder() {
    SetStreamingQualityRequest._defaults(this);
  }

  SetStreamingQualityRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _maxBitrate = $v.maxBitrate;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SetStreamingQualityRequest other) {
    _$v = other as _$SetStreamingQualityRequest;
  }

  @override
  void update(void Function(SetStreamingQualityRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SetStreamingQualityRequest build() => _build();

  _$SetStreamingQualityRequest _build() {
    final _$result = _$v ??
        _$SetStreamingQualityRequest._(
          maxBitrate: BuiltValueNullFieldError.checkNotNull(
              maxBitrate, r'SetStreamingQualityRequest', 'maxBitrate'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
