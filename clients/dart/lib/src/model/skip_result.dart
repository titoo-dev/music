//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'skip_result.g.dart';

/// Either `{ kept: true, reason }` or `{ evicted: true }`.
///
/// Properties:
/// * [kept] 
/// * [reason] - Why the file was kept: `already_played` (this user logged a real play), `anchored` (saved, in a saved album, shared or recent-played by anyone), `persisting` (a persist of the track is in flight), `recent` (its cached copy is younger than 10 min — another listener may be playing it).
/// * [evicted] 
@BuiltValue()
abstract class SkipResult implements Built<SkipResult, SkipResultBuilder> {
  @BuiltValueField(wireName: r'kept')
  bool? get kept;

  /// Why the file was kept: `already_played` (this user logged a real play), `anchored` (saved, in a saved album, shared or recent-played by anyone), `persisting` (a persist of the track is in flight), `recent` (its cached copy is younger than 10 min — another listener may be playing it).
  @BuiltValueField(wireName: r'reason')
  SkipResultReasonEnum? get reason;
  // enum reasonEnum {  already_played,  anchored,  persisting,  recent,  };

  @BuiltValueField(wireName: r'evicted')
  bool? get evicted;

  SkipResult._();

  factory SkipResult([void updates(SkipResultBuilder b)]) = _$SkipResult;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SkipResultBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SkipResult> get serializer => _$SkipResultSerializer();
}

class _$SkipResultSerializer implements PrimitiveSerializer<SkipResult> {
  @override
  final Iterable<Type> types = const [SkipResult, _$SkipResult];

  @override
  final String wireName = r'SkipResult';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SkipResult object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.kept != null) {
      yield r'kept';
      yield serializers.serialize(
        object.kept,
        specifiedType: const FullType(bool),
      );
    }
    if (object.reason != null) {
      yield r'reason';
      yield serializers.serialize(
        object.reason,
        specifiedType: const FullType(SkipResultReasonEnum),
      );
    }
    if (object.evicted != null) {
      yield r'evicted';
      yield serializers.serialize(
        object.evicted,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SkipResult object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SkipResultBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'kept':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(bool),
          ) as bool?;
          if (valueDes == null) continue;
          result.kept = valueDes;
          break;
        case r'reason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(SkipResultReasonEnum),
          ) as SkipResultReasonEnum?;
          if (valueDes == null) continue;
          result.reason = valueDes;
          break;
        case r'evicted':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(bool),
          ) as bool?;
          if (valueDes == null) continue;
          result.evicted = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SkipResult deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SkipResultBuilder();
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


/// Why the file was kept: `already_played` (this user logged a real play), `anchored` (saved, in a saved album, shared or recent-played by anyone), `persisting` (a persist of the track is in flight), `recent` (its cached copy is younger than 10 min — another listener may be playing it).
class SkipResultReasonEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'already_played')
  static const SkipResultReasonEnum alreadyPlayed = _$skipResultReasonEnum_alreadyPlayed;
  @BuiltValueEnumConst(wireName: r'anchored')
  static const SkipResultReasonEnum anchored = _$skipResultReasonEnum_anchored;
  @BuiltValueEnumConst(wireName: r'persisting')
  static const SkipResultReasonEnum persisting = _$skipResultReasonEnum_persisting;
  @BuiltValueEnumConst(wireName: r'recent')
  static const SkipResultReasonEnum recent = _$skipResultReasonEnum_recent;

  static Serializer<SkipResultReasonEnum> get serializer => _$skipResultReasonEnumSerializer;

  const SkipResultReasonEnum._(String name): super(name);

  static BuiltSet<SkipResultReasonEnum> get values => _$skipResultReasonEnumValues;
  static SkipResultReasonEnum valueOf(String name) => _$skipResultReasonEnumValueOf(name);
}

