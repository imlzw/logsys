import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - 获取所有会话列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // 获取所有会话，按最后访问时间排序
    const sessions = await db.$queryRaw`
      SELECT 
        sessionId,
        MIN(createdAt) as startTime,
        MAX(createdAt) as endTime,
        COUNT(*) as totalRequests,
        COUNT(DISTINCT path) as uniquePages,
        MAX(ipAddress) as ipAddress,
        MAX(device) as device,
        MAX(browser) as browser,
        MAX(os) as os,
        MAX(country) as country,
        MAX(city) as city
      FROM AccessLog
      GROUP BY sessionId
      ORDER BY MAX(createdAt) DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    ` as Array<{
      sessionId: string;
      startTime: Date;
      endTime: Date;
      totalRequests: bigint;
      uniquePages: bigint;
      ipAddress: string | null;
      device: string | null;
      browser: string | null;
      os: string | null;
      country: string | null;
      city: string | null;
    }>;

    // 获取总会话数
    const totalResult = await db.$queryRaw`
      SELECT COUNT(DISTINCT sessionId) as total
      FROM AccessLog
    ` as Array<{ total: bigint }>;
    
    const total = Number(totalResult[0]?.total || 0);

    // 格式化结果
    const formattedSessions = sessions.map((s) => ({
      sessionId: s.sessionId,
      startTime: s.startTime,
      endTime: s.endTime,
      totalRequests: Number(s.totalRequests),
      uniquePages: Number(s.uniquePages),
      duration: Math.round(
        (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000
      ),
      ipAddress: s.ipAddress,
      device: s.device,
      browser: s.browser,
      os: s.os,
      country: s.country,
      city: s.city,
    }));

    return NextResponse.json({
      sessions: formattedSessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
