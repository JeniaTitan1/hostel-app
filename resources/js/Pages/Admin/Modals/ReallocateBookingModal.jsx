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
    availableRooms = [],
    getRoomGender,
    buildings = [],
}) {
    if (!reallocateBookingData || !reallocateCurrentRoom) return null;

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

    return createPortal(
        <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-in fade-in zoom-in-95 duration-150"
            onClick={onClose}
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
                            {availableRooms.map((r) => (
                                <option key={r.id} value={r.id}>
                                    Кімн. №{r.room_number} ({r.building_name},
                                    Пов. {r.floor}, Вільно {r.free_spots}/
                                    {r.max_capacity})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Попередження про цільову кімнату */}
                    {targetRoom?.status === "closed" && (
                        <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-800 dark:text-red-300">
                            <span className="text-base leading-none">🔧</span>
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
                                <span className="text-base leading-none">
                                    🔒
                                </span>
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
                            <div className="flex items-start gap-2.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50 rounded-xl p-3.5 shadow-3xs">
                                <span className="text-amber-500 text-base leading-none select-none">
                                    ⚠️
                                </span>
                                <p className="text-xs text-amber-850 dark:text-amber-300 font-semibold leading-normal">
                                    Цільова кімната призначена для{" "}
                                    {targetRoomGender.type === "male"
                                        ? "чоловіків"
                                        : "жінок"}
                                    . Переселення створить змішану кімнату.
                                </p>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={allowMixedReallocate}
                                    onChange={(e) =>
                                        setAllowMixedReallocate(
                                            e.target.checked,
                                        )
                                    }
                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-amber-600 focus:ring-amber-500 dark:bg-gray-700"
                                />
                                <span className="text-xs text-gray-650 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                    Підтверджую створення змішаної кімнати
                                </span>
                            </label>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Скасувати
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 dark:bg-emerald-600 text-white hover:bg-gray-800 dark:hover:bg-emerald-500 transition-all shadow-sm"
                        >
                            Переселити
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}
