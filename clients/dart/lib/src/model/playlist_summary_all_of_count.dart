//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'playlist_summary_all_of_count.g.dart';

/// PlaylistSummaryAllOfCount
///
/// Properties:
/// * [tracks] 
@BuiltValue()
abstract class PlaylistSummaryAllOfCount implements Built<PlaylistSummaryAllOfCount, PlaylistSummaryAllOfCountBuilder> {
  @BuiltValueField(wireName: r'tracks')
  int get tracks;

  PlaylistSummaryAllOfCount._();

  factory PlaylistSummaryAllOfCount([void updates(PlaylistSummaryAllOfCountBuilder b)]) = _$PlaylistSummaryAllOfCount;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PlaylistSummaryAllOfCountBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PlaylistSummaryAllOfCount> get serializer => _$PlaylistSummaryAllOfCountSerializer();
}

class _$PlaylistSummaryAllOfCountSerializer implements PrimitiveSerializer<PlaylistSummaryAllOfCount> {
  @override
  final Iterable<Type> types = const [PlaylistSummaryAllOfCount, _$PlaylistSummaryAllOfCount];

  @override
  final String wireName = r'PlaylistSummaryAllOfCount';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PlaylistSummaryAllOfCount object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'tracks';
    yield serializers.serialize(
      object.tracks,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PlaylistSummaryAllOfCount object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PlaylistSummaryAllOfCountBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'tracks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.tracks = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PlaylistSummaryAllOfCount deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PlaylistSummaryAllOfCountBuilder();
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


