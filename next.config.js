const { withSentryConfig } = require("@sentry/nextjs");

const config = {
  // your existing next config
};

module.exports = withSentryConfig(
  config,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    sourcemaps: {
      // Automatically delete source maps after upload
      deleteSourcemapsAfterUpload: true,
    },
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,
  }
);