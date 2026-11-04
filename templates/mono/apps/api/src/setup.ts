import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

import { ApiExceptionFilter } from './common/http.js';
import { webOrigins } from './config.js';

/** Shared by main.ts and the e2e tests so both run the exact same app. */
export function setup<T extends INestApplication>(app: T): T {
  app.setGlobalPrefix('api');
  app.enableCors({ origin: webOrigins });
  // Security headers for the API and, when WEB_DIST is set, the web app served from here.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          // The Daum postcode search (AddressInput) loads its script from this host.
          scriptSrc: ["'self'", 'https://t1.daumcdn.net'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'", 'https://t1.daumcdn.net'],
          frameSrc: ['https://postcode.map.daum.net'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      // The postcode popup reports back through window.opener.
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();
  return app;
}
