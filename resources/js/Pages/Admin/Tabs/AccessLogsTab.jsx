import React, { useState, useEffect } from "react";
import QrAccessScannerModal from "@/Components/QrAccessScannerModal";

export default function AccessLogsTab({
    accessLogs = [],
    accessStats = {
        entries_today: 0,
        exits_today: 0,
        denied_today: 0,
        total_scans_today: 0,
    },
    buildings = [],
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("all"); // 'all' | 'entry' | 'exit'
    const [selectedStatus, setSelectedStatus] = useState("all"); // 'all' | 'granted' | 'denied'
    const [selectedBuilding, setSelectedBuilding] = useState("all");
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [logsList, setLogsList] = useState(accessLogs);
    const [stats, setStats] = useState(accessStats);
    const [togglingLogId, setTogglingLogId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    useEffect(() => {
        setLogsList(accessLogs);
    }, [accessLogs]);

    useEffect(() => {
        setStats(accessStats);
    }, [accessStats]);

    // Фільтрація логів
    const filteredLogs = logsList.filter((log) => {
        // Пошук за текстом
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const userName = log.user?.name?.toLowerCase() || "";
            const userEmail = log.user?.email?.toLowerCase() || "";
            const orderNum = log.booking?.order_number?.toLowerCase() || "";
            const roomNum = log.booking?.room?.room_number?.toLowerCase() || "";
            const notes = log.notes?.toLowerCase() || "";

            if (
                !userName.includes(q) &&
                !userEmail.includes(q) &&
                !orderNum.includes(q) &&
                !roomNum.includes(q) &&
                !notes.includes(q)
            ) {
                return false;
            }
        }

        // Фільтр за типом (вхід / вихід)
        if (selectedType !== "all" && log.type !== selectedType) {
            return false;
        }

        // Фільтр за статусом
        if (selectedStatus !== "all" && log.status !== selectedStatus) {
            return false;
        }

        // Фільтр за корпусом
        if (selectedBuilding !== "all") {
            const logBuildingId =
                log.building_id || log.booking?.room?.building_id;
            if (String(logBuildingId) !== String(selectedBuilding)) {
                return false;
            }
        }

        return true;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedType, selectedStatus, selectedBuilding]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / perPage));
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    const handleScanSuccess = (scanData) => {
        if (scanData.log) {
            const newLogEntry = {
                id: scanData.log.id,
                created_at: scanData.log.created_at,
                type: scanData.type,
                status: scanData.status,
                method: "qr_scan",
                notes: scanData.notes || null,
                user: scanData.student,
                booking: scanData.room
                    ? {
                          order_number: scanData.order_number,
                          room: scanData.room,
                      }
                    : null,
                building: scanData.room?.building || null,
            };

            // Оновлюємо або додаємо новий запис
            setLogsList((prev) => {
                const exists = prev.some((l) => l.id === scanData.log.id);
                if (exists) {
                    return prev.map((l) =>
                        l.id === scanData.log.id ? { ...l, type: scanData.type } : l
                    );
                }
                return [newLogEntry, ...prev];
            });

            // Оновлення лічильників
            setStats((prev) => {
                const next = { ...prev, total_scans_today: prev.total_scans_today + 1 };
                if (scanData.status === "granted") {
                    if (scanData.type === "entry") {
                        next.entries_today = prev.entries_today + 1;
                    } else {
                        next.exits_today = prev.exits_today + 1;
                    }
                } else {
                    next.denied_today = prev.denied_today + 1;
                }
                return next;
            });
        }
    };

    // Швидке перемикання напрямку прямо з таблиці
    const handleToggleLogRow = async (logId, currentType) => {
        const nextType = currentType === "entry" ? "exit" : "entry";
        setTogglingLogId(logId);

        try {
            const res = await fetch(
                route("admin.access-logs.update-direction", logId),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN":
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute("content") || "",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ type: nextType }),
                }
            );

            const data = await res.json();
            if (data.success) {
                setLogsList((prev) =>
                    prev.map((l) =>
                        l.id === logId ? { ...l, type: nextType } : l
                    )
                );

                setStats((prev) => ({
                    ...prev,
                    entries_today:
                        nextType === "entry"
                            ? prev.entries_today + 1
                            : Math.max(0, prev.entries_today - 1),
                    exits_today:
                        nextType === "exit"
                            ? prev.exits_today + 1
                            : Math.max(0, prev.exits_today - 1),
                }));
            }
        } catch (e) {
            console.error("Toggle log direction error:", e);
        } finally {
            setTogglingLogId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString;
            return d.toLocaleString("uk-UA", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });
        } catch (e) {
            return dateString;
        }
    };

    // Кольорове стилізування запису КПП за статусом та напрямком
    const getLogRowStyle = (log) => {
        const isGranted = log.status === "granted";
        const isEntry = log.type === "entry";

        if (!isGranted) {
            // Заборонено / відмова — м'який червоно-рожевий застережний градієнт
            return {
                gradient: "bg-gradient-to-r from-rose-500/[0.08] via-rose-500/[0.025] to-transparent hover:from-rose-500/[0.13] dark:from-rose-500/[0.12] dark:via-rose-500/[0.035] dark:to-transparent dark:hover:from-rose-500/[0.18]",
                borderColor: "border-l-rose-500",
                borderClass: "border-l-4 border-l-rose-500",
                isDenied: true,
            };
        }

        if (isEntry) {
            // Вхід — м'який смарагдовий градієнт
            return {
                gradient: "bg-gradient-to-r from-emerald-500/[0.065] via-emerald-500/[0.02] to-transparent hover:from-emerald-500/[0.11] dark:from-emerald-500/[0.09] dark:via-emerald-500/[0.025] dark:to-transparent dark:hover:from-emerald-500/[0.15]",
                borderColor: "border-l-emerald-500",
                borderClass: "border-l-4 border-l-emerald-500",
                isDenied: false,
            };
        }

        // Вихід — м'який теплий бурштиновий градієнт
        return {
            gradient: "bg-gradient-to-r from-amber-500/[0.065] via-amber-500/[0.02] to-transparent hover:from-amber-500/[0.11] dark:from-amber-500/[0.09] dark:via-amber-500/[0.025] dark:to-transparent dark:hover:from-amber-500/[0.15]",
            borderColor: "border-l-amber-500",
            borderClass: "border-l-4 border-l-amber-500",
            isDenied: false,
        };
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* 1. ВЕРХНІ КАРТКИ СТАТИСТИКИ (KPI) - Адаптовані для будь-яких екранів */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {/* Зайшло сьогодні */}
                <div className="p-3 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/40">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">
                            {stats.entries_today}
                        </div>
                        <div className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-gray-400 truncate">
                            Входів сьогодні
                        </div>
                    </div>
                </div>

                {/* Вийшло сьогодні */}
                <div className="p-3 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800/40">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">
                            {stats.exits_today}
                        </div>
                        <div className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-gray-400 truncate">
                            Виходів сьогодні
                        </div>
                    </div>
                </div>

                {/* Відмовлено у вході */}
                <div className="p-3 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-800/40">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">
                            {stats.denied_today}
                        </div>
                        <div className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-gray-400 truncate">
                            Відмовлено
                        </div>
                    </div>
                </div>

                {/* Всього перевірок */}
                <div className="p-3 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-800/40">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white truncate">
                            {stats.total_scans_today}
                        </div>
                        <div className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-gray-400 truncate">
                            Всього КПП
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. ПАНЕЛЬ ДІЙ ТА ФІЛЬТРІВ */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-3xl shadow-sm p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-gray-900 dark:text-white text-base sm:text-lg tracking-tight">
                                Журнал КПП
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black whitespace-nowrap">
                                {filteredLogs.length} {filteredLogs.length === 1 ? "запис" : filteredLogs.length < 5 ? "записи" : "записів"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Фіксація входу/виходу студентів та гостей через цифрові QR-перепустки
                        </p>
                        {/* Кольорові підказки статусів */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px] text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="font-medium">Вхід (Дозволено)</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="font-medium">Вихід</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                <span className="font-medium">Заборонено (Відмова)</span>
                            </span>
                        </div>
                    </div>

                    {/* Головна кнопка виклику сканера */}
                    <button
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/25 active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <span>Відкрити QR-сканер КПП</span>
                    </button>
                </div>

                {/* Рядок фільтрів */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 dark:border-gray-700">
                    {/* Пошук */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Пошук студента, ордера, кімнати..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>

                    {/* Фільтр за типом: Вхід / Вихід */}
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                        <option value="all">Усі напрямки (Вхід + Вихід)</option>
                        <option value="entry">Тільки Вхід</option>
                        <option value="exit">Тільки Вихід</option>
                    </select>

                    {/* Фільтр за статусом */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                        <option value="all">Усі статуси</option>
                        <option value="granted">Доступ дозволено</option>
                        <option value="denied">Відмовлено</option>
                    </select>

                    {/* Фільтр за гуртожитком */}
                    {buildings.length > 0 && (
                        <select
                            value={selectedBuilding}
                            onChange={(e) => setSelectedBuilding(e.target.value)}
                            className="text-xs rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                            <option value="all">Усі гуртожитки</option>
                            {buildings.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* 3. СПИСОК ЖУРНАЛУ ВІДВІДУВАНЬ (Адаптивні картки на мобільних + повноцінна таблиця на ПК) */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-3xl shadow-sm overflow-hidden">
                {paginatedLogs.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center text-slate-400 dark:text-gray-500">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-gray-700/60 text-slate-400 dark:text-gray-500 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="font-bold text-sm text-slate-600 dark:text-gray-300">
                            Журнал відвідувань порожній
                        </p>
                        <p className="text-xs mt-1">
                            Натисніть кнопку «Відкрити QR-сканер КПП», щоб зафіксувати перший прохід студента.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* А) МОБІЛЬНИЙ ВИГЛЯД (КАРТКИ ДЛЯ СМАРТФОНІВ) */}
                        <div className="block md:hidden divide-y divide-slate-100 dark:divide-gray-700/60 p-2 sm:p-3">
                            {paginatedLogs.map((log) => {
                                const isEntry = log.type === "entry";
                                const isGranted = log.status === "granted";
                                const isToggling = togglingLogId === log.id;
                                const style = getLogRowStyle(log);

                                return (
                                    <div
                                        key={log.id}
                                        className={`p-3.5 rounded-2xl border border-slate-200/70 dark:border-gray-700/80 space-y-2.5 my-2 border-l-4 ${style.borderClass} ${style.gradient} shadow-2xs transition-all`}
                                    >
                                        {/* Верхній рядок: Аватар + Ім'я + Дата */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border transition-all ${
                                                    log.user?.gender === "female"
                                                        ? "bg-pink-100/80 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/80 shadow-[0_0_10px_rgba(244,63,94,0.18)]"
                                                        : log.user?.gender === "male"
                                                        ? "bg-blue-100/80 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80 shadow-[0_0_10px_rgba(59,130,246,0.18)]"
                                                        : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 border-slate-200 dark:border-gray-600"
                                                }`}>
                                                    {log.user?.name?.charAt(0)?.toUpperCase() || "S"}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                                        {log.user?.name || "Невідомий"}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 truncate">
                                                        {log.user?.specialty ? `${log.user.specialty}` : log.user?.email}
                                                        {log.user?.group ? ` (${log.user.group})` : ""}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-[11px] font-mono font-bold text-slate-600 dark:text-gray-300">
                                                    {formatDate(log.created_at)}
                                                </div>
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border mt-0.5 ${
                                                        isGranted
                                                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                                                            : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 animate-pulse"
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isGranted ? "bg-emerald-500" : "bg-rose-500"}`} />
                                                    <span>{isGranted ? "Дозволено" : "Заборонено"}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Інфо про кімнату та корпус */}
                                        <div className="text-xs text-slate-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xs p-2 rounded-xl border border-slate-100 dark:border-gray-700/60 flex items-center justify-between shadow-2xs">
                                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px] truncate">
                                                {log.booking?.room
                                                    ? `Кімната ${log.booking.room.room_number} (Поверх ${log.booking.room.floor})`
                                                    : "Кімната не закріплена"}
                                            </span>
                                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                                                {log.booking?.room?.building?.name || log.building?.name || "Гуртожиток"}
                                            </span>
                                        </div>

                                        {/* Нижній рядок: Перемикач напрямку + хто перевірив */}
                                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-gray-700/40">
                                            <button
                                                type="button"
                                                disabled={isToggling}
                                                onClick={() => handleToggleLogRow(log.id, log.type)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer border shadow-2xs ${
                                                    isEntry
                                                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/50"
                                                        : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/50"
                                                }`}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${isEntry ? "bg-emerald-500" : "bg-amber-500"}`} />
                                                <span>{isEntry ? "ВХІД" : "ВИХІД"}</span>
                                                <span className="text-[10px] opacity-60 font-normal lowercase">(змінити ⇄)</span>
                                            </button>

                                            <div className="text-[10px] text-slate-400">
                                                Перевірив: <strong className="text-slate-700 dark:text-gray-300">{log.scanner?.name || "КПП"}</strong>
                                            </div>
                                        </div>

                                        {/* Примітки у мобільному вигляді, якщо є */}
                                        {log.notes && (
                                            <div className={`text-[10px] px-2.5 py-1 rounded-lg ${
                                                !isGranted 
                                                    ? "bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50 font-medium" 
                                                    : "bg-slate-100/80 dark:bg-gray-800 text-slate-500 dark:text-gray-400"
                                            }`}>
                                                {log.notes}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Б) ДЕСКТОПНИЙ ВИГЛЯД (ПОВНОЦІННА ТАБЛИЦЯ ДЛЯ ПК) */}
                        <div className="hidden md:block overflow-x-auto scrollbar-none">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50/80 dark:bg-gray-900/50 text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3.5">Час / Дата</th>
                                        <th className="px-4 py-3.5">Студент</th>
                                        <th className="px-4 py-3.5">Кімната / Корпус</th>
                                        <th className="px-4 py-3.5">Напрямок (Клік для зміни)</th>
                                        <th className="px-4 py-3.5">Статус</th>
                                        <th className="px-4 py-3.5">КПП / Перевірив</th>
                                        <th className="px-4 py-3.5">Примітки</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-gray-700/60 text-slate-700 dark:text-gray-200">
                                    {paginatedLogs.map((log) => {
                                        const isEntry = log.type === "entry";
                                        const isGranted = log.status === "granted";
                                        const isToggling = togglingLogId === log.id;
                                        const style = getLogRowStyle(log);

                                        return (
                                            <tr
                                                key={log.id}
                                                className={`transition-all ${style.gradient}`}
                                            >
                                                {/* Час із лівою кольоровою смугою border-l-4 */}
                                                <td className={`px-4 py-3.5 whitespace-nowrap font-semibold text-slate-700 dark:text-gray-300 font-mono text-[11px] border-l-4 ${style.borderColor}`}>
                                                    {formatDate(log.created_at)}
                                                </td>

                                                {/* Студент */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border transition-all ${
                                                            log.user?.gender === "female"
                                                                ? "bg-pink-100/80 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/80 shadow-[0_0_10px_rgba(244,63,94,0.18)]"
                                                                : log.user?.gender === "male"
                                                                ? "bg-blue-100/80 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80 shadow-[0_0_10px_rgba(59,130,246,0.18)]"
                                                                : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 border-slate-200 dark:border-gray-600"
                                                        }`}>
                                                            {log.user?.name?.charAt(0)?.toUpperCase() || "S"}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-900 dark:text-white truncate">
                                                                {log.user?.name || "Невідомий"}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 dark:text-gray-500 truncate">
                                                                {log.user?.specialty ? `${log.user.specialty}` : log.user?.email}
                                                                {log.user?.group ? ` (${log.user.group})` : ""}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Кімната та корпус */}
                                                <td className="px-4 py-3.5">
                                                    {log.booking?.room ? (
                                                        <div>
                                                            <div className="font-bold text-emerald-700 dark:text-emerald-400">
                                                                Кімната {log.booking.room.room_number} (Поверх {log.booking.room.floor})
                                                            </div>
                                                            <div className="text-[10px] text-slate-400">
                                                                {log.booking.room.building?.name || log.building?.name}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px]">
                                                            {log.building?.name || "Не закріплено"}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Напрямок (Інтерактивна кнопка швидкої зміни) */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        disabled={isToggling}
                                                        onClick={() => handleToggleLogRow(log.id, log.type)}
                                                        title="Натисніть для швидкої зміни: Вхід ⇄ Вихід"
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer border shadow-2xs ${
                                                            isEntry
                                                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/50 hover:bg-emerald-100"
                                                                : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/50 hover:bg-amber-100"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-2 h-2 rounded-full ${
                                                                isEntry ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                                                            }`}
                                                        />
                                                        <span>{isEntry ? "Вхід" : "Вихід"}</span>
                                                        <svg className="w-3 h-3 opacity-60 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                        </svg>
                                                    </button>
                                                </td>

                                                {/* Статус */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-2xs ${
                                                            isGranted
                                                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                                                                : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 animate-pulse"
                                                        }`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isGranted ? "bg-emerald-500" : "bg-rose-500"}`} />
                                                        <span>{isGranted ? "Дозволено" : "Заборонено"}</span>
                                                    </span>
                                                </td>

                                                {/* Хто перевірив */}
                                                <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-gray-400 text-[11px]">
                                                    <div className="font-semibold text-slate-800 dark:text-gray-200">
                                                        {log.scanner?.name || "КПП"}
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${
                                                        log.method === "qr_scan"
                                                            ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40"
                                                            : "bg-slate-100 dark:bg-gray-700/60 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-600"
                                                    }`}>
                                                        {log.method === "qr_scan" ? "QR-сканер" : "Вручну"}
                                                    </span>
                                                </td>

                                                {/* Примітки */}
                                                <td className="px-4 py-3.5 text-[11px] max-w-xs">
                                                    {log.notes ? (
                                                        <span className={`${
                                                            !isGranted 
                                                                ? "text-rose-700 dark:text-rose-400 font-medium" 
                                                                : "text-slate-500 dark:text-gray-400"
                                                        } line-clamp-2`} title={log.notes}>
                                                            {log.notes}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-gray-600">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Пагінація */}
                        {totalPages > 1 && (
                            <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-gray-400">
                                <div>
                                    Сторінка <strong>{currentPage}</strong> з <strong>{totalPages}</strong>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer text-xs"
                                    >
                                        ← Попередня
                                    </button>
                                    <button
                                        type="button"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer text-xs"
                                    >
                                        Наступна →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Модальне вікно сканера */}
            <QrAccessScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
            />
        </div>
    );
}
