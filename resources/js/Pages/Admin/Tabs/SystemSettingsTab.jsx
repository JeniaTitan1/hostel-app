import React from "react";

export default function SystemSettingsTab({
    systemSettingsForm,
    handleUpdateSystemSettings,
}) {
    const isGlobalIntakeClosed = Boolean(systemSettingsForm.data.global_intake_closed);

    return (
        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 space-y-6 max-w-3xl">
            <div className="border-b border-slate-100 dark:border-gray-700 pb-3 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight flex items-center gap-2">
                        <span>⚙️</span> Глобальні налаштування системи
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Параметри місткості номерного фонду та керування прийомом заявок
                    </p>
                </div>
            </div>

            <form onSubmit={handleUpdateSystemSettings} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Параметр 1: Вибір місткості */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-700/50 border border-slate-100 dark:border-gray-700 space-y-2">
                        <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                            Місткість кімнат (ліжок)
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 space-y-1">
                                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Мін</span>
                                <select
                                    value={systemSettingsForm.data.min_beds_per_room}
                                    onChange={(e) => systemSettingsForm.setData("min_beds_per_room", e.target.value)}
                                    className="w-full text-xs font-bold rounded-lg border border-slate-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                >
                                    {[...Array(20).keys()].map((n) => (
                                        <option key={n + 1} value={n + 1}>{n + 1} ліжко</option>
                                    ))}
                                </select>
                            </div>
                            <span className="text-gray-400 font-bold mt-4">—</span>
                            <div className="flex-1 space-y-1">
                                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Макс</span>
                                <select
                                    value={systemSettingsForm.data.max_beds_per_room}
                                    onChange={(e) => systemSettingsForm.setData("max_beds_per_room", e.target.value)}
                                    className="w-full text-xs font-bold rounded-lg border border-slate-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                >
                                    {[...Array(20).keys()].map((n) => (
                                        <option key={n + 1} value={n + 1}>{n + 1} ліжок</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Параметр 2: Перемикач прийому заявок */}
                    <div
                        onClick={() => systemSettingsForm.setData("global_intake_closed", !isGlobalIntakeClosed)}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-gray-700/50 border border-slate-100 dark:border-gray-700 flex items-center justify-between cursor-pointer select-none group"
                    >
                        <div className="space-y-1 pr-3">
                            <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                Глобальний прийом заявок
                            </label>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 block leading-tight">
                                {isGlobalIntakeClosed ? "🔒 Прийом повністю призупинено" : "🔓 Прийом заявок відкритий"}
                            </span>
                        </div>
                        <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center shrink-0 ${isGlobalIntakeClosed ? "bg-red-500" : "bg-emerald-500"}`}>
                            <span className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${isGlobalIntakeClosed ? "translate-x-5" : "translate-x-0"}`} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-gray-700">
                    <button
                        type="submit"
                        disabled={systemSettingsForm.processing}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md disabled:opacity-50"
                    >
                        {systemSettingsForm.processing ? "Збереження..." : "Зберегти налаштування"}
                    </button>
                </div>
            </form>
        </div>
    );
}
