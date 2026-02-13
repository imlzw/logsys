import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - 获取特定会话的访问路径
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // 获取该会话的所有访问记录，按时间排序
    const logs = await db.accessLog.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    if (logs.length === 0) {
      return NextResponse.json(
        { error: "No logs found for this session" },
        { status: 404 }
      );
    }

    // 计算路径信息
    const pathSequence = logs.map((log, index) => ({
      step: index + 1,
      path: log.path,
      method: log.method,
      statusCode: log.statusCode,
      responseTime: log.responseTime,
      timestamp: log.createdAt,
      referer: log.referer,
    }));

    // 计算停留时间（基于下一个请求的时间）
    const pathWithDuration = pathSequence.map((item, index) => {
      let duration = null;
      if (index < pathSequence.length - 1) {
        const nextTimestamp = pathSequence[index + 1].timestamp;
        duration = Math.round(
          (nextTimestamp.getTime() - item.timestamp.getTime()) / 1000
        );
      }
      return {
        ...item,
        duration, // 在该页面停留的秒数
      };
    });

    // 会话摘要
    const sessionSummary = {
      sessionId,
      userId: logs[0].userId,
      ipAddress: logs[0].ipAddress,
      userAgent: logs[0].userAgent,
      device: logs[0].device,
      browser: logs[0].browser,
      os: logs[0].os,
      country: logs[0].country,
      city: logs[0].city,
      startTime: logs[0].createdAt,
      endTime: logs[logs.length - 1].createdAt,
      totalDuration: Math.round(
        (logs[logs.length - 1].createdAt.getTime() - logs[0].createdAt.getTime()) / 1000
      ),
      totalRequests: logs.length,
      uniquePages: new Set(logs.map((l) => l.path)).size,
      entryPage: logs[0].path,
      exitPage: logs[logs.length - 1].path,
    };

    return NextResponse.json({
      sessionSummary,
      pathSequence: pathWithDuration,
    });
  } catch (error) {
    console.error("Error fetching path:", error);
    return NextResponse.json(
      { error: "Failed to fetch path" },
      { status: 500 }
    );
  }
}
