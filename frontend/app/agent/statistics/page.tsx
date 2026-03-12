"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/agent/hooks/useAuth";
import { ResponsiveLayout } from "@/components/layout";
import {
  fetchDashboardStats,
  fetchConversationTrend,
  fetchAgentWorkload,
  fetchVisitorAnalytics,
  type DashboardStats,
  type ConversationTrendData,
  type AgentWorkloadData,
  type VisitorSourceData,
} from "@/features/agent/services/statisticsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageCircle,
  Users,
  UserCheck,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowLeft,
} from "lucide-react";
import { toast } from "@/hooks/useToast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// 颜色配置
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// 时间范围选项
const TIME_RANGES = [
  { value: 7, label: "近7天" },
  { value: 14, label: "近14天" },
  { value: 30, label: "近30天" },
];

export default function StatisticsPage(props: any = {}) {
  const { embedded = false } = props;
  const router = useRouter();
  const { agent } = useAuth();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  // 统计数据
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<ConversationTrendData[]>([]);
  const [workloadData, setWorkloadData] = useState<AgentWorkloadData[]>([]);
  const [sourceData, setSourceData] = useState<VisitorSourceData[]>([]);

  // 加载统计数据
  const loadStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, trend, workload, visitor] = await Promise.all([
        fetchDashboardStats(),
        fetchConversationTrend(days),
        fetchAgentWorkload(days),
        fetchVisitorAnalytics(days),
      ]);

      setDashboardStats(dashboard);
      setTrendData(trend.trend);
      setWorkloadData(workload.workload);
      setSourceData(visitor.sources);
    } catch (error) {
      console.error("加载统计数据失败:", error);
      toast.error((error as Error).message || "加载统计数据失败");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // 概览卡片
  const StatCard = ({
    title,
    value,
    icon: Icon,
    description,
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    description?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  // 头部内容
  const headerContent = (
    <div className="bg-card border-b p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">数据统计</h1>
        {!embedded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/agent/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {TIME_RANGES.map((range) => (
          <Button
            key={range.value}
            variant={days === range.value ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );

  // 主内容区
  const mainContent = (
    <div className="flex-1 overflow-y-auto p-4 scrollbar-auto">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <span className="text-muted-foreground">加载中...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 概览卡片 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="今日对话"
              value={dashboardStats?.today_conversations || 0}
              icon={MessageCircle}
              description="今日新增对话数"
            />
            <StatCard
              title="今日消息"
              value={dashboardStats?.today_messages || 0}
              icon={Activity}
              description="今日发送消息数"
            />
            <StatCard
              title="活跃访客"
              value={dashboardStats?.active_visitors || 0}
              icon={Users}
              description="有活跃对话的访客"
            />
            <StatCard
              title="总对话数"
              value={dashboardStats?.total_conversations || 0}
              icon={TrendingUp}
              description="系统累计对话数"
            />
          </div>

          {/* 对话趋势图表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                对话趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="对话数"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="message_count"
                      name="消息数"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* 客服工作量和访客来源 */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* 客服工作量 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  客服工作量
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workloadData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={workloadData.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="agent_name" type="category" width={80} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="conversation_count" name="对话数" fill="#3b82f6" />
                      <Bar dataKey="message_count" name="消息数" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    暂无数据
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 访客来源 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  访客来源
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ source, percent }) =>
                          `${source} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="source"
                      >
                        {sourceData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    暂无数据
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 客服工作量表格 */}
          {workloadData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>客服工作量详情</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">客服</th>
                        <th className="text-right py-2 px-4">对话数</th>
                        <th className="text-right py-2 px-4">回复消息数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workloadData.map((item) => (
                        <tr key={item.agent_id} className="border-b">
                          <td className="py-2 px-4">{item.agent_name}</td>
                          <td className="text-right py-2 px-4">
                            {item.conversation_count}
                          </td>
                          <td className="text-right py-2 px-4">
                            {item.message_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  // 嵌入模式
  if (embedded) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {headerContent}
        {mainContent}
      </div>
    );
  }

  return <ResponsiveLayout main={mainContent} header={headerContent} />;
}
