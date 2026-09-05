import React, { useState, useEffect } from "react";
import ContactStudentModal from "../Modals/ContactStudentModal";

export default function UsersTab({
    allUsers = [],
    availableBuildings = [],
    userSearch,
    setUserSearch,
    userSpecialtyFilter,
    setUserSpecialtyFilter,
    userCourseFilter,
    setUserCourseFilter,
    userGroupFilter,
    setUserGroupFilter,
    userGenderFilter,
    setUserGenderFilter,
    handleSort,
    renderSortArrow,
    renderGenderBadge,
    handleOpenEditUserModal,
    handleImpersonate,
    isSuperAdmin,
    generatedUsers = null,
    userGenForm,
    handleGenerateUsers,
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [showGenerator, setShowGenerator] = useState(false);
    const [contactingUser, setContactingUser] = useState(null);
    const [userInclusivityFilter, setUserInclusivityFilter] = useState("");

    const handleCopyAllText = () => {
        if (!generatedUsers || generatedUsers.length === 0) return;
        const text = generatedUsers
            .map(
                (u, i) =>
                    `${i + 1}. ${u.name}\n   Логін: ${u.email}\n   Тимчасовий пароль: ${u.password}\n   Стать: ${
                        u.gender === "male"
                            ? "Чоловіча"
                            : u.gender === "female"
                            ? "Жіноча"
                            : "Не вказано"
                    }\n   Дозволені корпуси: ${
                        u.allowed_building_names && u.allowed_building_names.length > 0
                            ? u.allowed_building_names.join(", ")
                            : "Усі корпуси"
                    }`,
            )
            .join("\n\n");
        navigator.clipboard.writeText(text);
        window.dispatchEvent(
            new CustomEvent("show-toast", {
                detail: {
                    message:
                        "Список згенерованих студентів скопійовано в буфер обміну!",
                },
            }),
        );
    };

    const handleCopySingle = (text) => {
        navigator.clipboard.writeText(text);
        window.dispatchEvent(
            new CustomEvent("show-toast", {
                detail: { message: "Скопійовано в буфер!" },
            }),
        );
    };

    const handlePrintOrPdf = () => {
        if (!generatedUsers || generatedUsers.length === 0) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const cardsHtml = generatedUsers
            .map(
                (u, idx) => `
            <div style="border: 2px dashed #059669; border-radius: 8px; padding: 14px; margin-bottom: 12px; page-break-inside: avoid; background: #f0fdf4; font-family: sans-serif;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #a7f3d0; padding-bottom: 6px; margin-bottom: 8px;">
                    <strong style="color: #065f46; font-size: 14px;">МНАУ • Талон доступу до системи гуртожитків</strong>
                    <span style="font-size: 11px; color: #047857; font-weight: bold;">Студент #${idx + 1}</span>
                </div>
                <div style="font-size: 12px; line-height: 1.6; color: #0f172a;">
                    <div><strong>Тимчасове ім'я:</strong> ${u.name}</div>
                    <div><strong>Логін / Email:</strong> <span style="font-family: monospace; font-size: 13px; font-weight: bold; color: #047857;">${u.email}</span></div>
                    <div><strong>Тимчасовий пароль:</strong> <span style="font-family: monospace; font-size: 13px; font-weight: bold; color: #b45309;">${u.password}</span></div>
                    <div><strong>Стать:</strong> ${u.gender === "male" ? "Чоловіча" : u.gender === "female" ? "Жіноча" : "Не вказано"}</div>
                    <div><strong>Дозволені корпуси:</strong> ${u.allowed_building_names && u.allowed_building_names.length > 0 ? u.allowed_building_names.join(", ") : "Усі корпуси"}</div>
                </div>
                <div style="margin-top: 8px; font-size: 10px; color: #64748b; font-style: italic;">
                    Інструкція для студента: Перейдіть на сайт гуртожитку, увійдіть з цими даними. Система обов'язково попросить встановити свій постійний пароль та заповнити ПІБ, групу і телефон.
                </div>
            </div>
        `,
            )
            .join("");

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Талони доступу студентів - МНАУ</title>
                    <style>
                        @media print {
                            body { margin: 10mm; }
                        }
                    </style>
                </head>
                <body style="padding: 20px; font-family: sans-serif;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #065f46; margin: 0;">Миколаївський Національний Аграрний Університет</h2>
                        <p style="color: #475569; font-size: 13px; margin: 4px 0 0 0;">Реєстр згенерованих талонів доступу для нових студентів (${generatedUsers.length} шт.)</p>
                    </div>
                    ${cardsHtml}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 300);
    };

    const filteredUsers = allUsers.filter((u) => {
        const matchesSearch =
            !userSearch ||
            u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.phone?.toLowerCase().includes(userSearch.toLowerCase());

        const matchesSpecialty =
            !userSpecialtyFilter || u.specialty === userSpecialtyFilter;
        const matchesCourse =
            !userCourseFilter || String(u.course) === String(userCourseFilter);
        const matchesGroup = !userGroupFilter || u.group === userGroupFilter;
        const matchesGender =
            !userGenderFilter || u.gender === userGenderFilter;
        const matchesInclusivity =
            !userInclusivityFilter ||
            (userInclusivityFilter === "inclusive" && Boolean(u.is_inclusive)) ||
            (userInclusivityFilter === "standard" && !u.is_inclusive);

        return (
            matchesSearch &&
            matchesSpecialty &&
            matchesCourse &&
            matchesGroup &&
            matchesGender &&
            matchesInclusivity
        );
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [userSearch, userSpecialtyFilter, userCourseFilter, userGroupFilter, userGenderFilter, userInclusivityFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    return (
        <div className="space-y-6">
            {/* Блок пакетної генерації студентів */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-gray-700 pb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight flex items-center gap-2">
                            Пакетна генерація студентів (Коди доступу)
                        </h3>
                        <p className="text-xs text-gray-400">
                            Масове створення тимчасових акаунтів для нових поселенців. При першому вході студенти зобов'язані встановити новий пароль та заповнити свій профіль.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowGenerator(!showGenerator)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5 shrink-0"
                    >
                        <span>{showGenerator ? "Згорнути форму" : "Згенерувати акаунти"}</span>
                    </button>
                </div>

                {showGenerator && userGenForm && (
                    <form onSubmit={handleGenerateUsers} className="pt-3 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                                    Кількість акаунтів (1 – 50)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={userGenForm.data.count}
                                    onChange={(e) => userGenForm.setData("count", e.target.value)}
                                    className="w-full h-10 text-xs rounded-xl border border-slate-200 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                                    Стать (для розселення)
                                </label>
                                <select
                                    value={userGenForm.data.gender}
                                    onChange={(e) => userGenForm.setData("gender", e.target.value)}
                                    className="w-full h-10 text-xs rounded-xl border border-slate-200 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                                >
                                    <option value="">Будь-яка / Не вказано</option>
                                    <option value="male">Чоловіча</option>
                                    <option value="female">Жіноча</option>
                                </select>
                            </div>

                            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                        Доступні корпуси
                                    </label>
                                    <span className="text-[11px] font-medium text-gray-400">
                                        {userGenForm.data.building_mode === "all"
                                            ? "Усі корпуси"
                                            : `Обрано: ${userGenForm.data.allowed_buildings?.length || 0}`}
                                    </span>
                                </div>
                                <div className="h-10 p-1 rounded-xl bg-slate-100 dark:bg-gray-700/60 border border-slate-200 dark:border-gray-600 grid grid-cols-2 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            userGenForm.setData((prev) => ({
                                                ...prev,
                                                building_mode: "all",
                                                allowed_buildings: [],
                                            }));
                                        }}
                                        className={`h-full rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
                                            userGenForm.data.building_mode === "all"
                                                ? "bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                    >
                                        Усі корпуси
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            userGenForm.setData((prev) => ({
                                                ...prev,
                                                building_mode: "specific",
                                            }));
                                        }}
                                        className={`h-full rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
                                            userGenForm.data.building_mode === "specific"
                                                ? "bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                    >
                                        Обрати корпуси
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Вибір конкретних корпусів */}
                        {userGenForm.data.building_mode === "specific" && (
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-750/50 border border-slate-200 dark:border-gray-700 space-y-3">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-gray-700/60">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                            Оберіть корпуси, в яких дозволено заселятись цим студентам:
                                        </span>
                                        {userGenForm.data.allowed_buildings && userGenForm.data.allowed_buildings.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                                {userGenForm.data.allowed_buildings.length} з {availableBuildings.length}
                                            </span>
                                        )}
                                    </div>
                                    {availableBuildings && availableBuildings.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const allIds = availableBuildings.map((b) => Number(b.id));
                                                const isAllSelected = allIds.every((id) =>
                                                    (userGenForm.data.allowed_buildings || []).map(Number).includes(id)
                                                );
                                                userGenForm.setData("allowed_buildings", isAllSelected ? [] : allIds);
                                            }}
                                            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
                                        >
                                            {(userGenForm.data.allowed_buildings || []).length === availableBuildings.length
                                                ? "Зняти всі"
                                                : "Вибрати всі"}
                                        </button>
                                    )}
                                </div>

                                {availableBuildings && availableBuildings.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                        {availableBuildings.map((b) => {
                                            const isChecked = (userGenForm.data.allowed_buildings || [])
                                                .map(Number)
                                                .includes(Number(b.id));
                                            return (
                                                <label
                                                    key={b.id}
                                                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs cursor-pointer select-none transition-colors ${
                                                        isChecked
                                                            ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-2xs"
                                                            : "bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-slate-300 hover:bg-slate-50/70"
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            const current = (userGenForm.data.allowed_buildings || []).map(Number);
                                                            const next = e.target.checked
                                                                ? [...current, Number(b.id)]
                                                                : current.filter((id) => id !== Number(b.id));
                                                            userGenForm.setData("allowed_buildings", next);
                                                        }}
                                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-gray-600 shrink-0 cursor-pointer"
                                                    />
                                                    <span className="font-medium truncate leading-tight">{b.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">Немає доступних корпусів</p>
                                )}

                                {(!userGenForm.data.allowed_buildings ||
                                    userGenForm.data.allowed_buildings.length === 0) && (
                                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                                        Оберіть хоча б один корпус, інакше студенти не матимуть доступу до жодного гуртожитку.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end pt-1">
                            <button
                                type="submit"
                                disabled={userGenForm.processing}
                                className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                {userGenForm.processing
                                    ? "Створення..."
                                    : `Згенерувати ${userGenForm.data.count} студентів`}
                            </button>
                        </div>
                    </form>
                )}

                {/* Результати щойно згенерованих користувачів */}
                {generatedUsers && generatedUsers.length > 0 && (
                    <div className="mt-4 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-700 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-200 dark:border-emerald-800/60 pb-3">
                            <div>
                                <h4 className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-1.5">
                                    Успішно згенеровано {generatedUsers.length} облікових записів!
                                </h4>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                    Збережіть, скопіюйте або роздрукуйте талони доступу для передачі студентам.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopyAllText}
                                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                                >
                                    Скопіювати все (TXT)
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrintOrPdf}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                                >
                                    Друк / Талони (PDF)
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-gray-800">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-emerald-100 dark:border-gray-700 bg-emerald-100/50 dark:bg-gray-700/50 text-[10px] font-extrabold uppercase text-emerald-900 dark:text-emerald-200">
                                        <th className="p-2.5">#</th>
                                        <th className="p-2.5">Тимчасове ім'я</th>
                                        <th className="p-2.5">Email / Логін</th>
                                        <th className="p-2.5">Пароль</th>
                                        <th className="p-2.5">Стать</th>
                                        <th className="p-2.5">Корпуси</th>
                                        <th className="p-2.5 text-right">Дія</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50 dark:divide-gray-700 text-[11px] text-gray-700 dark:text-gray-200">
                                    {generatedUsers.map((u, idx) => (
                                        <tr key={u.id || idx} className="hover:bg-emerald-50/40 dark:hover:bg-gray-700/30">
                                            <td className="p-2.5 font-bold text-gray-400">{idx + 1}</td>
                                            <td className="p-2.5 font-semibold text-gray-900 dark:text-white">{u.name}</td>
                                            <td className="p-2.5 font-mono text-emerald-700 dark:text-emerald-400 font-bold">{u.email}</td>
                                            <td className="p-2.5 font-mono text-amber-700 dark:text-amber-400 font-extrabold">{u.password}</td>
                                            <td className="p-2.5">{renderGenderBadge ? renderGenderBadge(u.gender) : (u.gender === "male" ? "Чоловіча" : u.gender === "female" ? "Жіноча" : "—")}</td>
                                            <td className="p-2.5">
                                                {u.allowed_building_names && u.allowed_building_names.length > 0 ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-semibold text-[10px]">
                                                        {u.allowed_building_names.join(", ")}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 dark:text-gray-400 font-normal">Усі корпуси</span>
                                                )}
                                            </td>
                                            <td className="p-2.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopySingle(`Логін: ${u.email} | Пароль: ${u.password}`)}
                                                    className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] hover:bg-emerald-100 transition-colors"
                                                >
                                                    Скопіювати
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Header & Filter Bar */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-gray-700 pb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
                            Реєстр користувачів та студентів
                        </h3>
                        <p className="text-xs text-gray-400">
                            Повний список зареєстрованих облікових записів ({filteredUsers.length} з {allUsers.length})
                        </p>
                    </div>

                    <div className="w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Пошук за ПІБ, email чи телефоном..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-72 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <select
                        value={userSpecialtyFilter}
                        onChange={(e) => setUserSpecialtyFilter(e.target.value)}
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Усі спеціальності</option>
                        {Array.from(new Set(allUsers.map((u) => u.specialty).filter(Boolean))).map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>

                    <select
                        value={userCourseFilter}
                        onChange={(e) => setUserCourseFilter(e.target.value)}
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Усі курси</option>
                        {[1, 2, 3, 4, 5, 6].map((c) => (
                            <option key={c} value={c}>{c} курс</option>
                        ))}
                    </select>

                    <select
                        value={userGroupFilter}
                        onChange={(e) => setUserGroupFilter(e.target.value)}
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Усі групи</option>
                        {Array.from(new Set(allUsers.map((u) => u.group).filter(Boolean))).map((g) => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>

                    <select
                        value={userGenderFilter}
                        onChange={(e) => setUserGenderFilter(e.target.value)}
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">Усі статі</option>
                        <option value="male">Чоловіча</option>
                        <option value="female">Жіноча</option>
                    </select>

                    <select
                        value={userInclusivityFilter}
                        onChange={(e) => setUserInclusivityFilter(e.target.value)}
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                    >
                        <option value="">Всі статуси</option>
                        <option value="inclusive">Тільки інклюзивні</option>
                        <option value="standard">Звичайні</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-gray-700/50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-gray-700">
                            <tr>
                                <th className="p-3.5 cursor-pointer" onClick={() => handleSort("name")}>
                                    ПІБ / Студент {renderSortArrow("name")}
                                </th>
                                <th className="p-3.5">Контакти</th>
                                <th className="p-3.5">Стать</th>
                                <th className="p-3.5">Спеціальність / Група</th>
                                <th className="p-3.5 text-right">Дії</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-gray-700 text-gray-700 dark:text-gray-200">
                            {paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">
                                        Користувачів за обраними фільтрами не знайдено.
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map((u) => {
                                    const isFemale = u.gender === "female";
                                    const isMale = u.gender === "male";

                                    return (
                                        <tr
                                            key={u.id}
                                            className={`transition-all ${
                                                isFemale
                                                    ? "bg-gradient-to-r from-pink-500/[0.045] via-pink-500/[0.015] to-transparent hover:from-pink-500/[0.09] dark:from-pink-500/[0.07] dark:via-pink-500/[0.02] dark:to-transparent dark:hover:from-pink-500/[0.13]"
                                                    : isMale
                                                    ? "bg-gradient-to-r from-blue-500/[0.045] via-blue-500/[0.015] to-transparent hover:from-blue-500/[0.09] dark:from-blue-500/[0.07] dark:via-blue-500/[0.02] dark:to-transparent dark:hover:from-blue-500/[0.13]"
                                                    : "hover:bg-slate-50/60 dark:hover:bg-gray-700/30"
                                            }`}
                                        >
                                            <td className="p-3.5 font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border transition-all ${
                                                            isFemale
                                                                ? "bg-pink-100/80 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border-pink-200/90 dark:border-pink-800/80 shadow-[0_0_12px_rgba(244,63,94,0.22)]"
                                                                : isMale
                                                                ? "bg-blue-100/80 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200/90 dark:border-blue-800/80 shadow-[0_0_12px_rgba(59,130,246,0.22)]"
                                                                : "bg-slate-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-slate-200 dark:border-gray-600"
                                                        }`}
                                                    >
                                                        {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2.5 flex-wrap">
                                                            <span className="font-bold text-gray-900 dark:text-white tracking-tight">
                                                                {u.name}
                                                            </span>
                                                            {Boolean(u.is_inclusive) && (
                                                                <span
                                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50/90 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/90 dark:border-sky-800/80 shadow-[0_0_10px_rgba(14,165,233,0.15)] tracking-wide ml-1"
                                                                    title="Особа з інвалідністю / особливими потребами"
                                                                >
                                                                    Інклюзивність
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        <td className="p-3.5 space-y-0.5">
                                            <div>{u.phone || "—"}</div>
                                            {u.telegram && <div className="text-emerald-600 dark:text-emerald-400 text-[11px]">{u.telegram}</div>}
                                        </td>
                                        <td className="p-3.5">{renderGenderBadge(u.gender)}</td>
                                        <td className="p-3.5">
                                            <div>{u.specialty || "—"}</div>
                                            <div className="text-[11px] text-gray-400">
                                                {u.course ? `${u.course} курс` : ""} {u.group ? `• Група ${u.group}` : ""}
                                            </div>
                                            {Array.isArray(u.allowed_buildings) && u.allowed_buildings.length > 0 && (
                                                <div className="mt-1 flex items-center gap-1 flex-wrap">
                                                    <span
                                                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60"
                                                        title={`Дозволено заселення лише у визначені корпуси (${u.allowed_buildings
                                                            .map(
                                                                (id) =>
                                                                    availableBuildings.find((b) => Number(b.id) === Number(id))?.name ||
                                                                    `№${id}`
                                                            )
                                                            .join(", ")})`}
                                                    >
                                                        {u.allowed_buildings.length === 1
                                                            ? availableBuildings.find((b) => Number(b.id) === Number(u.allowed_buildings[0]))?.name ||
                                                              `Корпус #${u.allowed_buildings[0]}`
                                                            : `${u.allowed_buildings.length} корп.`}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3.5 text-right whitespace-nowrap">
                                            <div className="inline-flex items-center justify-end gap-2">
                                                {u.role !== "admin" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setContactingUser(u)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/70 text-xs font-bold transition-all hover:shadow-2xs active:scale-95 shrink-0 cursor-pointer"
                                                        title="Зв'язатися зі студентом (Telegram, телефон або email)"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                        </svg>
                                                        <span>Зв'язок</span>
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditUserModal(u)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-gray-700/60 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-gray-600 text-xs font-bold transition-all hover:shadow-2xs active:scale-95 shrink-0 cursor-pointer"
                                                    title="Редагувати дані студента"
                                                >
                                                    <svg className="w-3.5 h-3.5 text-slate-500 dark:text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                    <span>Редагувати</span>
                                                </button>
                                                {u.role !== "admin" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImpersonate && handleImpersonate(u.id, u.name, "user")}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 text-xs font-bold transition-all hover:shadow-2xs active:scale-95 shrink-0 cursor-pointer"
                                                        title={`Увійти в кабінет як ${u.name}`}
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                        </svg>
                                                        <span>Увійти як</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Toolbar */}
                {filteredUsers.length > 0 && (
                    <div className="p-4 border-t border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                            <span>Показано {Math.min((currentPage - 1) * perPage + 1, filteredUsers.length)} - {Math.min(currentPage * perPage, filteredUsers.length)} із {filteredUsers.length}</span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="text-xs rounded-lg border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-1 px-2 text-gray-700 dark:text-gray-200"
                            >
                                <option value={10}>10 на сторінці</option>
                                <option value={15}>15 на сторінці</option>
                                <option value={25}>25 на сторінці</option>
                                <option value={50}>50 на сторінці</option>
                            </select>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-gray-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-700 font-medium transition-colors"
                                >
                                    &larr;
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                    .map((p, idx, arr) => (
                                        <React.Fragment key={p}>
                                            {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-1 text-gray-400">...</span>}
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPage(p)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                                    currentPage === p
                                                        ? "bg-emerald-600 text-white"
                                                        : "border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-gray-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-700 font-medium transition-colors"
                                >
                                    &rarr;
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Модальне вікно зв'язку зі студентом */}
            {contactingUser && (
                <ContactStudentModal
                    student={contactingUser}
                    onClose={() => setContactingUser(null)}
                />
            )}
        </div>
    );
}
