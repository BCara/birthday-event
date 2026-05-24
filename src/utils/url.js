// src/utils/url.js

/**
 * Returns the current window location origin, replacing 'localhost' or '127.0.0.1'
 * with the host PC's local IP address during development.
 * In production or non-local environments, it returns the standard window.location.origin.
 */
export function getDevSafeOrigin() {
  let origin = window.location.origin;
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const devIp = import.meta.env.VITE_DEV_IP;
    console.log('[DevSafeOrigin] Host is local. VITE_DEV_IP:', devIp);
    if (devIp && devIp !== 'localhost') {
      // Keep protocol and port, just replace the hostname
      origin = origin.replace(window.location.hostname, devIp);
      console.log('[DevSafeOrigin] Replaced origin:', origin);
    }
  }
  return origin;
}
