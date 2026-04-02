/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',      // แก้จาก 'standalone' เป็น 'export'
  images: {
    unoptimized: true,   // เพิ่มส่วนนี้เข้าไปด้วยครับ
  },
};

module.exports = nextConfig;