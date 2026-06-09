import { auth } from "@/auth";
import { resumeService } from "@/lib/services/resume-service";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import HistoryTable from "@/components/HistoryTable";

export default async function HistoryPage() {
    const session = await auth();
    // BYPASS FOR LOCAL DEVELOPMENT: Use mock user if no session
    const userEmail = session?.user?.email || "local-dev@example.com";
    const userName = session?.user?.name || "Local Developer";

    // Fetch history from Google Drive instead of PostgreSQL
    const history = await resumeService.getHistory(userEmail);
    console.log(`📊 History Page: Loaded ${history?.length || 0} records for ${userEmail}`);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:pt-8 md:px-12 md:pb-12 font-sans text-gray-900">
            <div className="max-w-full mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-5">
                        <Link href="/" className="group p-2.5 rounded-2xl bg-white shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all active:scale-95">
                            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                        </Link>
                        <div>
                        <div className="flex items-baseline gap-3">
                            <h1 className="text-3xl font-black tracking-tight text-slate-900">Analysis <span className="text-indigo-600">History</span></h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-black">
                                {history?.length || 0} Total
                            </span>
                        </div>

                        </div>
                    </div>

                </div>

                {/* Client Table Component */}
                <HistoryTable
                    history={history as any}
                    userName={userName}
                />
            </div>
        </div>
    );
}
