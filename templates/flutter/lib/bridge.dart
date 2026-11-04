import 'dart:convert';

/// Messages the web app sends through `window.SlipwayApp.postMessage(JSON.stringify(...))`.
/// The web app detects the shell with `typeof window.SlipwayApp !== "undefined"`.
sealed class BridgeMessage {
  const BridgeMessage();

  /// Null for anything that isn't a known, well-formed message.
  static BridgeMessage? parse(String raw) {
    final Object? data;
    try {
      data = jsonDecode(raw);
    } on FormatException {
      return null;
    }
    if (data is! Map<String, dynamic>) return null;
    switch (data['type']) {
      case 'share':
        final text = data['text'];
        final url = data['url'];
        if (text is! String && url is! String) return null;
        return ShareMessage(text: text is String ? text : null, url: url is String ? url : null);
      case 'haptic':
        return const HapticMessage();
      case 'openExternal':
        final url = Uri.tryParse(data['url'] is String ? data['url'] as String : '');
        if (url == null || (url.scheme != 'https' && url.scheme != 'http')) return null;
        return OpenExternalMessage(url);
      default:
        return null;
    }
  }
}

/// `{"type":"share","text":"...","url":"..."}`: the system share sheet.
final class ShareMessage extends BridgeMessage {
  const ShareMessage({this.text, this.url});
  final String? text;
  final String? url;
}

/// `{"type":"haptic"}`: a light tap of vibration.
final class HapticMessage extends BridgeMessage {
  const HapticMessage();
}

/// `{"type":"openExternal","url":"https://..."}`: open a page in the phone's browser.
final class OpenExternalMessage extends BridgeMessage {
  const OpenExternalMessage(this.url);
  final Uri url;
}
