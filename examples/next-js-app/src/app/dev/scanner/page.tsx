"use client"

import { useEffect, useState } from "react"
import { tw } from "tailwind-styled-v4"

// Styled components untuk scanner dashboard
const PageContainer = tw.div({
    base: "min-h-screen bg-slate-950 text-slate-100 font-mono",
})

const Header = tw.header({
    base: "sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm px-6 py-4",
})

const Title = tw.h1({
    base: "text-2xl font-bold text-emerald-400",
})

const Subtitle = tw.p({
    base: "text-xs text-slate-400 mt-1",
})

const Main = tw.main({
    base: "p-6 max-w-7xl mx-auto",
})

const Section = tw.section({
    base: "mb-8",
})

const SectionTitle = tw.h2({
    base: "text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2",
})

const StatGrid = tw.div({
    base: "grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6",
})

const StatCard = tw.div({
    base: "bg-slate-800 border border-slate-700 rounded-lg p-4",
})

const StatValue = tw.div({
    base: "text-2xl font-bold text-emerald-400",
})

const StatLabel = tw.div({
    base: "text-xs text-slate-400 mt-1",
})

const LogContainer = tw.div({
    base: "bg-slate-900 border border-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs",
})

const LogEntry = tw.div({
    base: "mb-2 leading-relaxed",
    variants: {
        type: {
            hit: "text-emerald-400",
            miss: "text-amber-400",
            native: "text-cyan-400",
            error: "text-red-400",
            info: "text-slate-300",
        },
    },
    defaultVariants: { type: "info" },
})

const Timestamp = tw.span({
    base: "text-slate-500 mr-2",
})

const Badge = tw.span({
    base: "inline-flex items-center px-2 py-1 rounded text-xs font-semibold mr-2",
    variants: {
        color: {
            green: "bg-emerald-500/20 text-emerald-300",
            amber: "bg-amber-500/20 text-amber-300",
            blue: "bg-blue-500/20 text-blue-300",
            cyan: "bg-cyan-500/20 text-cyan-300",
            red: "bg-red-500/20 text-red-300",
            slate: "bg-slate-500/20 text-slate-300",
        },
    },
    defaultVariants: { color: "green" },
})

interface ScannerLog {
    id: string
    timestamp: string
    type: "hit" | "miss" | "native" | "error" | "info"
    message: string
    file?: string
}

export default function ScannerDevPage() {
    const [logs, setLogs] = useState<ScannerLog[]>([])
    const [stats, setStats] = useState({
        totalScans: 0,
        cacheHits: 0,
        cacheMisses: 0,
        errors: 0,
    })
    const [isMonitoring, setIsMonitoring] = useState(true)
    const [loading, setLoading] = useState(true)
    const [source, setSource] = useState<"real" | "mock">("mock")

    // Fetch scanner logs from API
    const fetchLogs = async () => {
        try {
            const res = await fetch("/api/scanner/logs", {
                cache: "no-store",
            })
            const data = await res.json()

            if (data.success) {
                setLogs(data.logs)
                setStats(data.stats)
                setSource(data.source)
            }
        } catch (error) {
            console.error("Failed to fetch logs:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Initial fetch
        fetchLogs()

        // Poll for updates every 2 seconds
        const interval = setInterval(fetchLogs, 2000)

        return () => clearInterval(interval)
    }, [])

    const hitRate = stats.totalScans > 0 ? ((stats.cacheHits / stats.totalScans) * 100).toFixed(1) : "0"

    return (
        <PageContainer>
            <Header>
                <Title>🔍 Scanner DevTools</Title>
                <Subtitle>Real-time Tailwind Scanner Diagnostics & Performance Metrics</Subtitle>
            </Header>

            <Main>
                {/* Data Source Badge */}
                <div className="mb-6 flex items-center gap-2">
                    <span className="text-xs text-slate-400">Data Source:</span>
                    <Badge color={source === "real" ? "green" : "slate"}>{source.toUpperCase()}</Badge>
                    {loading && <span className="text-xs text-slate-500">Loading...</span>}
                </div>

                {/* Stats Section */}
                <Section>
                    <SectionTitle>📊 Performance Metrics</SectionTitle>
                    <StatGrid>
                        <StatCard>
                            <StatValue>{stats.totalScans}</StatValue>
                            <StatLabel>Total Scans</StatLabel>
                        </StatCard>
                        <StatCard>
                            <StatValue className="text-emerald-400">{stats.cacheHits}</StatValue>
                            <StatLabel>Cache Hits</StatLabel>
                        </StatCard>
                        <StatCard>
                            <StatValue className="text-amber-400">{stats.cacheMisses}</StatValue>
                            <StatLabel>Cache Misses</StatLabel>
                        </StatCard>
                        <StatCard>
                            <StatValue>{hitRate}%</StatValue>
                            <StatLabel>Hit Rate</StatLabel>
                        </StatCard>
                    </StatGrid>
                </Section>

                {/* Scanner Status */}
                <Section>
                    <SectionTitle>
                        ⚙️ Scanner Status
                        <Badge color={isMonitoring ? "green" : "red"}>{isMonitoring ? "● ACTIVE" : "● INACTIVE"}</Badge>
                    </SectionTitle>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <StatCard>
                            <div className="text-sm">
                                <div className="text-slate-400">Engine</div>
                                <div className="text-emerald-400 font-semibold mt-1">Rust Parser (NAPI)</div>
                            </div>
                        </StatCard>
                        <StatCard>
                            <div className="text-sm">
                                <div className="text-slate-400">Speed</div>
                                <div className="text-emerald-400 font-semibold mt-1">~50ms / scan</div>
                            </div>
                        </StatCard>
                        <StatCard>
                            <div className="text-sm">
                                <div className="text-slate-400">Files Tracked</div>
                                <div className="text-blue-400 font-semibold mt-1">81 TypeScript/JSX</div>
                            </div>
                        </StatCard>
                        <StatCard>
                            <div className="text-sm">
                                <div className="text-slate-400">Classes Found</div>
                                <div className="text-cyan-400 font-semibold mt-1">~1200 strings</div>
                            </div>
                        </StatCard>
                    </div>
                </Section>

                {/* Live Log Feed */}
                <Section>
                    <SectionTitle>📋 Scanner Log Feed ({logs.length} entries)</SectionTitle>
                    <LogContainer>
                        {logs.length === 0 ? (
                            <LogEntry type="info">No logs available yet...</LogEntry>
                        ) : (
                            logs.map((log) => (
                                <LogEntry key={log.id} type={log.type}>
                                    <Timestamp>{log.timestamp}</Timestamp>
                                    <Badge
                                        color={
                                            log.type === "hit"
                                                ? "green"
                                                : log.type === "miss"
                                                    ? "amber"
                                                    : log.type === "native"
                                                        ? "cyan"
                                                        : log.type === "error"
                                                            ? "red"
                                                            : "blue"
                                        }
                                    >
                                        {log.type.toUpperCase()}
                                    </Badge>
                                    {log.message}
                                    {log.file && <span className="text-slate-500 ml-2">{log.file}</span>}
                                </LogEntry>
                            ))
                        )}
                    </LogContainer>
                </Section>

                {/* Performance Details */}
                <Section>
                    <SectionTitle>⚡ Performance Details</SectionTitle>
                    <div className="grid gap-4">
                        <StatCard>
                            <div className="text-sm space-y-2">
                                <div>
                                    <span className="text-slate-400">Startup Time:</span>
                                    <span className="text-emerald-400 ml-2 font-semibold">386ms</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Avg Scan Time:</span>
                                    <span className="text-emerald-400 ml-2 font-semibold">6.7ms/file</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Cache Strategy:</span>
                                    <span className="text-blue-400 ml-2 font-semibold">LRU + Deterministic</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Rust Speedup:</span>
                                    <span className="text-cyan-400 ml-2 font-semibold">425× vs JS</span>
                                </div>
                            </div>
                        </StatCard>
                    </div>
                </Section>

                {/* File Scan Details */}
                <Section>
                    <SectionTitle>📁 File Scan Details (Sample)</SectionTitle>
                    <div className="space-y-2">
                        {[
                            { file: "/src/proxy.ts", classes: 12, status: "hit" as const },
                            { file: "/src/hooks/useTheme.ts", classes: 8, status: "hit" as const },
                            { file: "/src/components/Alert.tsx", classes: 24, status: "hit" as const },
                            { file: "/src/components/Button.tsx", classes: 42, status: "hit" as const },
                            {
                                file: "/app/learn/dasar-css/box-model/page.tsx",
                                classes: 156,
                                status: "miss" as const,
                            },
                        ].map((item, idx) => (
                            <StatCard key={idx}>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs">
                                        <div className="text-slate-300">{item.file}</div>
                                        <div className="text-slate-500 mt-1">{item.classes} classes found</div>
                                    </div>
                                    <Badge color={item.status === "hit" ? "green" : "amber"}>{item.status.toUpperCase()}</Badge>
                                </div>
                            </StatCard>
                        ))}
                    </div>
                </Section>
            </Main>
        </PageContainer>
    )
}
