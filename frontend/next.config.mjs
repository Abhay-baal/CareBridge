import withPWA from "next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "192.168.1.8",
    "localhost",
    "127.0.0.1",
  ],
};

export default withPWAConfig(nextConfig);