'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Activity, 
  Users, 
  Clock, 
  Globe, 
  Monitor, 
  Chrome, 
  ArrowRight,
  TrendingUp,
  Eye,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react'

// 类型定义
interface AccessLog {
  id: string
  sessionId: string
  userId: string | null
  ipAddress: string | null
  userAgent: string | null
  path: string
  method: string
  statusCode: number
  responseTime: number | null
  referer: string | null
  country: string | null
  city: string | null
  device: string | null
  browser: string | null
  os: string | null
  createdAt: string
}

interface Session {
  sessionId: string
  startTime: string
  endTime: string
  totalRequests: number
  uniquePages: number
  duration: number
  ipAddress: string | null
  device: string | null
  browser: string | null
  os: string | null
  country: string | null
  city: string | null
}

interface PathStep {
  step: number
  path: string
  method: string
  statusCode: number
  responseTime: number | null
  timestamp: string
  referer: string | null
  duration: number | null
}

interface SessionDetail {
  sessionSummary: {
    sessionId: string
    userId: string | null
    ipAddress: string | null
    userAgent: string | null
    device: string | null
    browser: string | null
    os: string | null
    country: string | null
    city: string | null
    startTime: string
    endTime: string
    totalDuration: number
    totalRequests: number
    uniquePages: number
    entryPage: string
    exitPage: string
  }
  pathSequence: PathStep[]
}

interface Stats {
  totalVisits: number
  uniqueSessions: number
  pathStats: Array<{ path: string; count: number }>
  statusCodeStats: Array<{ statusCode: number; count: number }>
  methodStats: Array<{ method: string; count: number }>
  deviceStats: Array<{ device: string; count: number }>
  browserStats: Array<{ browser: string; count: number }>
  osStats: Array<{ os: string; count: number }>
  dailyVisits: Record<string, number>
  avgResponseTime: number
}

// 状态码颜色
const getStatusCodeColor = (code: number) => {
  if (code >= 200 && code < 300) return 'bg-green-500'
  if (code >= 300 && code < 400) return 'bg-blue-500'
  if (code >= 400 && code < 500) return 'bg-yellow-500'
  return 'bg-red-500'
}

// 方法颜色
const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET': return 'bg-green-100 text-green-800'
    case 'POST': return 'bg-blue-100 text-blue-800'
    case 'PUT': return 'bg-yellow-100 text-yellow-800'
    case 'DELETE': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// 格式化时间
const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  
  // 分页状态
  const [logsPage, setLogsPage] = useState(1)
  const [logsTotal, setLogsTotal] = useState(0)
  const [sessionsPage, setSessionsPage] = useState(1)
  const [sessionsTotal, setSessionsTotal] = useState(0)
  
  // 搜索状态
  const [searchPath, setSearchPath] = useState('')
  const [searchSessionId, setSearchSessionId] = useState('')

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/logs/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [])

  // 获取日志列表
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: logsPage.toString(),
        limit: '20',
        ...(searchPath && { path: searchPath }),
        ...(searchSessionId && { sessionId: searchSessionId }),
      })
      const res = await fetch(`/api/logs?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setLogsTotal(data.pagination?.total || 0)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      setLogs([])
      setLogsTotal(0)
    } finally {
      setLoading(false)
    }
  }, [logsPage, searchPath, searchSessionId])

  // 获取会话列表
  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/logs/sessions?page=${sessionsPage}&limit=20`)
      const data = await res.json()
      setSessions(data.sessions || [])
      setSessionsTotal(data.pagination?.total || 0)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      setSessions([])
      setSessionsTotal(0)
    } finally {
      setLoading(false)
    }
  }, [sessionsPage])

  // 获取会话详情
  const fetchSessionDetail = async (sessionId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/logs/path/${sessionId}`)
      const data = await res.json()
      setSelectedSession(data)
    } catch (error) {
      console.error('Failed to fetch session detail:', error)
    } finally {
      setLoading(false)
    }
  }

  // 生成模拟数据
  const seedData = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/logs/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        alert(`成功生成 ${data.sessionsCreated} 个会话，${data.logsCreated} 条日志`)
        fetchStats()
        fetchLogs()
        fetchSessions()
      } else {
        alert(`生成失败: ${data.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('Failed to seed data:', error)
      alert('生成失败，请检查数据库是否正确初始化')
    } finally {
      setSeeding(false)
    }
  }

  // 初始加载
  useEffect(() => {
    fetchStats()
    fetchLogs()
    fetchSessions()
  }, [fetchStats, fetchLogs, fetchSessions])

  // 标签页切换时刷新数据
  useEffect(() => {
    if (activeTab === 'dashboard') fetchStats()
    if (activeTab === 'logs') fetchLogs()
    if (activeTab === 'sessions') fetchSessions()
  }, [activeTab, fetchStats, fetchLogs, fetchSessions])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 头部 */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">日志追踪系统</h1>
                <p className="text-xs text-slate-400">Access Log Tracking System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { fetchStats(); fetchLogs(); fetchSessions(); }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
              <Button 
                size="sm" 
                onClick={seedData}
                disabled={seeding}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {seeding ? '生成中...' : '生成模拟数据'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <TrendingUp className="w-4 h-4 mr-2" />
              仪表盘
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Users className="w-4 h-4 mr-2" />
              会话追踪
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Eye className="w-4 h-4 mr-2" />
              日志列表
            </TabsTrigger>
          </TabsList>

          {/* 仪表盘 */}
          <TabsContent value="dashboard" className="space-y-6">
            {stats && (
              <>
                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-400">总访问量</CardTitle>
                      <Activity className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{stats.totalVisits.toLocaleString()}</div>
                      <p className="text-xs text-slate-500">所有请求次数</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-400">独立访客</CardTitle>
                      <Users className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{stats.uniqueSessions.toLocaleString()}</div>
                      <p className="text-xs text-slate-500">独立会话数</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-400">平均响应时间</CardTitle>
                      <Clock className="w-4 h-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">{Math.round(stats.avgResponseTime)}ms</div>
                      <p className="text-xs text-slate-500">服务器响应</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-400">热门页面</CardTitle>
                      <Globe className="w-4 h-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-white truncate">{stats.pathStats[0]?.path || '/'}</div>
                      <p className="text-xs text-slate-500">{stats.pathStats[0]?.count || 0} 次访问</p>
                    </CardContent>
                  </Card>
                </div>

                {/* 图表区域 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 热门路径 */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">热门访问路径</CardTitle>
                      <CardDescription className="text-slate-400">访问量最高的页面</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.pathStats.slice(0, 8).map((item, index) => (
                          <div key={item.path} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-500 w-6">{index + 1}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-white truncate">{item.path}</span>
                                <span className="text-sm text-slate-400">{item.count}</span>
                              </div>
                              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                  style={{ width: `${(item.count / (stats.pathStats[0]?.count || 1)) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 状态码分布 */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">状态码分布</CardTitle>
                      <CardDescription className="text-slate-400">HTTP响应状态统计</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.statusCodeStats.map((item) => (
                          <div key={item.statusCode} className="flex items-center gap-3">
                            <Badge className={`${getStatusCodeColor(item.statusCode)} text-white`}>
                              {item.statusCode}
                            </Badge>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-slate-400">
                                  {item.statusCode < 300 ? '成功' : item.statusCode < 400 ? '重定向' : item.statusCode < 500 ? '客户端错误' : '服务器错误'}
                                </span>
                                <span className="text-sm text-white">{item.count}</span>
                              </div>
                              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${getStatusCodeColor(item.statusCode)} rounded-full`}
                                  style={{ width: `${(item.count / stats.totalVisits) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 设备分布 */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Monitor className="w-5 h-5" />
                        设备分布
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        {stats.deviceStats.map((item) => (
                          <div key={item.device} className="text-center p-4 bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-white">{item.count}</div>
                            <div className="text-sm text-slate-400">{item.device}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 浏览器分布 */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Chrome className="w-5 h-5" />
                        浏览器分布
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {stats.browserStats.map((item) => (
                          <div key={item.browser} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                            <span className="text-white">{item.browser}</span>
                            <Badge variant="secondary">{item.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 每日访问量 */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">每日访问量（最近7天）</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 h-40">
                      {Object.entries(stats.dailyVisits)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([date, count]) => (
                          <div key={date} className="flex-1 flex flex-col items-center gap-2">
                            <div 
                              className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t"
                              style={{ 
                                height: `${Math.max(20, (count / Math.max(...Object.values(stats.dailyVisits))) * 100)}%` 
                              }}
                            />
                            <span className="text-xs text-slate-500">{date.slice(5)}</span>
                            <span className="text-xs text-slate-400">{count}</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* 会话追踪 */}
          <TabsContent value="sessions" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">会话列表</CardTitle>
                    <CardDescription className="text-slate-400">点击查看详细访问路径</CardDescription>
                  </div>
                  <div className="text-sm text-slate-400">
                    共 {sessionsTotal} 个会话
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-400">会话ID</TableHead>
                      <TableHead className="text-slate-400">位置</TableHead>
                      <TableHead className="text-slate-400">设备</TableHead>
                      <TableHead className="text-slate-400">浏览器</TableHead>
                      <TableHead className="text-slate-400">请求数</TableHead>
                      <TableHead className="text-slate-400">停留时间</TableHead>
                      <TableHead className="text-slate-400">开始时间</TableHead>
                      <TableHead className="text-slate-400">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.sessionId} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="font-mono text-sm text-slate-300">
                          {session.sessionId.slice(0, 20)}...
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {session.city && session.country ? `${session.city}, ${session.country}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-600 text-slate-300">
                            {session.device || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">{session.browser || '-'}</TableCell>
                        <TableCell className="text-slate-300">{session.totalRequests}</TableCell>
                        <TableCell className="text-slate-300">{formatTime(session.duration)}</TableCell>
                        <TableCell className="text-slate-300 text-sm">{formatDate(session.startTime)}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => fetchSessionDetail(session.sessionId)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            查看路径
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* 分页 */}
                <div className="flex items-center justify-between mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSessionsPage(p => Math.max(1, p - 1))}
                    disabled={sessionsPage === 1}
                    className="border-slate-600 text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一页
                  </Button>
                  <span className="text-sm text-slate-400">
                    第 {sessionsPage} / {Math.ceil(sessionsTotal / 20)} 页
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSessionsPage(p => p + 1)}
                    disabled={sessionsPage >= Math.ceil(sessionsTotal / 20)}
                    className="border-slate-600 text-slate-300"
                  >
                    下一页
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 日志列表 */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">访问日志</CardTitle>
                    <CardDescription className="text-slate-400">所有请求记录</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-slate-400 text-sm">路径:</Label>
                      <Input 
                        placeholder="搜索路径..."
                        value={searchPath}
                        onChange={(e) => setSearchPath(e.target.value)}
                        className="w-40 bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => { setLogsPage(1); fetchLogs(); }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Search className="w-4 h-4 mr-1" />
                      搜索
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-400">时间</TableHead>
                      <TableHead className="text-slate-400">路径</TableHead>
                      <TableHead className="text-slate-400">方法</TableHead>
                      <TableHead className="text-slate-400">状态码</TableHead>
                      <TableHead className="text-slate-400">响应时间</TableHead>
                      <TableHead className="text-slate-400">设备</TableHead>
                      <TableHead className="text-slate-400">IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="text-slate-300 text-sm">{formatDate(log.createdAt)}</TableCell>
                        <TableCell className="font-mono text-sm text-blue-400">{log.path}</TableCell>
                        <TableCell>
                          <Badge className={getMethodColor(log.method)}>{log.method}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusCodeColor(log.statusCode)} text-white`}>
                            {log.statusCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">{log.responseTime ? `${log.responseTime}ms` : '-'}</TableCell>
                        <TableCell className="text-slate-300">{log.device || '-'}</TableCell>
                        <TableCell className="text-slate-300 font-mono text-sm">{log.ipAddress || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* 分页 */}
                <div className="flex items-center justify-between mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                    disabled={logsPage === 1}
                    className="border-slate-600 text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一页
                  </Button>
                  <span className="text-sm text-slate-400">
                    第 {logsPage} / {Math.ceil(logsTotal / 20)} 页
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLogsPage(p => p + 1)}
                    disabled={logsPage >= Math.ceil(logsTotal / 20)}
                    className="border-slate-600 text-slate-300"
                  >
                    下一页
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* 会话详情弹窗 */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              访问路径追踪
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              会话ID: {selectedSession?.sessionSummary.sessionId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6">
                {/* 会话摘要 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-xs text-slate-400">总请求数</div>
                    <div className="text-lg font-bold text-white">{selectedSession.sessionSummary.totalRequests}</div>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-xs text-slate-400">访问页面数</div>
                    <div className="text-lg font-bold text-white">{selectedSession.sessionSummary.uniquePages}</div>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-xs text-slate-400">总停留时间</div>
                    <div className="text-lg font-bold text-white">{formatTime(selectedSession.sessionSummary.totalDuration)}</div>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-xs text-slate-400">设备</div>
                    <div className="text-lg font-bold text-white">{selectedSession.sessionSummary.device || '-'}</div>
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                {/* 访问路径时间线 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">访问路径</h3>
                  <div className="relative">
                    {selectedSession.pathSequence.map((step, index) => (
                      <div key={index} className="flex items-start gap-4 pb-6">
                        {/* 步骤指示器 */}
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {step.step}
                          </div>
                          {index < selectedSession.pathSequence.length - 1 && (
                            <div className="w-0.5 h-full bg-slate-600 mt-2" />
                          )}
                        </div>
                        
                        {/* 内容 */}
                        <div className="flex-1 bg-slate-700/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-blue-400">{step.path}</span>
                              <Badge className={getMethodColor(step.method)}>{step.method}</Badge>
                              <Badge className={`${getStatusCodeColor(step.statusCode)} text-white`}>
                                {step.statusCode}
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-400">{formatDate(step.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            {step.responseTime && (
                              <span>响应: {step.responseTime}ms</span>
                            )}
                            {step.duration !== null && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                停留: {formatTime(step.duration)}
                              </span>
                            )}
                            {step.referer && (
                              <span>来源: {step.referer}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* 箭头 */}
                        {index < selectedSession.pathSequence.length - 1 && (
                          <div className="flex items-center text-slate-500">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 入口和出口页面 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-900/30 border border-green-700/50 rounded-lg">
                    <div className="text-xs text-green-400 mb-1">入口页面</div>
                    <div className="font-mono text-white">{selectedSession.sessionSummary.entryPage}</div>
                  </div>
                  <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
                    <div className="text-xs text-red-400 mb-1">出口页面</div>
                    <div className="font-mono text-white">{selectedSession.sessionSummary.exitPage}</div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
