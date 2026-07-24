import React from "react";

export default function CommandantsTab({
    commandants = [],
    generatedCommandant,
    commandantCreateForm,
    handleCreateCommandant,
    commandantGenForm,
    handleGenerateCommandant,
    handleDeleteCommandant,
    allBuildings = [],
    buildings = [],
    handleOpenEditUserModal,
}) {
    const buildingsList = allBuildings.length > 0 ? allBuildings : buildings;

    return (
        <div className="space-y-6">
            {/* Згенерований комендант */}
            {generatedCommandant && (
                <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-700 animate-fade-in relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-700/80 px-2.5 py-0.5 rounded-full text-emerald-100 border border-emerald-500/30">
                                Згенерований комендант
                            </span>
                            <h4 className="font-bold text-lg text-white mt-1">
                                {generatedCommandant.name}
                            </h4>
                            <p className="text-xs text-emerald-200">
                                Призначений корпус: {generatedCommandant.building_name}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-950/60 p-3.5 rounded-xl border border-emerald-800/80 text-xs font-mono">
                        <div>
                            <span className="text-gray-400 block text-[10px]">Email (Логін):</span>
                            <span className="font-bold text-emerald-300">{generatedCommandant.email}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block text-[10px]">Пароль:</span>
                            <span className="font-bold text-amber-300">{generatedCommandant.password}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Форма 1: Створення вручну */}
                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">
                            Додати коменданта
                        </h3>
                        <p className="text-xs text-gray-400">
                            Вкажіть персональні дані та оберіть корпус для призначення
                        </p>
                    </div>
                    <form onSubmit={handleCreateCommandant} className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                                ПІБ Коменданта
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="напр. Іваненко Іван Іванович"
                                value={commandantCreateForm.data.name}
                                onChange={(e) => commandantCreateForm.setData("name", e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                                Email (Логін)
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="commandant@mnau.edu.ua"
                                value={commandantCreateForm.data.email}
                                onChange={(e) => commandantCreateForm.setData("email", e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                                Пароль
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={commandantCreateForm.data.password}
                                onChange={(e) => commandantCreateForm.setData("password", e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                                Закріплений корпус
                            </label>
                            <select
                                value={commandantCreateForm.data.building_id}
                                onChange={(e) => commandantCreateForm.setData("building_id", e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {buildingsList.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={commandantCreateForm.processing}
                            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                        >
                            Створити коменданта
                        </button>
                    </form>
                </div>

                {/* Форма 2: Швидка генерація */}
                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">
                            Генерувати коменданта
                        </h3>
                        <p className="text-xs text-gray-400">
                            Автоматично створити акаунт коменданта з випадковим паролем
                        </p>
                    </div>
                    <form onSubmit={handleGenerateCommandant} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                                Оберіть корпус
                            </label>
                            <select
                                value={commandantGenForm.data.building_id}
                                onChange={(e) => commandantGenForm.setData("building_id", e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {buildingsList.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={commandantGenForm.processing}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                        >
                            ⚡ Згенерувати акаунт
                        </button>
                    </form>
                </div>
            </div>

            {/* Таблиця комендантів */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
                        Список діючих комендантів
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                <th className="p-4">Комендант</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Призначений корпус</th>
                                <th className="p-4 text-right">Дії</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-200">
                            {commandants.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">
                                        Комендантів ще не додано.
                                    </td>
                                </tr>
                            ) : (
                                commandants.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4 font-bold text-gray-900 dark:text-white">{c.name}</td>
                                        <td className="p-4 font-mono">{c.email}</td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold rounded-lg">
                                                🏢 {c.building?.name || "Не призначено"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEditUserModal(c)}
                                                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold rounded-lg hover:bg-emerald-100 transition-all text-[11px]"
                                            >
                                                Редагувати
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCommandant(c.id)}
                                                className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg text-xs font-semibold transition-all border border-red-200 dark:border-red-800"
                                            >
                                                Видалити
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
