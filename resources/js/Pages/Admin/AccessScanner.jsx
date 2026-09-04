import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import QrAccessScannerModal from "@/Components/QrAccessScannerModal";
import AccessLogsTab from "@/Pages/Admin/Tabs/AccessLogsTab";

export default function AccessScanner({
    auth,
    initialLogs = { data: [] },
    stats = {
        entries_today: 0,
        exits_today: 0,
        denied_today: 0,
        total_scans_today: 0,
    },
    buildings = [],
}) {
    const [isScannerOpen, setIsScannerOpen] = useState(true);
    const logs = initialLogs.data || [];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="font-black text-xl text-gray-900 dark:text-white leading-tight flex items-center gap-2">
                            <span>Пропускний пункт (Сканер)</span>
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Режим оператора вахти: швидка фіксація входу та виходу через QR-перепустки
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsScannerOpen(true)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            <span>Відкрити сканер камери</span>
                        </button>

                        <Link
                            href={route("admin.dashboard")}
                            className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 text-slate-800 dark:text-white font-bold text-xs transition-colors"
                        >
                            До адмін-панелі
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Пропускний пункт" />

            <div className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <AccessLogsTab
                    accessLogs={logs}
                    accessStats={stats}
                    buildings={buildings}
                />
            </div>

            <QrAccessScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
            />
        </AuthenticatedLayout>
    );
}
