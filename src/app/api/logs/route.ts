import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET - 获取日志列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sessionId = searchParams.get("sessionId");
    const path = searchParams.get("path");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const statusCode = searchParams.get("statusCode");

    const where: Prisma.AccessLogWhereInput = {};

    if (sessionId) {
      where.sessionId = sessionId;
    }
    if (path) {
      where.path = { contains: path };
    }
    if (statusCode) {
      where.statusCode = parseInt(statusCode);
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      db.accessLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.accessLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

// POST - 创建日志
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      userId,
      ipAddress,
      userAgent,
      path,
      method,
      statusCode,
      responseTime,
      referer,
      country,
      city,
      device,
      browser,
      os,
      metadata,
    } = body;

    if (!sessionId || !path || !method || statusCode === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, path, method, statusCode" },
        { status: 400 }
      );
    }

    const log = await db.accessLog.create({
      data: {
        sessionId,
        userId,
        ipAddress,
        userAgent,
        path,
        method,
        statusCode,
        responseTime,
        referer,
        country,
        city,
        device,
        browser,
        os,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error creating log:", error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 }
    );
  }
}
