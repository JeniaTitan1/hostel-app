import React from "react";
import { createPortal } from "react-dom";

export default function ReallocateBookingModal({
    reallocateBookingData,
    reallocateCurrentRoom,
    onClose,
    onSubmit,
    selectedReallocateRoomId,
    setSelectedReallocateRoomId,
    reallocateReason,
    setReallocateReason,
    allowMixedReallocate,
    setAllowMixedReallocate,
    isProcessing = false,
    availableRooms = [],
    getRoomGender,
    buildings = [],
}) {
    const backdropMouseDownRef = React.useRef(false);

    if (!reallocateBookingData || !reallocateCurrentRoom || typeof document === "undefined") return null;

    const allRooms = buildings.flatMap((b) => b.rooms || []);
    const targetRoom = allRooms.find(
        (r) => String(r.id) === String(selectedReallocateRoomId),
    );
    const targetRoomGender =
        targetRoom && getRoomGender ? getRoomGender(targetRoom) : null;
    const isGenderConflict =
        targetRoomGender &&
        targetRoomGender.type !== "empty" &&
        reallocateBookingData?.user?.gender &&
        reallocateBookingData.user.gender !== targetRoomGender.type;
    const isAccessibleConflict =
        Boolean(targetRoom?.is_accessible) &&
        !reallocateBookingData?.user?.is_inclusive;

    const handleBackdropMouseDown = (e) => {
        backdropMouseDownRef.current = e.target === e.currentTarget;
    };

    const handleBackdropClick = (e) => {
        if (backdropMouseDownRef.current && e.target === e.currentTarget) {
            onClose();
        }
        backdropMouseDownRef.current = false;
    };

    return createPortal(
        <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-in fade-in zoom-in-95 duration-150"
            onMouseDown={handleBackdropMouseDown}
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="border-b border-slate-100/80 dark:border-gray-700 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Переселення жильця
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Переселити: {reallocateBookingData.user?.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Поточна кімната: №{reallocateCurrentRoom.room_number}{" "}
                        (Поверх {reallocateCurrentRoom.floor})
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Оберіть нову кімнату
                        </label>
                        <select
                            value={selectedReallocateRoomId}
                            onChange={(e) =>
                                setSelectedReallocateRoomId(e.target.value)
                            }
                            className="w-full text-sm rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:border-emerald-500 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                        >
                            <option value="" disabled>
                                -- Оберіть кімнату --
                            </option>
                            {availableRooms.map((r) => {
                                const isMixedWithUser =
                                    reallocateBookingData?.user?.gender &&
                                    r.genderType &&
                                    r.genderType !== "empty" &&
                                    r.genderType !== reallocateBookingData.user.gender;
                                const genderNote =
                                    r.genderType === "female"
                                        ? "• Жіноча"
                                        : r.genderType === "male"
                                          ? "• Чоловіча"
                                          : r.genderType === "mixed"
                                            ? "• Змішана"
                                            : "• Вільна";

                                return (
                                    <option key={r.id} value={r.id}>
                                        Кімн. №{r.room_number} ({r.building_name},
                                        Пов. {r.floor}, Вільно {r.free_spots}/
                                        {r.max_capacity}) {genderNote}
                                        {r.is_accessible ? " [♿ Інклюзивна]" : ""}
                                        {isMixedWithUser ? " — ЗМІШАНА КІМНАТА" : ""}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Попередження про цільову кімнату */}
                    {targetRoom?.status === "closed" && (
                        <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-800 dark:text-red-300">
                            <svg className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <div>
                                <span className="font-bold block">
                                    Попередження: Кімната закрита на ремонт!
                                </span>
                                <span>
                                    Обрана цільова кімната перебуває в стані
                                    технічного обслуговування.
                                </span>
                            </div>
                        </div>
                    )}

                    {Boolean(targetRoom?.intake_closed) &&
                        targetRoom?.status !== "closed" && (
                            <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
                                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <div>
                                    <span className="font-bold block">
                                        Попередження: Прийом у цю кімнату
                                        закритий!
                                    </span>
                                    <span>
                                        Обрана кімната позначена як закрита для
                                        прийому нових мешканців.
                                    </span>
                                </div>
                            </div>
                        )}

                    {isAccessibleConflict && (
                        <div className="flex items-start gap-2.5 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl p-3.5 text-xs text-sky-800 dark:text-sky-300">
                            <span className="text-base leading-none shrink-0 mt-0.5">♿</span>
                            <div>
                                <span className="font-bold block text-sky-900 dark:text-sky-200">
                                    Інклюзивна кімната
                                </span>
                                <span>
                                    Кімната №{targetRoom.room_number} облаштована для осіб з інвалідністю, а у {reallocateBookingData.user?.name} немає позначки інклюзивності. Переконайтеся, що це узгоджено.
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Причина переселення
                        </label>
                        <textarea
                            placeholder="напр., Аварійний стан кімнати, заміна сантехніки"
                            value={reallocateReason}
                            onChange={(e) =>
                                setReallocateReason(e.target.value)
                            }
                            rows={2}
                            className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:border-emerald-500 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                        />
                    </div>

                    {isGenderConflict && (
                        <div className="space-y-3 pt-1">
                            <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/80 rounded-xl p-3.5 shadow-3xs">
                                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div className="space-y-1">
                                    <span className="font-extrabold text-xs text-amber-950 dark:text-amber-200 block uppercase tracking-wide">
                                        Увага: створення змішаної кімнати!
                                    </span>
                                    <p className="text-xs text-amber-850 dark:text-amber-300 font-medium leading-relaxed">
                                        {reallocateBookingData.user?.name} ({reallocateBookingData.user?.gender === "male" ? "чоловіча стать" : "жіноча стать"}) буде переселено до кімнати №{targetRoom.room_number}, де вже проживають {targetRoomGender.type === "male" ? "чоловіки" : "жінки"}.
                                    </p>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer group p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                                <input
                                    type="checkbox"
                                    checked={allowMixedReallocate}
                                    onChange={(e) =>
                                        setAllowMixedReallocate(
                                            e.target.checked,
                                        )
                                    }
                                    className="w-4 h-4 rounded border-amber-300 dark:border-gray-600 text-amber-600 focus:ring-amber-500 dark:bg-gray-700"
                                />
                                <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 group-hover:underline">
                                    Я підтверджую створення змішаної кімнати
                                </span>
                            </label>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="px-4 py-2 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            Скасувати
                        </button>
                        <button
                            type="submit"
                            disabled={isProcessing || !selectedReallocateRoomId}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Переселення...</span>
                                </>
                            ) : (
                                <span>Переселити</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}
