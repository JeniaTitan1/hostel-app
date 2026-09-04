import React from "react";
import { createPortal } from "react-dom";

export default function EditUserModal({
    editingUser,
    onClose,
    userEditForm,
    onSubmit,
    availableBuildings = [],
}) {
    if (!editingUser) return null;

    const backdropMouseDownRef = React.useRef(false);

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
                className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white relative">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 active:scale-95 rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer"
                        title="Закрити"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl font-black shadow-inner shrink-0">
                            {editingUser.name ? (
                                editingUser.name.charAt(0).toUpperCase()
                            ) : (
                                <svg className="w-7 h-7 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl font-bold text-white tracking-tight">
                                    {editingUser.name}
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/30 border border-emerald-400/40 text-emerald-200">
                                    {editingUser.role === "admin"
                                        ? "Головний Адмін"
                                        : editingUser.role === "commandant"
                                          ? "Комендант"
                                          : "Студент"}
                                </span>
                            </div>
                            <p className="text-emerald-100 text-xs font-mono">
                                {editingUser.email}
                            </p>
                            {(editingUser.buildingName || editingUser.roomNumber) && (
                                <p className="text-[11px] text-emerald-200/90 font-medium flex items-center gap-1.5 pt-0.5">
                                    <span>
                                        {editingUser.buildingName || "Корпус"}
                                    </span>
                                    {editingUser.roomNumber && (
                                        <span>• №{editingUser.roomNumber}</span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body Form */}
                <form
                    onSubmit={onSubmit}
                    className="p-5 space-y-4 flex-grow overflow-y-auto"
                >
                    {/* Секція 1: Персональні та Контактні дані + Безпека */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-gray-700 pb-1">
                            Персональні дані та безпека
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    ПІБ (Повне ім'я)
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={userEditForm.data.name}
                                    onChange={(e) =>
                                        userEditForm.setData("name", e.target.value)
                                    }
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-slate-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Електронна пошта (Email)
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={userEditForm.data.email}
                                    onChange={(e) =>
                                        userEditForm.setData("email", e.target.value)
                                    }
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-slate-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Телефон
                                </label>
                                <input
                                    type="text"
                                    placeholder="+380..."
                                    value={userEditForm.data.phone}
                                    onChange={(e) =>
                                        userEditForm.setData("phone", e.target.value)
                                    }
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-slate-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Telegram (нікнейм)
                                </label>
                                <input
                                    type="text"
                                    placeholder="@username"
                                    value={userEditForm.data.telegram}
                                    onChange={(e) =>
                                        userEditForm.setData("telegram", e.target.value)
                                    }
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-slate-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Стать
                                </label>
                                <select
                                    value={userEditForm.data.gender}
                                    onChange={(e) =>
                                        userEditForm.setData("gender", e.target.value)
                                    }
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-slate-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="male">Чоловіча</option>
                                    <option value="female">Жіноча</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Новий пароль (необов'язково)
                                </label>
                                <input
                                    type="password"
                                    placeholder="Вкажіть новий пароль..."
                                    value={userEditForm.data.password}
                                    onChange={(e) =>
                                        userEditForm.setData("password", e.target.value)
                                    }
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-slate-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Інклюзивність (особливі потреби) */}
                            <div className="sm:col-span-2 pt-1">
                                <label className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 cursor-pointer select-none group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(userEditForm.data.is_inclusive)}
                                        onChange={(e) =>
                                            userEditForm.setData("is_inclusive", e.target.checked)
                                        }
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 cursor-pointer"
                                    />
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs text-base select-none leading-none">
                                            ♿
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-gray-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                Інклюзивність (особа з інвалідністю / особливими потребами)
                                            </span>
                                            <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                                                Надає право першочергового поселення в спеціально обладнані інклюзивні кімнати
                                            </span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Секція: Дозволені корпуси для поселення */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-700 pb-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                🏢 Дозволені корпуси для поселення
                            </h4>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                {userEditForm.data.building_mode === "all"
                                    ? "Доступні всі корпуси"
                                    : `Обрано: ${userEditForm.data.allowed_buildings?.length || 0}`}
                            </span>
                        </div>

                        {/* Перемикач режиму */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-gray-700/60 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => {
                                    userEditForm.setData((prev) => ({
                                        ...prev,
                                        building_mode: "all",
                                        allowed_buildings: [],
                                    }));
                                }}
                                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    userEditForm.data.building_mode === "all"
                                        ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                            >
                                <span>🌐</span> Усі корпуси
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    userEditForm.setData((prev) => ({
                                        ...prev,
                                        building_mode: "specific",
                                    }));
                                }}
                                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    userEditForm.data.building_mode === "specific"
                                        ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                            >
                                <span>🏢</span> Обрати конкретні
                            </button>
                        </div>

                        {userEditForm.data.building_mode === "specific" && (
                            <div className="space-y-2 p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                                        Позначте корпуси, до яких цей студент матиме доступ для вибору кімнат:
                                    </p>
                                    {availableBuildings && availableBuildings.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const allIds = availableBuildings.map((b) => Number(b.id));
                                                const isAllSelected = allIds.every((id) =>
                                                    (userEditForm.data.allowed_buildings || []).map(Number).includes(id)
                                                );
                                                userEditForm.setData("allowed_buildings", isAllSelected ? [] : allIds);
                                            }}
                                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            {(userEditForm.data.allowed_buildings || []).length === availableBuildings.length
                                                ? "Зняти всі"
                                                : "Вибрати всі"}
                                        </button>
                                    )}
                                </div>
                                {availableBuildings && availableBuildings.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {availableBuildings.map((b) => {
                                            const isChecked = (userEditForm.data.allowed_buildings || [])
                                                .map(Number)
                                                .includes(Number(b.id));
                                            return (
                                                <label
                                                    key={b.id}
                                                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                                        isChecked
                                                            ? "bg-white dark:bg-gray-800 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs"
                                                            : "bg-white/60 dark:bg-gray-800/40 border-slate-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-slate-300"
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            const current = (userEditForm.data.allowed_buildings || []).map(Number);
                                                            const next = e.target.checked
                                                                ? [...current, Number(b.id)]
                                                                : current.filter((id) => id !== Number(b.id));
                                                            userEditForm.setData("allowed_buildings", next);
                                                        }}
                                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-gray-600"
                                                    />
                                                    <span className="truncate">{b.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                        Корпусів не знайдено
                                    </p>
                                )}
                                {userEditForm.data.building_mode === "specific" &&
                                    (!userEditForm.data.allowed_buildings ||
                                        userEditForm.data.allowed_buildings.length === 0) && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                            ⚠️ Увага: не вибрано жодного корпусу. Студент не зможе переглядати кімнати.
                                        </p>
                                    )}
                            </div>
                        )}
                    </div>

                    {/* Секція 2: Академічна інформація */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-gray-700 pb-1">
                            Академічна інформація
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Спеціальність / Напрям
                                </label>
                                <input
                                    type="text"
                                    placeholder="Спеціальність..."
                                    value={userEditForm.data.specialty}
                                    onChange={(e) =>
                                        userEditForm.setData("specialty", e.target.value)
                                    }
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-slate-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Курс
                                </label>
                                <select
                                    value={userEditForm.data.course}
                                    onChange={(e) =>
                                        userEditForm.setData("course", Number(e.target.value))
                                    }
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-slate-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                >
                                    {[1, 2, 3, 4, 5, 6].map((c) => (
                                        <option key={c} value={c}>
                                            {c} курс
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Група
                                </label>
                                <input
                                    type="text"
                                    placeholder="Група..."
                                    value={userEditForm.data.group}
                                    onChange={(e) =>
                                        userEditForm.setData("group", e.target.value)
                                    }
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-slate-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            Скасувати
                        </button>
                        <button
                            type="submit"
                            disabled={userEditForm.processing}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                        >
                            {userEditForm.processing ? "Збереження..." : "Зберегти зміни"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
