import { NextRequest, NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

interface ScannerLog {
    id: string
    timestamp: string
    type: "hit" | "miss" | "native" | "error" | "info"
    message: string
    file?: string
}

interface ScannerStats {
    totalScans: number
    cacheHits: number
    cacheMisses: number
    errors: number
}

/**
 * GET /api/scanner/logs
 *
 * Returns real-time scanner logs and statistics from:
 * - .next/tw-classes/_scanner-log.jsonl (if it exists)
 * - Console output capture (if available)
 *
 * Response:
 * {
 *   logs: ScannerLog[],
 *   stats: ScannerStats,
 *   success: boolean
 * }
 */
export async function GET(request: NextRequest) {
    try {
        // Path to scanner log file (created by build process)
        const logFilePath = join(process.cwd(), ".next/tw-classes/_scanner-log.jsonl")

        let logs: ScannerLog[] = []
        let stats: ScannerStats = {
            totalScans: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0,
        }

        // Try to read real logs from file
        if (existsSync(logFilePath)) {
            try {
                const content = readFileSync(logFilePath, "utf-8")
                const lines = content
                    .split("\n")
                    .filter((line) => line.trim())
                    .slice(-50) // Get last 50 entries

                logs = lines.map((line, idx) => {
                    try {
                        const entry = JSON.parse(line)
                        return {
                            id: String(idx),
                            timestamp: entry.timestamp || new Date().toLocaleTimeString(),
                            type: entry.type || "info",
                            message: entry.message || "Scanner event",
                            file: entry.file,
                        }
                    } catch {
                        return {
                            id: String(idx),
                            timestamp: new Date().toLocaleTimeString(),
                            type: "info" as const,
                            message: line,
                        }
                    }
                })

                // Calculate stats from logs
                stats.totalScans = logs.length
                stats.cacheHits = logs.filter((l) => l.type === "hit").length
                stats.cacheMisses = logs.filter((l) => l.type === "miss").length
                stats.errors = logs.filter((l) => l.type === "error").length
            } catch (error) {
                console.error("Error reading scanner log file:", error)
            }
        }

        // If no real logs, return mock data for demonstration
        if (logs.length === 0) {
            logs = generateMockLogs()
            stats = {
                totalScans: 57,
                cacheHits: 54,
                cacheMisses: 3,
                errors: 0,
            }
        }

        return NextResponse.json(
            {
                success: true,
                logs,
                stats,
                timestamp: new Date().toISOString(),
                source: existsSync(logFilePath) ? "real" : "mock",
            },
            {
                headers: {
                    "Cache-Control": "no-store", // Don't cache, always fresh
                },
            }
        )
    } catch (error) {
        console.error("API error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                logs: generateMockLogs(),
                stats: {
                    totalScans: 0,
                    cacheHits: 0,
                    cacheMisses: 0,
                    errors: 1,
                },
            },
            { status: 500 }
        )
    }
}

/**
 * POST /api/scanner/logs
 *
 * Add a new scanner log entry (useful for client-side logging)
 *
 * Body: { type: string, message: string, file?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { type, message, file } = body

        // Validate input
        if (!type || !message) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing required fields: type, message",
                },
                { status: 400 }
            )
        }

        // In production, append to log file
        const logFilePath = join(process.cwd(), ".next/tw-classes/_scanner-log.jsonl")

        const logEntry = {
            timestamp: new Date().toISOString(),
            type,
            message,
            file,
        }

        // Note: In production, use proper file I/O or database
        // For now, just acknowledge receipt
        console.log("[Scanner API] New log:", logEntry)

        return NextResponse.json(
            {
                success: true,
                logged: logEntry,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("API POST error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        )
    }
}

/**
 * Generate mock scanner logs for demonstration
 */
function generateMockLogs(): ScannerLog[] {
    return [
        {
            id: "1",
            timestamp: new Date(Date.now() - 60000).toLocaleTimeString(),
            type: "hit",
            message: "[scanner] cache HIT",
            file: "/src/proxy.ts",
        },
        {
            id: "2",
            timestamp: new Date(Date.now() - 58000).toLocaleTimeString(),
            type: "hit",
            message: "[scanner] cache HIT",
            file: "/src/hooks/useTheme.ts",
        },
        {
            id: "3",
            timestamp: new Date(Date.now() - 56000).toLocaleTimeString(),
            type: "hit",
            message: "[scanner] cache HIT",
            file: "/src/components/Alert.tsx",
        },
        {
            id: "4",
            timestamp: new Date(Date.now() - 54000).toLocaleTimeString(),
            type: "hit",
            message: "[scanner] cache HIT",
            file: "/src/components/Button.tsx",
        },
        {
            id: "5",
            timestamp: new Date(Date.now() - 52000).toLocaleTimeString(),
            type: "hit",
            message: "[scanner] cache HIT",
            file: "/src/components/Card.tsx",
        },
        {
            id: "6",
            timestamp: new Date(Date.now() - 50000).toLocaleTimeString(),
            type: "hit",
            message: "[scanner] cache HIT",
            file: "/src/app/layout.tsx",
        },
        {
            id: "7",
            timestamp: new Date(Date.now() - 48000).toLocaleTimeString(),
            type: "hit",
            message: "[scanner] cache HIT",
            file: "/src/app/page.tsx",
        },
        {
            id: "8",
            timestamp: new Date(Date.now() - 46000).toLocaleTimeString(),
            type: "hit",
            message: "[scanner] cache HIT",
            file: "/src/app/learn/layout.tsx",
        },
        {
            id: "9",
            timestamp: new Date(Date.now() - 44000).toLocaleTimeString(),
            type: "hit",
            message: "[scanner] cache HIT",
            file: "/src/app/learn/styles.ts",
        },
        {
            id: "10",
            timestamp: new Date(Date.now() - 42000).toLocaleTimeString(),
            type: "hit",
            message: "[scanner] cache HIT",
            file: "/src/app/learn/mentor/styles.ts",
        },
        {
            id: "11",
            timestamp: new Date(Date.now() - 40000).toLocaleTimeString(),
            type: "miss",
            message: "[scanner] cache MISS",
            file: "/src/app/learn/dasar-css/box-model/page.tsx",
        },
        {
            id: "12",
            timestamp: new Date(Date.now() - 38000).toLocaleTimeString(),
            type: "native",
            message: "[scanner] [native] using native parser",
            file: "/node_modules/tailwind-styled-v4/native/tailwind-styled-native.node",
        },
        {
            id: "13",
            timestamp: new Date(Date.now() - 5000).toLocaleTimeString(),
            type: "info",
            message: "[scanner] Completed full scan in 50ms",
        },
        {
            id: "14",
            timestamp: new Date().toLocaleTimeString(),
            type: "hit",
            message: "[scanner] cache HIT",
            file: "/src/app/learn/medium/typography/page.tsx",
        },
    ]
}
