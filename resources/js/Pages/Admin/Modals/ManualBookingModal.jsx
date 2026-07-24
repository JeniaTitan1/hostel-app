import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "@inertiajs/react";

export default function ManualBookingModal({
    room,
    onClose,
    users = [],
    getRoomGender,
}) {
    if (!room) return null;

    const [allowMixedGender, setAllowMixedGender] = useState(false);

    const manualForm = useForm({
        user_id: "",
        room_id: room.id,
        force_mixed: false,
    });

    const roomGender = getRoomGender ? getRoomGender(room) : { type: "empty" };
    const activeRoomGender = roomGender.type === "male" || roomGender.type === "female" ? roomGender.type : null;

    // Фільтруємо доступних студентів за статтю, якщо кімната не порожня і прапорець змішування не увімкнено
    const filteredUsers = users.filter((u) => {
        if (!allowMixedGender && activeRoomGender && u.gender) {
            return u.gender === activeRoomGender;
        }
        return true;
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!manualForm.data.user_id) return;

        manualForm.post(route("admin.bookings.manual"), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
        });
    };

    const selectedUser = users.find((u) => String(u.id) === String(manualForm.data.user_id));
    const isGenderConflict = activeRoomGender && selectedUser?.gender && selectedUser.gender !== activeRoomGender;

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 w-full max-w-md p-6 space-y-4 mx-4 my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="border-b border-slate-100 dark:border-gray-700 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Ручне заселення в кімнату
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Кімната №{room.room_number} (Поверх {room.floor})
                    </h3>
                </div>

                {/* Попередження про особливий стан кімнати */}
                {room.status === "closed" && (
                    <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-800 dark:text-red-300">
                        <span className="text-base leading-none">🔧</span>
                        <div>
                            <span className="font-bold block">Попередження: Кімната на ремонті!</span>
                            <span>Ви заселяєте студента у кімнату, що перебуває в стані технічного обслуговування.</span>
                        </div>
                    </div>
                )}

                {Boolean(room.intake_closed) && room.status !== "closed" && (
                    <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
                        <span className="text-base leading-none">🔒</span>
                        <div>
                            <span className="font-bold block">Попередження: Прийом закритий!</span>
                            <span>Призупинено звичайний прийом замовлень. Ручне заселення дозволено адміністратору.</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Оберіть студента для заселення
                        </label>
                        <select
                            value={manualForm.data.user_id}
                            onChange={(e) => manualForm.setData("user_id", e.target.value)}
                            className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                            required
                        >
                            <option value="" disabled>
                                -- Оберіть студента ({filteredUsers.length} доступно) --
                            </option>
                            {filteredUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.gender === "female" ? "♀ " : "♂ "}
                                    {u.name} ({u.email})
                                </option>
                            ))}
                        </select>
                        {filteredUsers.length === 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                Немає вільних студентів відповідної статті без активного проживання.
                            </p>
                        )}
                    </div>

                    {activeRoomGender && (
                        <div className="space-y-2 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={allowMixedGender}
                                    onChange={(e) => {
                                        setAllowMixedGender(e.target.checked);
                                        manualForm.setData("force_mixed", e.target.checked);
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-amber-600 focus:ring-amber-500 dark:bg-gray-700"
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                    Показати всіх студентів (змішана кімната)
                                </span>
                            </label>
                        </div>
                    )}

                    {isGenderConflict && (
                        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                            <span className="text-amber-500 text-sm leading-none">⚠️</span>
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                                Ви обрали студента протилежної статі. Це створить змішану кімнату.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-slate-50 transition-colors"
                        >
                            Скасувати
                        </button>
                        <button
                            type="submit"
                            disabled={manualForm.processing || !manualForm.data.user_id}
                            className={`px-4 py-2 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 ${
                                isGenderConflict
                                    ? "bg-amber-600 hover:bg-amber-700"
                                    : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                        >
                            {manualForm.processing
                                ? "Заселення..."
                                : isGenderConflict
                                  ? "Заселити (Змішана кімната)"
                                  : "Заселити"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
