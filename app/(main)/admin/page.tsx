import { auth } from "@/auth";
import { adminService } from "@/lib/services/admin-service";
import { ShieldCheck, UserCheck, ShieldAlert, Settings, LayoutDashboard, Database, ExternalLink } from "lucide-react";
import Image from "next/image";
import logo from "../../assets/innovcentric-logo-transparent.png";
import { AddUserForm } from "@/components/admin/AddUserForm";
import { UserListTable } from "@/components/admin/UserListTable";

import { SystemStats } from "@/components/admin/SystemStats";

const SUPER_ADMIN = "hiring@innovcentric.com";

export default async function AdminPage() {
    const session = await auth();

    // 1. Security Check: Only the Super Admin can see this page
    if (session?.user?.email !== SUPER_ADMIN) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 font-sans">
                <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 text-center space-y-6 border border-red-100/50 backdrop-blur-xl">
                    <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                        <ShieldAlert className="w-12 h-12 text-red-600" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Restricted</h1>
                        <p className="text-slate-500 font-medium leading-relaxed">Only the Super Admin is authorized to access the core management dashboard.</p>
                    </div>
                    <a href="/" className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95">
                        Return to Base
                    </a>
                </div>
            </div>
        );
    }

    // 2. Fetch Users from Sheet
    const users = await adminService.getUsers();

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* BACKGROUND ELEMENTS */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-50/40 rounded-full blur-[100px]" />
            </div>

            <div className="w-full px-4 md:px-8 py-2 md:py-4 space-y-4">
                
                {/* HEADER SECTION */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-200/60">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                                <Image src={logo} alt="Logo" width={40} height={40} className="w-8 h-8 object-contain" />
                            </div>
                            <div className="h-8 w-[1px] bg-slate-200 hidden md:block" />
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none group">
                                    Admin <span className="text-indigo-600">Console</span>
                                </h1>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.2em]">Operational</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="px-4 py-2 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center gap-2 group hover:border-indigo-200 transition-all">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Super Admin</p>
                        </div>
                        
                        <div className="px-4 py-2 bg-indigo-600 shadow-lg shadow-indigo-100 rounded-xl flex items-center gap-2 text-white">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{users.length} Authorized</span>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
                    
                    {/* LEFT SIDE: CONTROL PANEL */}
                    <div className="space-y-6 lg:sticky lg:top-8">
                        <AddUserForm />
                        <SystemStats />
                    </div>

                    {/* RIGHT SIDE: CANDIDATE TABLE */}
                    <UserListTable users={users} />
                </div>

                {/* FOOTER AREA */}
                <div className="flex flex-col md:flex-row items-center justify-between py-10 text-slate-400 gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest">Powered by</span>
                        <Image src={logo} alt="InnovCentric" width={80} height={20} className="w-20 opacity-40 grayscale hover:grayscale-0 transition-all" />
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                            Security Protocol <ExternalLink className="w-3 h-3" />
                        </a>
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                            API Documentation <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
