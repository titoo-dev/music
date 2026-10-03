//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:wavelet_api/src/model/playlist_summary.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'playlist_summary_list_envelope.g.dart';

/// PlaylistSummaryListEnvelope
///
/// Properties:
/// * [success] 
/// * [data] 
@BuiltValue()
abstract class PlaylistSummaryListEnvelope implements Built<PlaylistSummaryListEnvelope, PlaylistSummaryListEnvelopeBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  @BuiltValueField(wireName: r'data')
  BuiltList<PlaylistSummary> get data;

  PlaylistSummaryListEnvelope._();

  factory PlaylistSummaryListEnvelope([void updates(PlaylistSummaryListEnvelopeBuilder b)]) = _$PlaylistSummaryListEnvelope;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PlaylistSummaryListEnvelopeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PlaylistSummaryListEnvelope> get serializer => _$PlaylistSummaryListEnvelopeSerializer();
}

class _$PlaylistSummaryListEnvelopeSerializer implements PrimitiveSerializer<PlaylistSummaryListEnvelope> {
  @override
  final Iterable<Type> types = const [PlaylistSummaryListEnvelope, _$PlaylistSummaryListEnvelope];

  @override
  final String wireName = r'PlaylistSummaryListEnvelope';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PlaylistSummaryListEnvelope object, {
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
      specifiedType: const FullType(BuiltList, [FullType(PlaylistSummary)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PlaylistSummaryListEnvelope object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PlaylistSummaryListEnvelopeBuilder result,
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
            specifiedType: const FullType(BuiltList, [FullType(PlaylistSummary)]),
          ) as BuiltList<PlaylistSummary>;
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
  PlaylistSummaryListEnvelope deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PlaylistSummaryListEnvelopeBuilder();
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


