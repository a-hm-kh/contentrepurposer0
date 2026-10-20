import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /**
   * Important for local development over the Network URL / LAN IP.
   *
   * By default Next.js blocks requests to dev-only assets (the JavaScript
   * chunks) from any origin other than `localhost`. If you open the app via
   * http://192.168.x.x:3000 without this setting, the page HTML/CSS loads but
   * the JS never executes — so the UI looks fine yet no button works.
   *
   * Entries are hostnames ONLY: no `http://`, no port.
   * `*` matches exactly one part of the hostname.
   */
  allowedDevOrigins: [
    "192.168.*.*", // your Wi-Fi router range (e.g. 192.168.16.5)
    "10.*.*.*", // other local adapters (e.g. 10.0.0.2)
    "26.184.119.56", // Radmin VPN
  ],
};

export default nextConfig;
