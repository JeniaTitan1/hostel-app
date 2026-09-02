import React, { useState, useEffect } from "react";

export default function UsersTab({
    allUsers = [],
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
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

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

        return (
            matchesSearch &&
            matchesSpecialty &&
            matchesCourse &&
            matchesGroup &&
            matchesGender
        );
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [userSearch, userSpecialtyFilter, userCourseFilter, userGroupFilter, userGenderFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    return (
        <div className="space-y-6">
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

                    <input
                        type="text"
                        placeholder="Пошук за ПІБ, email чи телефоном..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-72 focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                        <option value="male">Чоловіки ♂</option>
                        <option value="female">Жінки ♀</option>
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
                                paginatedUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-3.5 font-medium">
                                            <div className="font-bold text-gray-900 dark:text-white">{u.name}</div>
                                            <div className="text-[11px] text-gray-400 font-mono">{u.email}</div>
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
                                        </td>
                                        <td className="p-3.5 text-right space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEditUserModal(u)}
                                                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold rounded-lg hover:bg-emerald-100 transition-all text-[11px]"
                                            >
                                                Редагувати
                                            </button>
                                            {isSuperAdmin && u.role !== "admin" && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleImpersonate && handleImpersonate(u.id, u.name)}
                                                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg hover:bg-indigo-100 transition-all text-[11px]"
                                                >
                                                    Увійти як
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
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
        </div>
    );
}
