//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'stream_url.g.dart';

/// StreamUrl
///
/// Properties:
/// * [url] - Presigned Vercel Blob URL, valid ~15 min. null → use /stream-progressive.
/// * [contentType] 
/// * [status] - Present only when `url` is null
@BuiltValue()
abstract class StreamUrl implements Built<StreamUrl, StreamUrlBuilder> {
  /// Presigned Vercel Blob URL, valid ~15 min. null → use /stream-progressive.
  @BuiltValueField(wireName: r'url')
  String? get url;

  @BuiltValueField(wireName: r'contentType')
  String? get contentType;

  /// Present only when `url` is null
  @BuiltValueField(wireName: r'status')
  StreamUrlStatusEnum? get status;
  // enum statusEnum {  not_cached,  unsupported_storage,  file_missing,  presigned_disabled,  };

  StreamUrl._();

  factory StreamUrl([void updates(StreamUrlBuilder b)]) = _$StreamUrl;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(StreamUrlBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<StreamUrl> get serializer => _$StreamUrlSerializer();
}

class _$StreamUrlSerializer implements PrimitiveSerializer<StreamUrl> {
  @override
  final Iterable<Type> types = const [StreamUrl, _$StreamUrl];

  @override
  final String wireName = r'StreamUrl';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    StreamUrl object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'url';
    yield object.url == null ? null : serializers.serialize(
      object.url,
      specifiedType: const FullType.nullable(String),
    );
    if (object.contentType != null) {
      yield r'contentType';
      yield serializers.serialize(
        object.contentType,
        specifiedType: const FullType(String),
      );
    }
    if (object.status != null) {
      yield r'status';
      yield serializers.serialize(
        object.status,
        specifiedType: const FullType(StreamUrlStatusEnum),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    StreamUrl object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required StreamUrlBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'url':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.url = valueDes;
          break;
        case r'contentType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.contentType = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(StreamUrlStatusEnum),
          ) as StreamUrlStatusEnum?;
          if (valueDes == null) continue;
          result.status = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  StreamUrl deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = StreamUrlBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}


/// Present only when `url` is null
class StreamUrlStatusEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'not_cached')
  static const StreamUrlStatusEnum notCached = _$streamUrlStatusEnum_notCached;
  @BuiltValueEnumConst(wireName: r'unsupported_storage')
  static const StreamUrlStatusEnum unsupportedStorage = _$streamUrlStatusEnum_unsupportedStorage;
  @BuiltValueEnumConst(wireName: r'file_missing')
  static const StreamUrlStatusEnum fileMissing = _$streamUrlStatusEnum_fileMissing;
  @BuiltValueEnumConst(wireName: r'presigned_disabled')
  static const StreamUrlStatusEnum presignedDisabled = _$streamUrlStatusEnum_presignedDisabled;

  static Serializer<StreamUrlStatusEnum> get serializer => _$streamUrlStatusEnumSerializer;

  const StreamUrlStatusEnum._(String name): super(name);

  static BuiltSet<StreamUrlStatusEnum> get values => _$streamUrlStatusEnumValues;
  static StreamUrlStatusEnum valueOf(String name) => _$streamUrlStatusEnumValueOf(name);
}

