/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
      return [
        {
          // Matching all API routes
          source: "/api/:path*",
          headers: [
            { key: "Access-Control-Allow-Credentials", value: "true" },
            { key: "Access-Control-Allow-Origin", value: "*" },
            { key: "Access-Control-Allow-Methods", value: "GET, DELETE, PATCH, POST, PUT" },
            { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key" },
          ],
        },
      ];
    },
    webpack: (config, { isServer }) => {
      if (!isServer) {
        // Ensure ws module is not included in the client bundle
        config.resolve.alias.ws = false;
      }
      return config;
    },
  };
  
  export default nextConfig;
  
