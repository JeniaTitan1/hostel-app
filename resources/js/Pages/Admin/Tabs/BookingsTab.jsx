import React, { useState } from "react";
import { router } from "@inertiajs/react";
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
    const [rejectingEmailReq, setRejectingEmailReq] = useState(null);
    const [rejectReasonInput, setRejectReasonInput] = useState("");
    const [isSubmittingReject, setIsSubmittingReject] = useState(false);

    const filteredPendingBookings = pendingBookings.filter((b) => {
        if (!inboxSearch) return true;
        const q = inboxSearch.toLowerCase();
        return (
            b.user?.name?.toLowerCase().includes(q) ||
            b.user?.email?.toLowerCase().includes(q)
        );
    });

    // Перевірка на конфлікт статі / створення змішаної кімнати
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

    // Перевірка на заселення звичайного студента в інклюзивну кімнату (для осіб з інвалідністю)
    const checkAccessibleRoomStatus = (booking) => {
        const targetRoom = booking.new_room_id
            ? booking.new_room
            : booking.room;
        if (!targetRoom) return null;

        const isRoomAccessible = Boolean(targetRoom.is_accessible);
        const isStudentInclusive = Boolean(booking.user?.is_inclusive);

        if (isRoomAccessible && !isStudentInclusive) {
            return {
                isWarning: true,
                shortSummary: "Інклюзивна кімната: студент без особливих потреб / інвалідності",
            };
        }

        return null;
    };

    const handleApproveWithPrompt = (booking, mixedStatus, accessibleStatus) => {
        if (mixedStatus) {
            if (
                !window.confirm(
                    `Увага: це поселення створить змішану кімнату (${mixedStatus.shortSummary}). Схвалити?`,
                )
            ) {
                return;
            }
        }
        if (accessibleStatus) {
            const targetRoom = booking.new_room_id ? booking.new_room : booking.room;
            if (
                !window.confirm(
                    `Увага: кімната №${targetRoom?.room_number} облаштована для осіб з інвалідністю, а студент не має позначки інклюзивності. Схвалити поселення?`,
                )
            ) {
                return;
            }
        }
        handleApprove(booking.id);
    };

    const handleOpenRejectEmailModal = (req) => {
        setRejectingEmailReq(req);
        setRejectReasonInput("");
    };

    const handleConfirmRejectEmail = (e) => {
        e.preventDefault();
        router.post(
            route("admin.email-requests.reject", rejectingEmailReq.id),
            { rejection_reason: rejectReasonInput },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsSubmittingReject(false);
                    setRejectingEmailReq(null);
                    setRejectReasonInput("");
                },
            }
        );
    };

    // Визначення стилю рядка / картки за типом заявки та особливими умовами
    const getBookingRowStyle = (booking) => {
        const mixedStatus = checkMixedRoomStatus(booking);
        const accessibleStatus = checkAccessibleRoomStatus(booking);
        const isRelocation = Boolean(booking.new_room_id);

        if (mixedStatus) {
            return {
                gradient: "bg-gradient-to-r from-amber-500/[0.08] via-amber-500/[0.025] to-transparent hover:from-amber-500/[0.13] dark:from-amber-500/[0.12] dark:via-amber-500/[0.035] dark:to-transparent dark:hover:from-amber-500/[0.18]",
                borderColor: "border-l-amber-500",
                borderClass: "border-l-4 border-l-amber-500",
                dotColor: "bg-amber-500",
                mixedStatus,
                accessibleStatus,
                isRelocation,
            };
        }

        if (accessibleStatus) {
            return {
                gradient: "bg-gradient-to-r from-sky-500/[0.08] via-sky-500/[0.025] to-transparent hover:from-sky-500/[0.13] dark:from-sky-500/[0.12] dark:via-sky-500/[0.035] dark:to-transparent dark:hover:from-sky-500/[0.18]",
                borderColor: "border-l-sky-500",
                borderClass: "border-l-4 border-l-sky-500",
                dotColor: "bg-sky-500",
                mixedStatus,
                accessibleStatus,
                isRelocation,
            };
        }

        if (isRelocation) {
            return {
                gradient: "bg-gradient-to-r from-indigo-500/[0.065] via-indigo-500/[0.02] to-transparent hover:from-indigo-500/[0.11] dark:from-indigo-500/[0.09] dark:via-indigo-500/[0.025] dark:to-transparent dark:hover:from-indigo-500/[0.15]",
                borderColor: "border-l-indigo-500",
                borderClass: "border-l-4 border-l-indigo-500",
                dotColor: "bg-indigo-500",
                mixedStatus,
                accessibleStatus,
                isRelocation,
            };
        }

        return {
            gradient: "bg-gradient-to-r from-emerald-500/[0.065] via-emerald-500/[0.02] to-transparent hover:from-emerald-500/[0.11] dark:from-emerald-500/[0.09] dark:via-emerald-500/[0.025] dark:to-transparent dark:hover:from-emerald-500/[0.15]",
            borderColor: "border-l-emerald-500",
            borderClass: "border-l-4 border-l-emerald-500",
            dotColor: "bg-emerald-500",
            mixedStatus,
            accessibleStatus,
            isRelocation,
        };
    };

    return (
        <div className="space-y-6">
            {/* ================= 0. ЗАПИТИ НА ЗМІНУ EMAIL (ГОЛОВНИЙ АДМІН) ================= */}
            {isSuperAdmin && emailChangeRequests.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl shadow-sm overflow-hidden transition-all">
                    {/* Header */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-b border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-2xs">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base tracking-tight">
                                        Запити на зміну електронної пошти
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                                        {emailChangeRequests.length}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Підтвердження або відхилення оновлення адреси облікового запису студента
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Request Cards List */}
                    <div className="p-3 sm:p-4 space-y-3">
                        {emailChangeRequests.map((req) => (
                            <div
                                key={req.id}
                                className="p-4 rounded-xl bg-slate-50/70 dark:bg-gray-800/60 border border-slate-200/80 dark:border-gray-700/70 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-300 dark:hover:border-amber-800/80 transition-all shadow-2xs"
                            >
                                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs uppercase">
                                        {req.user?.name ? req.user.name.charAt(0) : "S"}
                                    </div>
                                    <div className="space-y-2 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-gray-900 dark:text-white text-sm">
                                                {req.user?.name || "Студент"}
                                            </span>
                                            <span className="text-[10px] font-mono bg-white dark:bg-gray-700 px-2 py-0.5 rounded-md text-gray-500 dark:text-gray-400 border border-slate-200 dark:border-gray-600">
                                                ID: #{req.user_id}
                                            </span>
                                            {req.user?.is_inclusive && (
                                                <span className="text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                                                    Інклюзивність
                                                </span>
                                            )}
                                        </div>

                                        {/* Візуальний маршрут оновлення пошти */}
                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                            <div
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-900/50 font-mono text-[11px]"
                                                title="Поточна пошта"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                                <span className="truncate max-w-[200px] sm:max-w-none">{req.old_email}</span>
                                            </div>

                                            <div className="flex items-center text-slate-400 dark:text-gray-500 shrink-0">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </div>

                                            <div
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono font-bold text-[11px] shadow-2xs"
                                                title="Нова адреса пошти"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                <span className="truncate max-w-[200px] sm:max-w-none">{req.new_email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                    <button
                                        type="button"
                                        onClick={() => handleApproveEmailChange(req.id)}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Схвалити</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenRejectEmailModal(req)}
                                        className="px-3.5 py-2 bg-white dark:bg-gray-700/60 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 active:scale-95 font-semibold rounded-xl text-xs transition-all border border-slate-200 dark:border-gray-600 hover:border-red-200 dark:hover:border-red-800/60 flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        <span>Відхилити</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ================= 1. ПАНЕЛЬ ЗАЯВОК (INBOX: ПОСЕЛЕННЯ ТА ПЕРЕСЕЛЕННЯ) ================= */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
                            Вхідні заявки на розгляд
                        </h3>
                        <p className="text-xs text-gray-400">
                            Схвалення або відхилення запитів на поселення та переселення
                        </p>
                        {/* Кольорові підказки типів заявок */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px] text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="font-medium">Заселення</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="font-medium">Переселення</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="font-medium">Змішана кімната</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-sky-500" />
                                <span className="font-medium">Інклюзивна кімната</span>
                            </span>
                        </div>
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
                                const style = getBookingRowStyle(booking);

                                return (
                                    <div
                                        key={booking.id}
                                        className={`p-4 space-y-3 transition-all border-l-4 ${style.borderClass} ${style.gradient}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border ${
                                                    booking.user?.gender === "female"
                                                        ? "bg-pink-100/80 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/80 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                                                        : "bg-blue-100/80 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                                                }`}>
                                                    {booking.user?.name ? booking.user.name.charAt(0) : "U"}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                                            {booking.user?.name || "Користувач"}
                                                        </span>
                                                        {booking.user?.is_inclusive && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-[0_0_10px_rgba(14,165,233,0.15)]">
                                                                Інклюзивний
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 flex-wrap">
                                                        {booking.user?.specialty && (
                                                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                                {booking.user.specialty}
                                                            </span>
                                                        )}
                                                        {booking.user?.course && (
                                                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-gray-700 font-bold text-slate-700 dark:text-gray-200 text-[9px]">
                                                                {booking.user.course} курс
                                                            </span>
                                                        )}
                                                        {booking.user?.group && (
                                                            <span className="opacity-75">(Гр. {booking.user.group})</span>
                                                        )}
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
                                            </div>

                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-2xs ${
                                                    style.isRelocation 
                                                        ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60"
                                                        : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                                                }`}>
                                                    {style.isRelocation ? "Переселення" : "Поселення"}
                                                </span>
                                                {style.mixedStatus && (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                                                        Змішана кімната
                                                    </span>
                                                )}
                                                {style.accessibleStatus && (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-100/90 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700/60">
                                                        Інклюзивна
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-3 bg-white/70 dark:bg-gray-800/80 backdrop-blur-xs rounded-xl border border-slate-200/60 dark:border-gray-700 text-xs space-y-1.5 shadow-2xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Корпус:</span>
                                                <span className="font-semibold text-gray-800 dark:text-gray-200">{targetRoom?.building?.name || "Корпус"}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Цільова кімната:</span>
                                                <div className="text-right">
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        Кімн. №{targetRoom?.room_number} (Поверх {targetRoom?.floor})
                                                    </span>
                                                    {Boolean(targetRoom?.is_accessible) && (
                                                        <span className="block text-[10px] text-sky-600 dark:text-sky-400 font-bold">
                                                            Інклюзивна кімната
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Попередження про змішану кімнату */}
                                            {style.mixedStatus && (
                                                <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium pt-1.5 border-t border-amber-200/60 dark:border-amber-900/50 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                                                    <span>{style.mixedStatus.shortSummary}</span>
                                                </div>
                                            )}

                                            {/* Легке попередження про заселення в кімнату для людей з інвалідністю */}
                                            {style.accessibleStatus && (
                                                <div className="text-[11px] text-sky-700 dark:text-sky-300 font-medium pt-1.5 border-t border-sky-200/60 dark:border-sky-900/50 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                                                    <span>{style.accessibleStatus.shortSummary}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <button
                                                type="button"
                                                disabled={actionProcessingId === booking.id}
                                                onClick={() => handleApproveWithPrompt(booking, style.mixedStatus, style.accessibleStatus)}
                                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 shadow-xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>{actionProcessingId === booking.id ? "..." : "Схвалити"}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleReject(booking.id)}
                                                className="w-full py-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl text-xs font-bold transition-all border border-red-200 dark:border-red-800 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span>Відхилити</span>
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
                                        <th className="p-4">Студент / Користувач</th>
                                        <th className="p-4">Тип заявки</th>
                                        <th className="p-4">Корпус</th>
                                        <th className="p-4">Поверх / Кімната & Статус</th>
                                        <th className="p-4 text-right whitespace-nowrap w-48">Дії</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-200">
                                    {filteredPendingBookings.map((booking) => {
                                        const targetRoom = booking.new_room_id
                                            ? booking.new_room
                                            : booking.room;
                                        const style = getBookingRowStyle(booking);

                                        return (
                                            <tr
                                                key={booking.id}
                                                className={`transition-all ${style.gradient}`}
                                            >
                                                <td className={`p-4 font-medium text-gray-900 dark:text-white align-middle border-l-4 ${style.borderColor}`}>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border ${
                                                            booking.user?.gender === "female"
                                                                ? "bg-pink-100/80 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/80 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                                                                : "bg-blue-100/80 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                                                        }`}>
                                                            {booking.user?.name ? booking.user.name.charAt(0) : "U"}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-bold">
                                                                    {booking.user?.name || "Користувач"}
                                                                </span>
                                                                {booking.user?.is_inclusive && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-[0_0_10px_rgba(14,165,233,0.15)]">
                                                                        Інклюзивний
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                                                                {booking.user?.specialty && (
                                                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                                        {booking.user.specialty}
                                                                    </span>
                                                                )}
                                                                {booking.user?.course && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-700/80 font-bold text-slate-700 dark:text-gray-200 text-[10px] border border-slate-200/50 dark:border-gray-600/50">
                                                                        {booking.user.course} курс
                                                                    </span>
                                                                )}
                                                                {booking.user?.group && (
                                                                    <span className="opacity-75">(Гр. {booking.user.group})</span>
                                                                )}
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
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="p-4 align-middle whitespace-nowrap">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-2xs ${
                                                            style.isRelocation 
                                                                ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60"
                                                                : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                                                        }`}>
                                                            {style.isRelocation ? "Переселення" : "Поселення"}
                                                        </span>
                                                        {style.mixedStatus && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                                Змішана кімната
                                                            </span>
                                                        )}
                                                        {style.accessibleStatus && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100/90 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700/60 shadow-2xs">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                                                Інклюзивна кімната
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="p-4 align-middle text-gray-700 dark:text-gray-300 font-medium">
                                                    {targetRoom?.building?.name || "Корпус"}
                                                </td>

                                                <td className="p-4 align-middle">
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
                                                        <span>Кімн. №{targetRoom?.room_number}</span>
                                                        <span className="text-gray-400 font-normal text-xs">(Поверх {targetRoom?.floor})</span>
                                                        {Boolean(targetRoom?.is_accessible) && (
                                                            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 px-1.5 py-0.5 rounded">
                                                                Інклюзивна
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Попередження про змішану кімнату */}
                                                    {style.mixedStatus && (
                                                        <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5 mt-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-lg px-2 py-0.5 w-fit">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                                                            <span>{style.mixedStatus.shortSummary}</span>
                                                        </div>
                                                    )}

                                                    {/* Легке попередження про кімнату для людей з інвалідністю */}
                                                    {style.accessibleStatus && (
                                                        <div className="text-[11px] text-sky-700 dark:text-sky-300 font-medium flex items-center gap-1.5 mt-1 bg-sky-50 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/40 rounded-lg px-2 py-0.5 w-fit">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                                                            <span>{style.accessibleStatus.shortSummary}</span>
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="p-4 text-right align-middle whitespace-nowrap w-48">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={actionProcessingId === booking.id}
                                                            onClick={() => handleApproveWithPrompt(booking, style.mixedStatus, style.accessibleStatus)}
                                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span>{actionProcessingId === booking.id ? "..." : "Схвалити"}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReject(booking.id)}
                                                            className="px-3.5 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-xl text-xs font-semibold transition-all border border-red-200 dark:border-red-800 active:scale-95 flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            <span>Відхилити</span>
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

            {/* Модальне вікно причини відхилення запиту на зміну email */}
            {rejectingEmailReq && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-gray-700 pb-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                    Відхилити запит на зміну пошти
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Студент: {rejectingEmailReq.user?.name} (#{rejectingEmailReq.user_id})
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleConfirmRejectEmail} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Причина відхилення (необов'язково)
                                </label>
                                <textarea
                                    value={rejectReasonInput}
                                    onChange={(e) => setRejectReasonInput(e.target.value)}
                                    placeholder="напр., Неправильний формат адреси або відсутність підтвердження особи"
                                    rows={3}
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRejectingEmailReq(null)}
                                    className="px-4 py-2 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Скасувати
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingReject}
                                    className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-xs disabled:opacity-50"
                                >
                                    {isSubmittingReject ? "Відхилення..." : "Підтвердити відхилення"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
