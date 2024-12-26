// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const config = {
  dsn: "https://07ace51ce62ca5846a7183e78d6fc1b9@o4508513589264384.ingest.de.sentry.io/4508513616920656",
  tracesSampleRate: 1,
  debug: false,
};

Sentry.init(config);
export default config;
