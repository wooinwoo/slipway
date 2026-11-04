import 'package:flutter_test/flutter_test.dart';
import 'package:slipway_app/navigation.dart';

void main() {
  final start = Uri.parse('https://app.example.com');
  Destination go(String url) => decide(Uri.parse(url), start: start, inAppHosts: {'kauth.kakao.com'});

  test('pages of the web app stay inside', () {
    expect(go('https://app.example.com/orders?page=2'), Destination.inApp);
    expect(go('about:blank'), Destination.inApp);
  });

  test('sign-in hosts stay inside so the OAuth round trip completes', () {
    expect(go('https://kauth.kakao.com/oauth/authorize?client_id=x'), Destination.inApp);
  });

  test('other sites and app links open outside', () {
    expect(go('https://example.org/terms'), Destination.outside);
    expect(go('https://app.example.com:8443/'), Destination.outside);
    expect(go('tel:0212345678'), Destination.outside);
    expect(go('mailto:help@example.com'), Destination.outside);
    expect(go('intent://scan/#Intent;scheme=zxing;end'), Destination.outside);
  });

  test('schemes that run code or read local files never load', () {
    expect(go('javascript:alert(1)'), Destination.blocked);
    expect(go('file:///etc/passwd'), Destination.blocked);
    expect(go('data:text/html,<script>alert(1)</script>'), Destination.blocked);
  });
}
