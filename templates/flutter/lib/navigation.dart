/// Where a link the web app opens should go.
enum Destination { inApp, outside, blocked }

/// Same site and the sign-in hosts stay in the web view; other pages and app links open outside.
/// Schemes that run code or read local files never load.
Destination decide(Uri url, {required Uri start, Set<String> inAppHosts = const {}}) {
  switch (url.scheme) {
    case 'about':
    case 'blob':
      return Destination.inApp;
    case 'javascript':
    case 'file':
    case 'data':
    case 'content':
      return Destination.blocked;
    case 'http':
    case 'https':
      final sameSite = url.host == start.host && url.port == start.port;
      return sameSite || inAppHosts.contains(url.host)
          ? Destination.inApp
          : Destination.outside;
    default:
      // tel:, mailto:, sms:, intent:, kakaolink: and other app links.
      return Destination.outside;
  }
}
