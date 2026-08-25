/**
 * SherpaServiceFactory — Фабрика динамического создания сетевого/мокового провайдера по настройкам
 */

class SherpaServiceFactory {
  static createService(settings = {}, logger = null) {
    const HttpService = (typeof globalThis !== 'undefined' && globalThis.HttpSherpaService) ||
      (typeof window !== 'undefined' && window.HttpSherpaService);

    if (settings.mode === 'live') {
      return new HttpService({
        baseUrl: settings.apiUrl,
        token: settings.token,
        isServerConnected: false,
        logger
      });
    }

    const MockServiceClass = (typeof globalThis !== 'undefined' && globalThis.MockSherpaService) ||
      (typeof window !== 'undefined' && window.MockSherpaService);

    if (typeof MockServiceClass === 'function') {
      return new MockServiceClass({
        mock1cStatus: settings.mock1cStatus,
        mockGlinerStatus: settings.mockGlinerStatus,
        mockServerStatus: settings.mockServerStatus,
        is1cAttached: settings.mock1cStatus !== 'detached',
        is1cConnected: settings.mock1cStatus === 'online',
        isGlinerAttached: settings.mockGlinerStatus !== 'detached',
        isGlinerConnected: settings.mockGlinerStatus === 'online',
        isServerConnected: settings.mockServerStatus !== 'offline',
        delayMs: settings.mockDelayMs,
        userName: settings.userName,
        logger
      });
    }

    return new HttpService({
      baseUrl: settings.apiUrl,
      token: settings.token,
      logger
    });
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.SherpaServiceFactory = SherpaServiceFactory;
}
if (typeof window !== 'undefined') {
  window.SherpaServiceFactory = SherpaServiceFactory;
}
