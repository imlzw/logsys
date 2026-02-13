import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - 获取统计数据
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: { createdAt: { gte?: Date; lte?: Date } } = { createdAt: {} };
    if (startDate) {
      dateFilter.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.createdAt.lte = new Date(endDate);
    }

    // 如果没有日期过滤，移除空对象
    const where = Object.keys(dateFilter.createdAt).length > 0 ? dateFilter : {};

    // 获取总访问量
    const totalVisits = await db.accessLog.count({ where });

    // 获取唯一会话数
    const uniqueSessions = await db.accessLog.groupBy({
      by: ["sessionId"],
      where,
      _count: true,
    });

    // 获取路径访问统计
    const pathStats = await db.accessLog.groupBy({
      by: ["path"],
      where,
      _count: {
        path: true,
      },
      orderBy: {
        _count: {
          path: "desc",
        },
      },
      take: 10,
    });

    // 获取状态码统计
    const statusCodeStats = await db.accessLog.groupBy({
      by: ["statusCode"],
      where,
      _count: {
        statusCode: true,
      },
    });

    // 获取方法统计
    const methodStats = await db.accessLog.groupBy({
      by: ["method"],
      where,
      _count: {
        method: true,
      },
    });

    // 获取设备统计
    const deviceStats = await db.accessLog.groupBy({
      by: ["device"],
      where,
      _count: {
        device: true,
      },
    });

    // 获取浏览器统计
    const browserStats = await db.accessLog.groupBy({
      by: ["browser"],
      where,
      _count: {
        browser: true,
      },
    });

    // 获取操作系统统计
    const osStats = await db.accessLog.groupBy({
      by: ["os"],
      where,
      _count: {
        os: true,
      },
    });

    // 获取每日访问量（最近7天）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentLogs = await db.accessLog.findMany({
      where: {
        ...where,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // 按日期分组
    const dailyVisits: Record<string, number> = {};
    recentLogs.forEach((log) => {
      const dateKey = log.createdAt.toISOString().split("T")[0];
      dailyVisits[dateKey] = (dailyVisits[dateKey] || 0) + 1;
    });

    // 获取平均响应时间
    const responseTimeResult = await db.accessLog.aggregate({
      where: {
        ...where,
        responseTime: { not: null },
      },
      _avg: {
        responseTime: true,
      },
    });

    return NextResponse.json({
      totalVisits,
      uniqueSessions: uniqueSessions.length,
      pathStats: pathStats.map((p) => ({
        path: p.path,
        count: p._count.path,
      })),
      statusCodeStats: statusCodeStats.map((s) => ({
        statusCode: s.statusCode,
        count: s._count.statusCode,
      })),
      methodStats: methodStats.map((m) => ({
        method: m.method,
        count: m._count.method,
      })),
      deviceStats: deviceStats.filter((d) => d.device).map((d) => ({
        device: d.device,
        count: d._count.device,
      })),
      browserStats: browserStats.filter((b) => b.browser).map((b) => ({
        browser: b.browser,
        count: b._count.browser,
      })),
      osStats: osStats.filter((o) => o.os).map((o) => ({
        os: o.os,
        count: o._count.os,
      })),
      dailyVisits,
      avgResponseTime: responseTimeResult._avg.responseTime || 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
