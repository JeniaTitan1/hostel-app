import React, { useState, useMemo } from "react";
import ContactStudentModal from "../Modals/ContactStudentModal";

function formatRelativeTime(dateStr) {
    if (!dateStr) return "—";
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return "Щойно";
        if (diffMinutes < 60) return `${diffMinutes} хв тому`;
        if (diffHours < 24) return `${diffHours} год тому`;
        if (diffDays === 1) {
            return `Вчора, ${date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
        }
        if (diffDays < 7) return `${diffDays} дн. тому`;
        return date.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
    } catch {
        return dateStr;
    }
}

function formatFullDateTime(dateStr) {
    if (!dateStr) return "";
    try {
        return new Date(dateStr).toLocaleString("uk-UA", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return dateStr;
    }
}

export default function TicketsTab({ tickets = [], handleResolveTicket, ticketProcessingId }) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending' | 'resolved'
    const [buildingFilter, setBuildingFilter] = useState("all");
    const [expandedTicketId, setExpandedTicketId] = useState(null);
    const [confirmResolveId, setConfirmResolveId] = useState(null);
    const [contactStudent, setContactStudent] = useState(null);

    // KPI Counters
    const pendingCount = useMemo(() => tickets.filter((t) => t.status === "pending").length, [tickets]);
    const resolvedCount = useMemo(() => tickets.filter((t) => t.status === "resolved").length, [tickets]);
    const totalCount = tickets.length;

    // Unique buildings for filter
    const uniqueBuildings = useMemo(() => {
        const map = new Map();
        tickets.forEach((t) => {
            if (t.room?.building) {
                map.set(t.room.building.id, t.room.building);
            }
        });
        return Array.from(map.values());
    }, [tickets]);

    // Filtered tickets
    const filteredTickets = useMemo(() => {
        return tickets.filter((t) => {
            if (statusFilter !== "all" && t.status !== statusFilter) {
                return false;
            }
            if (buildingFilter !== "all" && String(t.room?.building_id || t.room?.building?.id) !== String(buildingFilter)) {
                return false;
            }
            if (search.trim()) {
                const q = search.trim().toLowerCase();
                const studentName = (t.user?.name || "").toLowerCase();
                const studentEmail = (t.user?.email || "").toLowerCase();
                const roomNum = String(t.room?.room_number || "").toLowerCase();
                const buildingName = (t.room?.building?.name || "").toLowerCase();
                const desc = (t.description || "").toLowerCase();

                return (
                    studentName.includes(q) ||
                    studentEmail.includes(q) ||
                    roomNum.includes(q) ||
                    buildingName.includes(q) ||
                    desc.includes(q)
                );
            }
            return true;
        });
    }, [tickets, statusFilter, buildingFilter, search]);

    const toggleExpand = (id) => {
        setExpandedTicketId((prev) => (prev === id ? null : id));
    };

    return (
        <div className="space-y-4">
            {/* KPI Статистика заявок (3 гармонійні віджети для світлої та темної теми) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. Потребують виконання (В роботі) */}
                <div
                    onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
                    className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer select-none bg-white dark:bg-gray-800 ${
                        statusFilter === "pending"
                            ? "border-amber-400 dark:border-amber-500 ring-2 ring-amber-500/25 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs"
                            : "border-slate-200/80 dark:border-gray-700/80 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-xs"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                Потребують виконання
                            </p>
                            <h4 className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400 tracking-tight">
                                {pendingCount}
                            </h4>
                        </div>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-900/50 shadow-3xs">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2.5 text-[11px] text-gray-400 dark:text-gray-400 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${pendingCount > 0 ? "bg-amber-500 animate-pulse" : "bg-gray-400"}`} />
                        <span>{pendingCount === 0 ? "Всі несправності усунено" : "Очікують на прихід майстра"}</span>
                    </div>
                </div>

                {/* 2. Успішно вирішено */}
                <div
                    onClick={() => setStatusFilter(statusFilter === "resolved" ? "all" : "resolved")}
                    className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer select-none bg-white dark:bg-gray-800 ${
                        statusFilter === "resolved"
                            ? "border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs"
                            : "border-slate-200/80 dark:border-gray-700/80 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-xs"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                Успішно вирішено
                            </p>
                            <h4 className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400 tracking-tight">
                                {resolvedCount}
                            </h4>
                        </div>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900/50 shadow-3xs">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2.5 text-[11px] text-gray-400 dark:text-gray-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Завершених технічних робіт</span>
                    </div>
                </div>

                {/* 3. Всього звернень (Гармонійний стиль без чорного блоку) */}
                <div
                    onClick={() => setStatusFilter("all")}
                    className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer select-none bg-white dark:bg-gray-800 ${
                        statusFilter === "all"
                            ? "border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-500/25 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs"
                            : "border-slate-200/80 dark:border-gray-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-xs"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                Всього звернень
                            </p>
                            <h4 className="text-2xl font-black mt-1 text-gray-900 dark:text-white tracking-tight">
                                {totalCount}
                            </h4>
                        </div>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-900/50 shadow-3xs">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2.5 text-[11px] text-gray-400 dark:text-gray-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>Журнал усіх звернень студентів</span>
                    </div>
                </div>
            </div>

            {/* Основний контейнер списку */}
            <div className="bg-white dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm overflow-hidden">
                {/* Панель керування та пошуку */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-gray-700 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
                    {/* Пошук з ідеальним відступом (без налізання іконки) */}
                    <div className="relative flex-1 max-w-md">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-gray-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Пошук за студентом, кімнатою або текстом..."
                            className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-gray-700/80 border border-slate-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500 transition-all font-medium shadow-3xs"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Фільтри статусу та корпусів */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Таби статусу */}
                        <div className="flex items-center bg-slate-100 dark:bg-gray-700/80 p-1 rounded-xl gap-1 border border-slate-200/60 dark:border-gray-600/70 shrink-0">
                            <button
                                type="button"
                                onClick={() => setStatusFilter("all")}
                                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                                    statusFilter === "all"
                                        ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs font-bold border border-slate-200/80 dark:border-gray-600"
                                        : "text-slate-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                                }`}
                            >
                                Всі ({totalCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter("pending")}
                                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                                    statusFilter === "pending"
                                        ? "bg-amber-500 text-white shadow-xs font-bold"
                                        : "text-slate-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 font-medium"
                                }`}
                            >
                                В роботі ({pendingCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter("resolved")}
                                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                                    statusFilter === "resolved"
                                        ? "bg-emerald-600 text-white shadow-xs font-bold"
                                        : "text-slate-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
                                }`}
                            >
                                Вирішені ({resolvedCount})
                            </button>
                        </div>

                        {/* Фільтр корпусу */}
                        {uniqueBuildings.length > 1 && (
                            <select
                                value={buildingFilter}
                                onChange={(e) => setBuildingFilter(e.target.value)}
                                className="py-1.5 px-2.5 bg-slate-50 dark:bg-gray-700/80 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">Всі корпуси</option>
                                {uniqueBuildings.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Список або таблиця */}
                {tickets.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-gray-700 flex items-center justify-center mx-auto text-slate-400 dark:text-gray-400 mb-3">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Немає заяв на ремонт</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                            Коли студенти повідомлять про технічні несправності у кімнатах, вони з'являться тут.
                        </p>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-gray-700 flex items-center justify-center mx-auto text-slate-400 dark:text-gray-400 mb-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Нічого не знайдено за вашим фільтром
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setStatusFilter("all");
                                setBuildingFilter("all");
                            }}
                            className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Скинути всі фільтри
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards View */}
                        <div className="md:hidden divide-y divide-slate-100 dark:divide-gray-750">
                            {filteredTickets.map((t) => {
                                const isExpanded = expandedTicketId === t.id;
                                const isConfirming = confirmResolveId === t.id;

                                return (
                                    <div key={t.id} className="p-4 space-y-3 bg-white dark:bg-gray-800">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-100 dark:border-indigo-900/50">
                                                    {(t.user?.name || "С")[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-xs text-gray-900 dark:text-white">
                                                        {t.user?.name || "Студент"}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">
                                                        {formatRelativeTime(t.created_at)}
                                                    </div>
                                                </div>
                                            </div>

                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                                    t.status === "resolved"
                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60"
                                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60"
                                                }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        t.status === "resolved" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                                                    }`}
                                                />
                                                <span>{t.status === "resolved" ? "Вирішено" : "В роботі"}</span>
                                            </span>
                                        </div>

                                        {/* Кімната та корпус */}
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-gray-200 font-bold border border-slate-200/70 dark:border-gray-600">
                                                Кімната №{t.room?.room_number}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400 truncate text-[11px]">
                                                {t.room?.building?.name}
                                            </span>
                                        </div>

                                        {/* Опис проблеми */}
                                        <div
                                            onClick={() => toggleExpand(t.id)}
                                            className="p-3 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-100 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 leading-relaxed cursor-pointer"
                                        >
                                            <span className="text-gray-400 dark:text-gray-400 block text-[9.5px] uppercase font-bold tracking-wider mb-1">
                                                Опис несправності:
                                            </span>
                                            <p className={isExpanded ? "" : "line-clamp-2"}>
                                                {t.description}
                                            </p>
                                            {t.description && t.description.length > 80 && (
                                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 inline-block">
                                                    {isExpanded ? "Згорнути ▲" : "Читати повністю ▼"}
                                                </span>
                                            )}
                                        </div>

                                        {/* Кнопки дій */}
                                        <div className="flex items-center gap-2 pt-1">
                                            {t.status === "pending" && (
                                                <>
                                                    {isConfirming ? (
                                                        <div className="flex-1 flex items-center justify-between gap-1 p-1 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/80">
                                                            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-200 pl-2">
                                                                Підтвердити?
                                                            </span>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setConfirmResolveId(null);
                                                                        handleResolveTicket(t.id);
                                                                    }}
                                                                    disabled={ticketProcessingId === t.id}
                                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
                                                                >
                                                                    {ticketProcessingId === t.id ? "..." : "Так"}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setConfirmResolveId(null)}
                                                                    className="px-2.5 py-1.5 bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg text-xs font-medium"
                                                                >
                                                                    Ні
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmResolveId(t.id)}
                                                            disabled={ticketProcessingId === t.id}
                                                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span>Вирішити</span>
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {t.user && (
                                                <button
                                                    type="button"
                                                    onClick={() => setContactStudent(t.user)}
                                                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0"
                                                    title="Зв'язатися зі студентом"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                    </svg>
                                                    <span>Зв'язок</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-slate-50/90 dark:bg-gray-900/80 border-b border-slate-200/80 dark:border-gray-700 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                                    <tr>
                                        <th className="py-3.5 px-4 w-52">Студент</th>
                                        <th className="py-3.5 px-4 w-48">Кімната / Корпус</th>
                                        <th className="py-3.5 px-4">Опис несправності</th>
                                        <th className="py-3.5 px-4 w-28">Час подачі</th>
                                        <th className="py-3.5 px-4 w-28">Статус</th>
                                        <th className="py-3.5 px-4 text-right w-40">Дія</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-gray-700/80 text-gray-700 dark:text-gray-200">
                                    {filteredTickets.map((t) => {
                                        const isExpanded = expandedTicketId === t.id;
                                        const isConfirming = confirmResolveId === t.id;

                                        return (
                                            <React.Fragment key={t.id}>
                                                <tr
                                                    onClick={() => toggleExpand(t.id)}
                                                    className={`hover:bg-slate-50/80 dark:hover:bg-gray-700/40 transition-colors cursor-pointer ${
                                                        isExpanded ? "bg-slate-50/90 dark:bg-gray-750/70" : ""
                                                    }`}
                                                >
                                                    {/* Студент */}
                                                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
                                                                {(t.user?.name || "С")[0]}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-xs text-gray-900 dark:text-white truncate" title={t.user?.name}>
                                                                    {t.user?.name || "Студент"}
                                                                </div>
                                                                <div className="text-[10.5px] text-gray-400 dark:text-gray-400 truncate" title={t.user?.email}>
                                                                    {t.user?.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Кімната та корпус */}
                                                    <td className="p-4">
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-gray-200 font-bold border border-slate-200/80 dark:border-gray-600 text-xs shadow-3xs">
                                                            <span>№{t.room?.room_number}</span>
                                                        </div>
                                                        <div
                                                            className="text-[10.5px] text-gray-400 dark:text-gray-400 mt-0.5 truncate max-w-[160px]"
                                                            title={t.room?.building?.name}
                                                        >
                                                            {t.room?.building?.name}
                                                        </div>
                                                    </td>

                                                    {/* Опис поломки */}
                                                    <td className="p-4 text-gray-700 dark:text-gray-200">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`leading-relaxed ${
                                                                    isExpanded ? "" : "line-clamp-1"
                                                                }`}
                                                                title={t.description}
                                                            >
                                                                {t.description}
                                                            </span>
                                                            {t.description && t.description.length > 55 && (
                                                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold shrink-0 select-none">
                                                                    {isExpanded ? "▲" : "▼"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Дата та час */}
                                                    <td className="p-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                        <span title={formatFullDateTime(t.created_at)} className="text-[11px] font-medium">
                                                            {formatRelativeTime(t.created_at)}
                                                        </span>
                                                    </td>

                                                    {/* Статус */}
                                                    <td className="p-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                                t.status === "resolved"
                                                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/60"
                                                                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/60"
                                                            }`}
                                                        >
                                                            <span
                                                                className={`w-1.5 h-1.5 rounded-full ${
                                                                    t.status === "resolved" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                                                                }`}
                                                            />
                                                            <span>{t.status === "resolved" ? "Вирішено" : "В роботі"}</span>
                                                        </span>
                                                    </td>

                                                    {/* Кнопки дій */}
                                                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* Кнопка зв'язку */}
                                                            {t.user && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setContactStudent(t.user)}
                                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                                                                    title="Зв'язатися зі студентом"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                                    </svg>
                                                                </button>
                                                            )}

                                                            {/* Вирішення з підтвердженням */}
                                                            {t.status === "pending" && (
                                                                <>
                                                                    {isConfirming ? (
                                                                        <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 p-0.5 rounded-lg border border-amber-200 dark:border-amber-800/80">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setConfirmResolveId(null);
                                                                                    handleResolveTicket(t.id);
                                                                                }}
                                                                                disabled={ticketProcessingId === t.id}
                                                                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-2xs"
                                                                            >
                                                                                {ticketProcessingId === t.id ? "..." : "Так"}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setConfirmResolveId(null)}
                                                                                className="px-1.5 py-0.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] font-medium"
                                                                            >
                                                                                Ні
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setConfirmResolveId(t.id)}
                                                                            disabled={ticketProcessingId === t.id}
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70 rounded-lg text-xs font-bold transition-all hover:shadow-2xs active:scale-95"
                                                                            title="Позначити заявку як виконану"
                                                                        >
                                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                            <span>Вирішити</span>
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Розгорнутий рядок з повним описом */}
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/60 dark:bg-gray-900/40 border-b border-slate-100 dark:border-gray-700/80">
                                                        <td colSpan={6} className="p-4 pt-1.5">
                                                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200/80 dark:border-gray-700 space-y-3 shadow-2xs">
                                                                <div>
                                                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                                                                        Повний опис несправності:
                                                                    </div>
                                                                    <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                                                        {t.description}
                                                                    </p>
                                                                </div>

                                                                <div className="pt-2 border-t border-slate-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                                                                    <div className="flex items-center gap-3">
                                                                        <span>
                                                                            Зареєстровано: <strong className="text-gray-700 dark:text-gray-300">{formatFullDateTime(t.created_at)}</strong>
                                                                        </span>
                                                                        {t.user?.phone && (
                                                                            <span>
                                                                                Телефон: <strong className="text-gray-700 dark:text-gray-300">{t.user.phone}</strong>
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {t.user && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setContactStudent(t.user)}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg transition-colors border border-indigo-100 dark:border-indigo-800/60"
                                                                        >
                                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                                            </svg>
                                                                            <span>Надіслати повідомлення студенту</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Модальне вікно контакту зі студентом */}
            {contactStudent && (
                <ContactStudentModal
                    student={contactStudent}
                    onClose={() => setContactStudent(null)}
                />
            )}
        </div>
    );
}
