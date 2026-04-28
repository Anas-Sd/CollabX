"use client";
import { useRoomStore } from "../../src/store/roomStore";
import { Activity } from "lucide-react";

export default function LogsPanel() {
    const logs = useRoomStore(s => s.logs);

    const safeLogs = (logs || [])
        .slice()
        .sort((a, b) => {
            const timeA = new Date(a?.timestamp || 0).getTime();
            const timeB = new Date(b?.timestamp || 0).getTime();
            return timeB - timeA; // newest first
        });

    return (
        <div className="flex flex-col  h-full bg-[#111118]">
            <div className="p-4 border-b border-[#1E1E2E] flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-[#E8E8F0]">Security Logs</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {safeLogs.length === 0 ? (
                    <div className="text-xs text-[#6B6B80] italic text-center py-4">
                        No activity recorded yet...
                    </div>
                ) : (
                    safeLogs.map((log, idx) => {
                        if (!log) return null;

                        const timeStr = log.timestamp
                            ? new Date(log.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                              })
                            : "Unknown Time";

                        return (
                            <div key={log.id || idx} className="flex gap-3 text-xs">
                                <span className="text-[#6B6B80] font-mono shrink-0">
                                    [{timeStr}]
                                </span>
                                <div>
                                    <span className="font-semibold text-[#E8E8F0]">
                                        {log.userName || "System"}
                                    </span>
                                    <span className="text-[#8B8B9E] ml-1.5">
                                        {log.action || "Unknown action"}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}