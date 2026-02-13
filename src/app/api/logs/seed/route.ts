import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST - 生成模拟数据
export async function POST() {
  try {
    const paths = [
      "/",
      "/products",
      "/products/1",
      "/products/2",
      "/cart",
      "/checkout",
      "/about",
      "/contact",
      "/blog",
      "/blog/post-1",
      "/blog/post-2",
      "/login",
      "/register",
      "/profile",
      "/settings",
      "/orders",
      "/orders/123",
      "/search",
      "/faq",
      "/pricing",
    ];

    const methods = ["GET", "POST", "PUT", "DELETE"];
    const statusCodes = [200, 201, 301, 302, 400, 401, 403, 404, 500];
    const devices = ["Desktop", "Mobile", "Tablet"];
    const browsers = ["Chrome", "Firefox", "Safari", "Edge", "Opera"];
    const osList = ["Windows", "macOS", "Linux", "iOS", "Android"];
    const countries = ["China", "USA", "Japan", "UK", "Germany", "France"];
    const cities = ["Beijing", "Shanghai", "New York", "Tokyo", "London", "Paris"];

    const logs = [];
    const sessionCount = 50; // 生成50个会话

    for (let i = 0; i < sessionCount; i++) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const pathCount = Math.floor(Math.random() * 10) + 3; // 每个会话3-12个路径
      const device = devices[Math.floor(Math.random() * devices.length)];
      const browser = browsers[Math.floor(Math.random() * browsers.length)];
      const os = osList[Math.floor(Math.random() * osList.length)];
      const country = countries[Math.floor(Math.random() * countries.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const ipAddress = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
      
      // 会话开始时间（最近7天内随机）
      const sessionStart = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      
      let currentTime = sessionStart;
      
      for (let j = 0; j < pathCount; j++) {
        const path = paths[Math.floor(Math.random() * paths.length)];
        const method = j === 0 ? "GET" : methods[Math.floor(Math.random() * methods.length)];
        const statusCode = method === "GET" ? 200 : statusCodes[Math.floor(Math.random() * statusCodes.length)];
        const responseTime = Math.floor(Math.random() * 500) + 10;
        
        logs.push({
          sessionId,
          userId: Math.random() > 0.5 ? `user_${Math.floor(Math.random() * 100)}` : null,
          ipAddress,
          userAgent: `${browser}/${Math.floor(Math.random() * 100) + 1} ${os}/${Math.floor(Math.random() * 10) + 1}`,
          path,
          method,
          statusCode,
          responseTime,
          referer: j > 0 ? paths[Math.floor(Math.random() * paths.length)] : null,
          country,
          city,
          device,
          browser,
          os,
          createdAt: currentTime,
        });
        
        // 下一个请求时间（10秒到5分钟后）
        currentTime = new Date(currentTime.getTime() + (Math.random() * 290 + 10) * 1000);
      }
    }

    // 批量插入
    await db.accessLog.createMany({
      data: logs,
    });

    return NextResponse.json({
      message: "Seed data created successfully",
      sessionsCreated: sessionCount,
      logsCreated: logs.length,
    });
  } catch (error) {
    console.error("Error seeding data:", error);
    return NextResponse.json(
      { error: "Failed to seed data" },
      { status: 500 }
    );
  }
}
