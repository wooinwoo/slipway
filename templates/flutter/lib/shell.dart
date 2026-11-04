import 'dart:io';

import 'package:file_selector/file_selector.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import 'bridge.dart';
import 'config.dart';
import 'navigation.dart';

/// The whole app: the web app in a web view, with what a phone app needs around it — the back button,
/// a progress bar, an offline screen, links opening outside, file uploads and a small JS bridge.
class WebShell extends StatefulWidget {
  const WebShell({super.key});

  @override
  State<WebShell> createState() => _WebShellState();
}

class _WebShellState extends State<WebShell> {
  final _start = Uri.parse(AppConfig.startUrl);
  late final WebViewController _controller;
  int _progress = 0;
  bool _offline = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel('SlipwayApp', onMessageReceived: (message) => _onBridge(message.message))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) => setState(() => _progress = progress),
          onPageStarted: (_) => setState(() => _offline = false),
          onNavigationRequest: _onNavigation,
          onWebResourceError: (error) {
            if (error.isForMainFrame ?? true) setState(() => _offline = true);
          },
        ),
      );
    _setUp();
  }

  Future<void> _setUp() async {
    final agent = await _controller.getUserAgent();
    await _controller.setUserAgent('${agent ?? ''} ${AppConfig.userAgentSuffix}'.trim());
    final platform = _controller.platform;
    // Android needs a handler for <input type="file">; iOS shows its own picker.
    if (platform is AndroidWebViewController) {
      await platform.setOnShowFileSelector(_pickFiles);
    }
    await _controller.loadRequest(_start);
  }

  Future<List<String>> _pickFiles(FileSelectorParams params) async {
    final types = params.acceptTypes.where((type) => type.isNotEmpty).toList();
    final group = XTypeGroup(
      label: 'files',
      mimeTypes: types.where((type) => type.contains('/')).toList(),
      extensions: types.where((type) => type.startsWith('.')).map((type) => type.substring(1)).toList(),
    );
    final groups = group.mimeTypes!.isEmpty && group.extensions!.isEmpty ? <XTypeGroup>[] : [group];
    final files = params.mode == FileSelectorMode.openMultiple
        ? await openFiles(acceptedTypeGroups: groups)
        : [?await openFile(acceptedTypeGroups: groups)];
    return files.map((file) => Uri.file(file.path).toString()).toList();
  }

  NavigationDecision _onNavigation(NavigationRequest request) {
    final url = Uri.tryParse(request.url);
    if (url == null) return NavigationDecision.prevent;
    switch (decide(url, start: _start, inAppHosts: AppConfig.inAppHosts)) {
      case Destination.inApp:
        return NavigationDecision.navigate;
      case Destination.outside:
        launchUrl(url, mode: LaunchMode.externalApplication);
        return NavigationDecision.prevent;
      case Destination.blocked:
        return NavigationDecision.prevent;
    }
  }

  void _onBridge(String raw) {
    switch (BridgeMessage.parse(raw)) {
      case ShareMessage(:final text, :final url):
        SharePlus.instance.share(ShareParams(text: [text, url].whereType<String>().join('\n')));
      case HapticMessage():
        HapticFeedback.lightImpact();
      case OpenExternalMessage(:final url):
        launchUrl(url, mode: LaunchMode.externalApplication);
      case null:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      // Android back: go back in the web app first, leave the app only from its first page.
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (await _controller.canGoBack()) {
          await _controller.goBack();
        } else if (context.mounted) {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: Stack(
            children: [
              WebViewWidget(controller: _controller),
              if (_progress < 100 && !_offline)
                LinearProgressIndicator(value: _progress / 100, minHeight: 2, color: AppConfig.brandColor),
              if (_offline) _Offline(onRetry: () => _controller.reload()),
            ],
          ),
        ),
      ),
    );
  }
}

class _Offline extends StatelessWidget {
  const _Offline({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Theme.of(context).colorScheme.surface,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.wifi_off_rounded, size: 40),
              const SizedBox(height: 16),
              Text('연결할 수 없습니다', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(
                Platform.isAndroid ? '인터넷 연결을 확인하고 다시 시도해 주세요.' : '네트워크 상태를 확인하고 다시 시도해 주세요.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              FilledButton(onPressed: onRetry, child: const Text('다시 시도')),
            ],
          ),
        ),
      ),
    );
  }
}
