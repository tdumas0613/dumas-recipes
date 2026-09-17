import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * A slug is permanent because it is the URL, so the rare time one has to
   * change, the old address keeps working. Chicken Marsala was renamed off a
   * restaurant's trademark; anything already linking to the old path lands on
   * the new one instead of a 404.
   */
  async redirects() {
    return [
      {
        source: "/recipes/buca-chicken-marsala",
        destination: "/recipes/chicken-marsala-with-pancetta",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
