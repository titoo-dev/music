//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'saved_flag_envelope_data.g.dart';

/// SavedFlagEnvelopeData
///
/// Properties:
/// * [saved] 
@BuiltValue()
abstract class SavedFlagEnvelopeData implements Built<SavedFlagEnvelopeData, SavedFlagEnvelopeDataBuilder> {
  @BuiltValueField(wireName: r'saved')
  bool get saved;

  SavedFlagEnvelopeData._();

  factory SavedFlagEnvelopeData([void updates(SavedFlagEnvelopeDataBuilder b)]) = _$SavedFlagEnvelopeData;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SavedFlagEnvelopeDataBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SavedFlagEnvelopeData> get serializer => _$SavedFlagEnvelopeDataSerializer();
}

class _$SavedFlagEnvelopeDataSerializer implements PrimitiveSerializer<SavedFlagEnvelopeData> {
  @override
  final Iterable<Type> types = const [SavedFlagEnvelopeData, _$SavedFlagEnvelopeData];

  @override
  final String wireName = r'SavedFlagEnvelopeData';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SavedFlagEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'saved';
    yield serializers.serialize(
      object.saved,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SavedFlagEnvelopeData object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SavedFlagEnvelopeDataBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'saved':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.saved = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SavedFlagEnvelopeData deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SavedFlagEnvelopeDataBuilder();
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


