//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:wavelet_api/src/model/settings_bundle.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'settings_bundle_envelope.g.dart';

/// SettingsBundleEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class SettingsBundleEnvelope implements Built<SettingsBundleEnvelope, SettingsBundleEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  SettingsBundle get data;

  SettingsBundleEnvelope._();

  factory SettingsBundleEnvelope([void updates(SettingsBundleEnvelopeBuilder b)]) = _$SettingsBundleEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SettingsBundleEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SettingsBundleEnvelope> get serializer => _$SettingsBundleEnvelopeSerializer();
}

class _$SettingsBundleEnvelopeSerializer implements PrimitiveSerializer<SettingsBundleEnvelope> {
  @override
  final Iterable<Type> types = const [SettingsBundleEnvelope, _$SettingsBundleEnvelope];

  @override
  final String wireName = r'SettingsBundleEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SettingsBundleEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'success';
    yield serializers.serialize(
      object.success,
      specifiedType: const FullType(bool),
    );
    yield r'data';
    yield serializers.serialize(
      object.data,
      specifiedType: const FullType(SettingsBundle),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SettingsBundleEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SettingsBundleEnvelopeBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'success':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.success = valueDes;
          break;
        case r'data':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SettingsBundle),
          ) as SettingsBundle;
          result.data.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SettingsBundleEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SettingsBundleEnvelopeBuilder();
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


