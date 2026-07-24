import React from "react";
import { createPortal } from "react-dom";

export default function EditUserModal({ editingUser, onClose, userEditForm, onSubmit }) {
    if (!editingUser) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-in fade-in zoom-in-95 duration-150"
            onClick={onClose}
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
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg transition-colors"
                    >
                        ×
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl font-black shadow-inner shrink-0">
                            {editingUser.name
                                ? editingUser.name.charAt(0).toUpperCase()
                                : "👤"}
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
                                        🏢 {editingUser.buildingName || "Корпус"}
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
                            👤 Персональні дані та безпека
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
                                    <option value="male">Чоловіча ♂</option>
                                    <option value="female">Жіноча ♀</option>
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
                        </div>
                    </div>

                    {/* Секція 2: Академічна інформація */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-gray-700 pb-1">
                            🎓 Академічна інформація
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
