import 'package:flutter_test/flutter_test.dart';
import 'package:slipway_app/bridge.dart';

void main() {
  test('parses share, haptic and openExternal messages', () {
    final share = BridgeMessage.parse('{"type":"share","text":"주문 A-1042","url":"https://app.example.com/o/1"}');
    expect(share, isA<ShareMessage>());
    expect((share as ShareMessage).url, 'https://app.example.com/o/1');
    expect(BridgeMessage.parse('{"type":"haptic"}'), isA<HapticMessage>());
    final open = BridgeMessage.parse('{"type":"openExternal","url":"https://example.org"}');
    expect((open as OpenExternalMessage).url.host, 'example.org');
  });

  test('ignores malformed or unknown messages', () {
    expect(BridgeMessage.parse('not json'), isNull);
    expect(BridgeMessage.parse('[1,2]'), isNull);
    expect(BridgeMessage.parse('{"type":"eval","code":"x"}'), isNull);
    expect(BridgeMessage.parse('{"type":"share"}'), isNull);
    expect(BridgeMessage.parse('{"type":"openExternal","url":"javascript:alert(1)"}'), isNull);
  });
}
