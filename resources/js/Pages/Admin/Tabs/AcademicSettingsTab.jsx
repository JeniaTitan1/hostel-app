import React from "react";
import { useForm, router } from "@inertiajs/react";

export default function AcademicSettingsTab({
    specialties = [],
    courses = [],
    groups = [],
    academicPromotionInfo = {},
    buildings = [],
    allUsers = [],
    triggerConfirm,
}) {
    const specialtyForm = useForm({ name: "" });
    const courseForm = useForm({ number: "" });
    const groupForm = useForm({ name: "" });
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

    // Стан для точкового/вибіркового переведення
    const [filterBuilding, setFilterBuilding] = React.useState("all");
    const [filterSpecialty, setFilterSpecialty] = React.useState("all");
    const [filterCourse, setFilterCourse] = React.useState("all");
    const [direction, setDirection] = React.useState("+1");

    const currentYear = academicPromotionInfo?.currentAcademicYear || new Date().getFullYear();
    const yearLabel = academicPromotionInfo?.academicYearLabel || `${currentYear}/${currentYear + 1}`;
    const autoPromote = academicPromotionInfo?.autoPromote ?? true;
    const lastPromotedYear = academicPromotionInfo?.lastPromotedYear;
    const lastPromotedDate = academicPromotionInfo?.lastPromotedDate;
    const totalStudents = academicPromotionInfo?.totalStudents ?? allUsers.filter((u) => u.course).length;
    const courseDistribution = academicPromotionInfo?.courseDistribution || {};
    const buildingDistribution = academicPromotionInfo?.buildingDistribution || [];
    const unassignedCount = academicPromotionInfo?.unassignedCount ?? 0;

    // Розрахунок студентів, що підпадають під обрані фільтри в реальному часі
    const matchingStudents = React.useMemo(() => {
        return allUsers.filter((u) => {
            if (!u.course) return false;

            // Фільтр по початковому курсу
            if (filterCourse !== "all" && Number(u.course) !== Number(filterCourse)) {
                return false;
            }

            // Фільтр по спеціальності
            if (filterSpecialty !== "all" && u.specialty !== filterSpecialty) {
                return false;
            }

            // Фільтр по корпусу
            if (filterBuilding === "unassigned") {
                if (u.current_building_id) return false;
            } else if (filterBuilding !== "all") {
                const bId = Number(filterBuilding);
                const livesInBuilding = Number(u.current_building_id) === bId;
                const allowedInBuilding = Array.isArray(u.allowed_buildings) && u.allowed_buildings.map(Number).includes(bId);
                if (!livesInBuilding && !allowedInBuilding) {
                    return false;
                }
            }

            return true;
        });
    }, [allUsers, filterBuilding, filterSpecialty, filterCourse]);

    // Швидке підвищення для всіх
    const handlePromoteAll = () => {
        const confirmMsg = `Ви впевнені, що хочете перевести всіх діючих студентів на наступний курс (+1 курс) для ${yearLabel} навчального року?`;
        const doPromote = () => {
            setIsProcessing(true);
            router.post(
                route("admin.academic.promote"),
                { direction: "+1", force: true },
                { onFinish: () => setIsProcessing(false) }
            );
        };

        if (triggerConfirm) {
            triggerConfirm(confirmMsg, doPromote);
        } else if (confirm(confirmMsg)) {
            doPromote();
        }
    };

    // Швидке пониження для всіх (відкат помилки або повернення назад)
    const handleDemoteAll = () => {
        const confirmMsg = `УВАГА! Ви дійсно бажаєте перевести ВСІХ діючих студентів на 1 курс нижче (-1 курс)? Це зменшить курс кожного студента (мінімум 1 курс).`;
        const doDemote = () => {
            setIsProcessing(true);
            router.post(
                route("admin.academic.promote"),
                { direction: "-1", force: true },
                { onFinish: () => setIsProcessing(false) }
            );
        };

        if (triggerConfirm) {
            triggerConfirm(confirmMsg, doDemote);
        } else if (confirm(confirmMsg)) {
            doDemote();
        }
    };

    // Точкове застосування переведення з урахуванням обраних критеріїв
    const handleExecuteTargeted = () => {
        const count = matchingStudents.length;
        if (count === 0) {
            alert("Жоден студент не відповідає обраним параметрам фільтрації.");
            return;
        }

        const dirWord = direction === "+1" ? "підвищити на наступний курс (+1)" : "понизити на курс нижче (-1)";
        const bObj = buildings.find((b) => String(b.id) === String(filterBuilding));
        const bName = filterBuilding === "all" ? "Всі корпуси" : filterBuilding === "unassigned" ? "Без корпусу (вільні)" : (bObj?.name || `Корпус #${filterBuilding}`);
        const specName = filterSpecialty === "all" ? "Всі спеціальності" : `Спеціальність ${filterSpecialty}`;
        const courseName = filterCourse === "all" ? "Будь-який курс" : `${filterCourse}-й курс`;

        const confirmMsg = `Підтвердіть дію: ${dirWord}\n\nКількість студентів до зміни: ${count}\n\nПараметри вибірки:\n• Корпус: ${bName}\n• Спеціальність: ${specName}\n• Початковий курс: ${courseName}`;

        const doAction = () => {
            setIsProcessing(true);
            router.post(
                route("admin.academic.promote"),
                {
                    direction,
                    building_id: filterBuilding,
                    specialty: filterSpecialty,
                    source_course: filterCourse,
                    force: true,
                },
                { onFinish: () => setIsProcessing(false) }
            );
        };

        if (triggerConfirm) {
            triggerConfirm(confirmMsg, doAction);
        } else if (confirm(confirmMsg)) {
            doAction();
        }
    };

    const handleToggleAutoPromote = () => {
        router.post(route("admin.academic.toggle-auto-promote"));
    };

    const hasActiveFilters = filterBuilding !== "all" || filterSpecialty !== "all" || filterCourse !== "all";

    return (
        <div className="space-y-6">
            {/* Головний Центр Керування Навчальним Роком та Курсами */}
            <div className="bg-gradient-to-br from-indigo-50/90 via-white to-emerald-50/80 dark:from-indigo-950/40 dark:via-gray-800 dark:to-emerald-950/30 border border-indigo-100/90 dark:border-indigo-800/50 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
                
                {/* 1. Верхній рядок: Інформація про період + Швидкі глобальні дії */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-indigo-100/70 dark:border-gray-700/60 pb-5">
                    <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-3.5 py-1 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-sm tracking-wider uppercase">
                                {yearLabel} Навчальний рік
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                                autoPromote 
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60" 
                                    : "bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-600"
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${autoPromote ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                                {autoPromote ? "Автопереведення: 1 вересня щороку" : "Автопереведення вимкнено"}
                            </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                            Академічний календар та керування курсами
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                            Щороку 1 вересня діючі студенти переходять на наступний курс навчання (1 курс → 2 курс, 2 → 3 тощо). 
                            Ви можете виконати масове підвищення, повернути курс назад (-1), або гнучко обрати студентів конкретного корпусу чи спеціальності.
                        </p>
                    </div>

                    {/* Блок швидких глобальних дій */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleToggleAutoPromote}
                            title="Автоматичне переведення щороку 1 вересня"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-600 transition-all cursor-pointer shadow-2xs"
                        >
                            {autoPromote ? "Вимкнути авто 1 вересня" : "Увімкнути авто 1 вересня"}
                        </button>

                        {/* Кнопка: Понизити на -1 курс для всіх */}
                        <button
                            type="button"
                            disabled={isProcessing}
                            onClick={handleDemoteAll}
                            title="Повернути всіх студентів на 1 курс назад (мінімум 1 курс)"
                            className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300/80 dark:border-amber-800/60 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            <span>Перевести всіх на -1 курс</span>
                        </button>

                        {/* Кнопка: Підвищити на +1 курс для всіх */}
                        <button
                            type="button"
                            disabled={isProcessing}
                            onClick={handlePromoteAll}
                            title="Перевести всіх діючих студентів на наступний курс (+1)"
                            className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span>Перевести всіх на +1 курс</span>
                        </button>
                    </div>
                </div>

                {/* 2. Середній рядок: Розподіл студентів за курсами + Кнопка розгортання точкового керування */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-slate-500 dark:text-gray-400 font-medium text-[11px] mr-1">
                            Розподіл ({totalStudents} студ.):
                        </span>
                        {[1, 2, 3, 4, 5, 6].map((num) => {
                            const count = courseDistribution[num] || 0;
                            return (
                                <span
                                    key={num}
                                    className={`px-2.5 py-1 rounded-xl font-bold border transition-all text-[11px] ${
                                        count > 0 
                                            ? "bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-200 border-slate-200 dark:border-gray-700 shadow-2xs" 
                                            : "bg-slate-100/60 dark:bg-gray-800/40 text-slate-400 dark:text-gray-500 border-transparent"
                                    }`}
                                >
                                    {num} курс: <strong className="ml-0.5 text-indigo-600 dark:text-indigo-400">{count}</strong>
                                </span>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isAdvancedOpen 
                                ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700 shadow-2xs" 
                                : "bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-750"
                        }`}
                    >
                        <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <span>Гнучке переведення за фільтрами</span>
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                        )}
                        <svg
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${isAdvancedOpen ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* 3. Розгорнута панель точкового / вибіркового керування */}
                {isAdvancedOpen && (
                    <div className="bg-white/95 dark:bg-gray-850 backdrop-blur-md rounded-2xl border border-indigo-100 dark:border-gray-700/80 p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-700/60 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-gray-200">
                                    Параметри вибіркового переведення
                                </h4>
                            </div>
                            <span className="text-[11px] text-slate-400">
                                Оберіть корпус, напрям чи курс для точкової зміни
                            </span>
                        </div>

                        {/* Сітка фільтрів */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                            {/* А) Корпус */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-gray-300">
                                    Гуртожиток / Корпус
                                </label>
                                <select
                                    value={filterBuilding}
                                    onChange={(e) => setFilterBuilding(e.target.value)}
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">Усі корпуси (загалом)</option>
                                    {buildings.map((b) => {
                                        const dist = buildingDistribution.find((item) => Number(item.id) === Number(b.id));
                                        return (
                                            <option key={b.id} value={b.id}>
                                                {b.name} {dist ? `(${dist.count} студ.)` : ""}
                                            </option>
                                        );
                                    })}
                                    <option value="unassigned">Без корпусу / Вільні ({unassignedCount} студ.)</option>
                                </select>
                            </div>

                            {/* Б) Спеціальність */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-gray-300">
                                    Спеціальність / Напрям
                                </label>
                                <select
                                    value={filterSpecialty}
                                    onChange={(e) => setFilterSpecialty(e.target.value)}
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">Усі спеціальності</option>
                                    {specialties.map((s) => (
                                        <option key={s.id} value={s.name}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* В) Початковий курс */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-gray-300">
                                    Поточний курс студентів
                                </label>
                                <select
                                    value={filterCourse}
                                    onChange={(e) => setFilterCourse(e.target.value)}
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">Усі курси (1 - 6)</option>
                                    {courses.map((c) => (
                                        <option key={c.id} value={c.number}>
                                            Тільки {c.number} курс ({courseDistribution[c.number] || 0} студ.)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Г) Дія: +1 або -1 */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-gray-300">
                                    Напрямок переведення
                                </label>
                                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-gray-800 rounded-xl border border-slate-200/80 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setDirection("+1")}
                                        className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                                            direction === "+1" 
                                                ? "bg-emerald-600 text-white shadow-xs" 
                                                : "text-slate-600 dark:text-gray-400 hover:text-slate-900"
                                        }`}
                                    >
                                        +1 Наступний
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDirection("-1")}
                                        className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                                            direction === "-1" 
                                                ? "bg-amber-600 text-white shadow-xs" 
                                                : "text-slate-600 dark:text-gray-400 hover:text-slate-900"
                                        }`}
                                    >
                                        -1 Попередній
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Підсумок вибірки та кнопка запуску */}
                        <div className="pt-3 border-t border-slate-100 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                                <span className="font-bold text-slate-700 dark:text-gray-200">
                                    Під дію підпадає:
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-black">
                                    {matchingStudents.length} студентів
                                </span>

                                {matchingStudents.length > 0 && (
                                    <div className="hidden lg:flex items-center gap-1.5 ml-2 text-[11px] text-slate-500">
                                        <span>Наприклад:</span>
                                        {matchingStudents.slice(0, 3).map((s) => (
                                            <span key={s.id} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300">
                                                {s.name} ({s.course} к.)
                                            </span>
                                        ))}
                                        {matchingStudents.length > 3 && (
                                            <span className="text-slate-400">+ ще {matchingStudents.length - 3}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFilterBuilding("all");
                                            setFilterSpecialty("all");
                                            setFilterCourse("all");
                                        }}
                                        className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                    >
                                        Скинути фільтри
                                    </button>
                                )}

                                <button
                                    type="button"
                                    disabled={isProcessing || matchingStudents.length === 0}
                                    onClick={handleExecuteTargeted}
                                    className={`px-5 py-2 rounded-xl text-xs font-black text-white transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40 ${
                                        direction === "+1"
                                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                                            : "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                                    }`}
                                >
                                    {isProcessing
                                        ? "Виконується..."
                                        : `Застосувати ${direction === "+1" ? "+1 курс" : "-1 курс"} для ${matchingStudents.length} студ.`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Напрями */}
                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 space-y-4">
                    <div className="border-b border-slate-100 dark:border-gray-700 pb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                            Напрями навчання
                        </h3>
                        <p className="text-[11px] text-gray-400">
                            Спеціальності або напрями підготовки студентів
                        </p>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            specialtyForm.post(route("admin.specialties.store"), {
                                onSuccess: () => specialtyForm.reset(),
                            });
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            placeholder="Напр. КН"
                            value={specialtyForm.data.name}
                            onChange={(e) => specialtyForm.setData("name", e.target.value.toUpperCase())}
                            className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1"
                            required
                        />
                        <button
                            type="submit"
                            disabled={specialtyForm.processing}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            Додати
                        </button>
                    </form>
                    <div className="divide-y divide-slate-100 dark:divide-gray-700 border border-slate-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                        {specialties.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-400">
                                Напрями відсутні
                            </div>
                        ) : (
                            specialties.map((spec) => (
                                <div key={spec.id} className="p-3 flex justify-between items-center text-xs text-gray-800 dark:text-gray-200">
                                    <span className="font-bold">{spec.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (triggerConfirm) {
                                                triggerConfirm(`Ви впевнені, що хочете видалити напрям ${spec.name}?`, () => {
                                                    router.post(route("admin.specialties.destroy", spec.id));
                                                });
                                            } else if (confirm(`Видалити напрям ${spec.name}?`)) {
                                                router.post(route("admin.specialties.destroy", spec.id));
                                            }
                                        }}
                                        className="text-red-500 font-bold hover:underline"
                                    >
                                        Видалити
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Курси */}
                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 space-y-4">
                    <div className="border-b border-slate-100 dark:border-gray-700 pb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Курси</h3>
                        <p className="text-[11px] text-gray-400">Роки навчання або номери курсів</p>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            courseForm.post(route("admin.courses.store"), {
                                onSuccess: () => courseForm.reset(),
                            });
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="Напр. 1"
                            value={courseForm.data.number}
                            onChange={(e) => courseForm.setData("number", e.target.value)}
                            className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1"
                            required
                        />
                        <button
                            type="submit"
                            disabled={courseForm.processing}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            Додати
                        </button>
                    </form>
                    <div className="divide-y divide-slate-100 dark:divide-gray-700 border border-slate-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                        {courses.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-400">Курси відсутні</div>
                        ) : (
                            courses.map((c) => (
                                <div key={c.id} className="p-3 flex justify-between items-center text-xs text-gray-800 dark:text-gray-200">
                                    <span className="font-bold">{c.number} курс</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (triggerConfirm) {
                                                triggerConfirm(`Видалити курс ${c.number}?`, () => {
                                                    router.post(route("admin.courses.destroy", c.id));
                                                });
                                            } else if (confirm(`Видалити курс ${c.number}?`)) {
                                                router.post(route("admin.courses.destroy", c.id));
                                            }
                                        }}
                                        className="text-red-500 font-bold hover:underline"
                                    >
                                        Видалити
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Групи */}
                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 space-y-4">
                    <div className="border-b border-slate-100 dark:border-gray-700 pb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Академічні групи</h3>
                        <p className="text-[11px] text-gray-400">Номери або ідентифікатори груп</p>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            groupForm.post(route("admin.groups.store"), {
                                onSuccess: () => groupForm.reset(),
                            });
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            placeholder="Напр. 11"
                            value={groupForm.data.name}
                            onChange={(e) => groupForm.setData("name", e.target.value)}
                            className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1"
                            required
                        />
                        <button
                            type="submit"
                            disabled={groupForm.processing}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            Додати
                        </button>
                    </form>
                    <div className="divide-y divide-slate-100 dark:divide-gray-700 border border-slate-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                        {groups.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-400">Групи відсутні</div>
                        ) : (
                            groups.map((g) => (
                                <div key={g.id} className="p-3 flex justify-between items-center text-xs text-gray-800 dark:text-gray-200">
                                    <span className="font-bold">Група {g.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (triggerConfirm) {
                                                triggerConfirm(`Видалити групу ${g.name}?`, () => {
                                                    router.post(route("admin.groups.destroy", g.id));
                                                });
                                            } else if (confirm(`Видалити групу ${g.name}?`)) {
                                                router.post(route("admin.groups.destroy", g.id));
                                            }
                                        }}
                                        className="text-red-500 font-bold hover:underline"
                                    >
                                        Видалити
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
