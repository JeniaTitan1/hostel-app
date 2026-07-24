import React from "react";

export default function BookingsTab({
    pendingBookings = [],
    inboxSearch,
    setInboxSearch,
    handleApprove,
    handleReject,
    actionProcessingId,
    deleteProcessingId,
    handleDeleteBooking,
    emailChangeRequests = [],
    handleApproveEmailChange,
    setRejectingEmailReqId,
    setEmailRejectionReason,
    isSuperAdmin,
}) {
    const filteredPendingBookings = pendingBookings.filter((b) => {
        if (!inboxSearch) return true;
        const q = inboxSearch.toLowerCase();
        return (
            b.user?.name?.toLowerCase().includes(q) ||
            b.user?.email?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-6">
            {/* ================= 0. ЗАПИТИ НА ЗМІНУ EMAIL (ГОЛОВНИЙ АДМІН) ================= */}
            {isSuperAdmin && emailChangeRequests.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📧</span>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                    Запити на зміну електронної пошти (
                                    {emailChangeRequests.length})
                                </h3>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    Студенти, які просять змінити свою
                                    електронну пошту
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-gray-700 text-xs">
                        {emailChangeRequests.map((req) => (
                            <div
                                key={req.id}
                                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-gray-700/20"
                            >
                                <div className="space-y-1">
                                    <div className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                                        <span>
                                            {req.user?.name || "Студент"}
                                        </span>
                                        <span className="text-[10px] bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">
                                            ID: #{req.user_id}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <span className="font-mono bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                                            {req.old_email}
                                        </span>
                                        <span>➔</span>
                                        <span className="font-mono bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-bold">
                                            {req.new_email}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleApproveEmailChange(req.id)
                                        }
                                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all shadow-xs"
                                    >
                                        Схвалити
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRejectingEmailReqId(req.id);
                                            setEmailRejectionReason("");
                                        }}
                                        className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg text-xs font-semibold transition-all border border-red-200 dark:border-red-800"
                                    >
                                        Відхилити
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ================= 1. ПАНЕЛЬ ЗАЯВОК (INBOX) ================= */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
                            Вхідні заявки на розгляд
                        </h3>
                        <p className="text-xs text-gray-400">
                            Схвалення або відхилення запитів на поселення
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Пошук за ім'ям / email..."
                            value={inboxSearch}
                            onChange={(e) => setInboxSearch(e.target.value)}
                            className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-56"
                        />
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30 shrink-0">
                            {filteredPendingBookings.length} очікують
                        </span>
                    </div>
                </div>

                {filteredPendingBookings.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                        Немає нових заявок на бронювання.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    <th className="p-4">Користувач</th>
                                    <th className="p-4">Корпус</th>
                                    <th className="p-4">Поверх / Кімната</th>
                                    <th className="p-4 text-right">Дії</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-200">
                                {filteredPendingBookings.map((booking) => {
                                    const targetRoom = booking.new_room_id
                                        ? booking.new_room
                                        : booking.room;

                                    return (
                                        <tr
                                            key={booking.id}
                                            className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors"
                                        >
                                            <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                <div className="font-bold">
                                                    {booking.user?.name ||
                                                        "Користувач"}
                                                </div>
                                                <div className="text-[11px] text-gray-400 font-mono">
                                                    {booking.user?.email}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {targetRoom?.building?.name ||
                                                    "Корпус"}
                                            </td>
                                            <td className="p-4">
                                                Кімн. №{targetRoom?.room_number}{" "}
                                                (Поверх {targetRoom?.floor})
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        actionProcessingId ===
                                                        booking.id
                                                    }
                                                    onClick={() =>
                                                        handleApprove(
                                                            booking.id,
                                                        )
                                                    }
                                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all disabled:opacity-50"
                                                >
                                                    {actionProcessingId ===
                                                    booking.id
                                                        ? "..."
                                                        : "Схвалити"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleReject(booking.id)
                                                    }
                                                    className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg text-xs font-semibold transition-all border border-red-200 dark:border-red-800"
                                                >
                                                    Відхилити
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
