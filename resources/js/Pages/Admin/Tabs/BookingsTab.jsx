import React, { useState } from "react";
import ContactStudentModal from "../Modals/ContactStudentModal";

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
    const [contactingUser, setContactingUser] = useState(null);
    const filteredPendingBookings = pendingBookings.filter((b) => {
        if (!inboxSearch) return true;
        const q = inboxSearch.toLowerCase();
        return (
            b.user?.name?.toLowerCase().includes(q) ||
            b.user?.email?.toLowerCase().includes(q)
        );
    });

    const checkMixedRoomStatus = (booking) => {
        const targetRoom = booking.new_room_id
            ? booking.new_room
            : booking.room;
        if (!targetRoom) return null;

        const studentGender = booking.user?.gender;
        const approvedOccupants = (targetRoom.bookings || []).filter(
            (b) =>
                b.status === "approved" &&
                b.id !== booking.id &&
                b.user_id !== booking.user_id,
        );

        if (approvedOccupants.length === 0) return null;

        const occupantGenders = [
            ...new Set(
                approvedOccupants
                    .map((b) => b.user?.gender)
                    .filter(Boolean),
            ),
        ];
        const isAlreadyMixed = occupantGenders.length > 1;
        const isConflict =
            isAlreadyMixed ||
            (studentGender &&
                occupantGenders.length === 1 &&
                occupantGenders[0] !== studentGender);

        if (!isConflict) return null;

        const maleCount = approvedOccupants.filter(
            (b) => b.user?.gender === "male",
        ).length;
        const femaleCount = approvedOccupants.filter(
            (b) => b.user?.gender === "female",
        ).length;

        let shortSummary = "";
        if (isAlreadyMixed) {
            shortSummary = `Змішана кімната (${maleCount} чол., ${femaleCount} жін.)`;
        } else if (occupantGenders[0] === "female") {
            const countText =
                femaleCount === 1 ? "1 дівчина" : `${femaleCount} дівчини`;
            shortSummary = `Змішана: хлопець до дівчат (у кімнаті: ${countText})`;
        } else if (occupantGenders[0] === "male") {
            const countText =
                maleCount === 1 ? "1 хлопець" : `${maleCount} хлопці`;
            shortSummary = `Змішана: дівчина до хлопців (у кімнаті: ${countText})`;
        }

        return {
            isConflict: true,
            shortSummary,
        };
    };

    const handleApproveWithPrompt = (booking, mixedStatus) => {
        if (mixedStatus) {
            if (
                !window.confirm(
                    `Увага: це поселення створить змішану кімнату (${mixedStatus.shortSummary}). Схвалити?`,
                )
            ) {
                return;
            }
        }
        handleApprove(booking.id);
    };

    return (
        <div className="space-y-6">
            {/* ================= 0. ЗАПИТИ НА ЗМІНУ EMAIL (ГОЛОВНИЙ АДМІН) ================= */}
            {isSuperAdmin && emailChangeRequests.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
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
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
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
                                        className="px-3.5 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg text-xs font-semibold transition-all border border-red-200 dark:border-red-800"
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
                            Схвалення або відхилення запитів на поселення та переселення
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
                    <>
                        {/* Mobile Cards View */}
                        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredPendingBookings.map((booking) => {
                                const targetRoom = booking.new_room_id
                                    ? booking.new_room
                                    : booking.room;
                                const mixedStatus = checkMixedRoomStatus(booking);

                                return (
                                    <div
                                        key={booking.id}
                                        className="p-4 space-y-3 bg-white dark:bg-gray-800 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                                                        {booking.user?.name || "Користувач"}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        booking.user?.gender === "female"
                                                            ? "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800"
                                                            : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                                    }`}>
                                                        {booking.user?.gender === "female" ? "Жіноча" : "Чоловіча"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-xs text-gray-400 font-mono">
                                                        {booking.user?.email}
                                                    </span>
                                                    {booking.user && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setContactingUser(booking.user)}
                                                            className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 font-bold text-[10px] hover:bg-sky-100 dark:hover:bg-sky-900/50 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                                            title="Зв'язатися зі студентом"
                                                        >
                                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                            </svg>
                                                            <span>Зв'язатися</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide shrink-0 ${
                                                booking.new_room_id 
                                                    ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                                                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                            }`}>
                                                {booking.new_room_id ? "Переселення" : "Поселення"}
                                            </span>
                                        </div>

                                        <div className="p-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700 text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Корпус:</span>
                                                <span className="font-semibold text-gray-800 dark:text-gray-200">{targetRoom?.building?.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Кімната:</span>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    Кімн. №{targetRoom?.room_number} (Поверх {targetRoom?.floor})
                                                </span>
                                            </div>
                                            {mixedStatus && (
                                                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-1.5 border-t border-slate-200/60 dark:border-gray-700 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                                    <span>{mixedStatus.shortSummary}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <button
                                                type="button"
                                                disabled={actionProcessingId === booking.id}
                                                onClick={() => handleApproveWithPrompt(booking, mixedStatus)}
                                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 shadow-xs active:scale-95"
                                            >
                                                {actionProcessingId === booking.id ? "..." : "Схвалити"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleReject(booking.id)}
                                                className="w-full py-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl text-xs font-bold transition-all border border-red-200 dark:border-red-800 active:scale-95"
                                            >
                                                Відхилити
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                        <th className="p-4">Користувач</th>
                                        <th className="p-4">Тип заявки</th>
                                        <th className="p-4">Корпус</th>
                                        <th className="p-4">Поверх / Кімната</th>
                                        <th className="p-4 text-right whitespace-nowrap w-48">Дії</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-200">
                                    {filteredPendingBookings.map((booking) => {
                                        const targetRoom = booking.new_room_id
                                            ? booking.new_room
                                            : booking.room;
                                        const mixedStatus = checkMixedRoomStatus(booking);

                                        return (
                                            <tr
                                                key={booking.id}
                                                className={`transition-colors ${
                                                    mixedStatus
                                                        ? "bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/30 dark:hover:bg-amber-950/20"
                                                        : "hover:bg-slate-50/50 dark:hover:bg-gray-700/30"
                                                }`}
                                            >
                                                <td className="p-4 font-medium text-gray-900 dark:text-white align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold">
                                                            {booking.user?.name || "Користувач"}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            booking.user?.gender === "female"
                                                                ? "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800"
                                                                : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                                        }`}>
                                                            {booking.user?.gender === "female" ? "Жіноча" : "Чоловіча"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[11px] text-gray-400 font-mono truncate">
                                                            {booking.user?.email}
                                                        </span>
                                                        {booking.user && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setContactingUser(booking.user)}
                                                                className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 font-bold text-[10px] hover:bg-sky-100 dark:hover:bg-sky-900/50 inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                                                                title="Зв'язатися зі студентом"
                                                            >
                                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                                </svg>
                                                                <span>Зв'язатися</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                                                        booking.new_room_id 
                                                            ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                                                            : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                                    }`}>
                                                        {booking.new_room_id ? "Переселення" : "Поселення"}
                                                    </span>
                                                </td>
                                                <td className="p-4 align-middle text-gray-700 dark:text-gray-300">
                                                    {targetRoom?.building?.name || "Корпус"}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                        Кімн. №{targetRoom?.room_number}{" "}
                                                        <span className="text-gray-400 font-normal">(Поверх {targetRoom?.floor})</span>
                                                    </div>
                                                    {mixedStatus && (
                                                        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                                            <span>{mixedStatus.shortSummary}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right align-middle whitespace-nowrap w-48">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={actionProcessingId === booking.id}
                                                            onClick={() => handleApproveWithPrompt(booking, mixedStatus)}
                                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all disabled:opacity-50 shadow-xs"
                                                        >
                                                            {actionProcessingId === booking.id ? "..." : "Схвалити"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReject(booking.id)}
                                                            className="px-3.5 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg text-xs font-semibold transition-all border border-red-200 dark:border-red-800"
                                                        >
                                                            Відхилити
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Модальне вікно швидкого зв'язку зі студентом */}
            {contactingUser && (
                <ContactStudentModal
                    student={contactingUser}
                    onClose={() => setContactingUser(null)}
                />
            )}
        </div>
    );
}
