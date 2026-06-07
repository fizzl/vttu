/**
 * Runtime configuration, read from a `/config.js` script that defines
 * `window.__VTTU_CONFIG__` before the app bundle loads.
 *
 * In production the CDK stack writes `config.js` into the S3 bucket with the
 * live Lambda Function URL (see lib/vttu-stack.ts), so the frontend never needs
 * the URL baked in at build time. Locally, `web/public/config.js` ships an empty
 * placeholder; point its `submitUrl` at a deployed Function URL to test against
 * the real backend.
 */
export interface VttuConfig {
  submitUrl?: string;
}

declare global {
  interface Window {
    __VTTU_CONFIG__?: VttuConfig;
  }
}

export function getSubmitUrl(): string {
  return window.__VTTU_CONFIG__?.submitUrl?.trim() ?? "";
}
