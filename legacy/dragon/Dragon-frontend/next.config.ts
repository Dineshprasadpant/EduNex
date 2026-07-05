import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 1. Change this to standalone for IIS hosting
  output: 'standalone', 
  
  trailingSlash: true,
  images: {
    domains: [
      "images.unsplash.com", 
      "media.istockphoto.com", 
      "plus.unsplash.com",
      "i.pinimg.com",
      "example.com",
      "dragonapplication.s3.ap-south-1.amazonaws.com",
      "gyfhwcucgzqzorqmyemk.supabase.co",
      "yrxamt67xbobvc4xcmzarcirwa0iihfv.lambda-url.us-east-1.on.aws"
    ],
  },

  env: {
    // Note: Don't forget to update your production API URL here later when deploying!
    NEXT_PUBLIC_API_URL: 'http://localhost:8010/api',
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAABbjHCSTOOPQ-TLq"
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;