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

    // Допоміжні функції фільтрації
    const studentBelongsToBuilding = React.useCallback((u, bIdStr) => {
        if (bIdStr === "all") return true;
        if (bIdStr === "unassigned") {
            return !u.current_building_id && (!u.allowed_buildings || u.allowed_buildings.length === 0);
        }
        const bId = Number(bIdStr);
        if (Number(u.current_building_id) === bId) return true;
        if (!u.current_building_id && Array.isArray(u.allowed_buildings) && u.allowed_buildings.map(Number).includes(bId)) {
            return true;
        }
        return false;
    }, []);

    const studentBelongsToSpecialty = React.useCallback((u, specStr) => {
        if (specStr === "all") return true;
        return String(u.specialty || "").trim().toUpperCase() === String(specStr || "").trim().toUpperCase();
    }, []);

    // Студенти у поточній вибірці (Корпус + Спеціальність) - основа для графіка розподілу
    const scopedStudents = React.useMemo(() => {
        return allUsers.filter((u) => {
            if (!u.course) return false;
            if (!studentBelongsToBuilding(u, filterBuilding)) return false;
            if (!studentBelongsToSpecialty(u, filterSpecialty)) return false;
            return true;
        });
    }, [allUsers, filterBuilding, filterSpecialty, studentBelongsToBuilding, studentBelongsToSpecialty]);

    // Динамічний розподіл студентів по курсах 1-6 у вибраному корпусі та спеціальності
    const scopedCourseDistribution = React.useMemo(() => {
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        scopedStudents.forEach((u) => {
            const c = Number(u.course);
            if (dist[c] !== undefined) {
                dist[c] += 1;
            }
        });
        return dist;
    }, [scopedStudents]);

    // Студенти, що підпадають під дію точкового переведення (включаючи фільтр курсу)
    const matchingStudents = React.useMemo(() => {
        if (filterCourse === "all") return scopedStudents;
        return scopedStudents.filter((u) => Number(u.course) === Number(filterCourse));
    }, [scopedStudents, filterCourse]);

    // Підрахунок кількості студентів для селекторів корпусів (з урахуванням спеціальності)
    const buildingCounts = React.useMemo(() => {
        const counts = {};
        buildings.forEach((b) => {
            counts[b.id] = 0;
        });
        let unassigned = 0;

        allUsers.forEach((u) => {
            if (!u.course) return;
            if (!studentBelongsToSpecialty(u, filterSpecialty)) return;

            let assigned = false;
            buildings.forEach((b) => {
                if (studentBelongsToBuilding(u, String(b.id))) {
                    counts[b.id] = (counts[b.id] || 0) + 1;
                    assigned = true;
                }
            });
            if (!assigned && !u.current_building_id) {
                unassigned++;
            }
        });
        counts["unassigned"] = unassigned;
        return counts;
    }, [allUsers, buildings, filterSpecialty, studentBelongsToBuilding, studentBelongsToSpecialty]);

    // Підрахунок кількості студентів для селекторів спеціальностей (з урахуванням корпусу)
    const specialtyCounts = React.useMemo(() => {
        const counts = {};
        allUsers.forEach((u) => {
            if (!u.course) return;
            if (!studentBelongsToBuilding(u, filterBuilding)) return;
            const spec = String(u.specialty || "").trim().toUpperCase();
            if (spec) {
                counts[spec] = (counts[spec] || 0) + 1;
            }
        });
        return counts;
    }, [allUsers, filterBuilding, studentBelongsToBuilding]);

    // Швидке підвищення для всіх
    const handlePromoteAll = () => {
        const confirmMsg = `Ви впевнені, що хочете перевести ВСІХ діючих студентів на наступний курс (+1 курс) для ${yearLabel} навчального року?`;
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
        const confirmMsg = `УВАГА! Ви дійсно бажаєте повернути ВСІХ діючих студентів на 1 курс назад (-1 курс)? Це зменшить курс кожного студента (мінімум 1 курс).`;
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

    const resetAllFilters = () => {
        setFilterBuilding("all");
        setFilterSpecialty("all");
        setFilterCourse("all");
    };

    const hasActiveFilters = filterBuilding !== "all" || filterSpecialty !== "all" || filterCourse !== "all";

    // Назва та опис активного зрізу (scope)
    const selectedBuildingObj = buildings.find((b) => String(b.id) === String(filterBuilding));
    const selectedBuildingName = 
        filterBuilding === "all" ? "Всі корпуси" : 
        filterBuilding === "unassigned" ? "Без корпусу" : 
        (selectedBuildingObj?.name || `Корпус #${filterBuilding}`);

    let scopeBadgeText = "Всі гуртожитки та спеціальності";
    let scopeDescriptionText = "Загальний розподіл студентів коледжу по всіх курсах навчання";

    if (filterBuilding !== "all" && filterSpecialty !== "all") {
        scopeBadgeText = `${selectedBuildingName} • ${filterSpecialty}`;
        scopeDescriptionText = `Студенти спеціальності ${filterSpecialty} у ${selectedBuildingName}`;
    } else if (filterBuilding !== "all") {
        scopeBadgeText = selectedBuildingName;
        scopeDescriptionText = `Студенти, що проживають або закріплені за ${selectedBuildingName}`;
    } else if (filterSpecialty !== "all") {
        scopeBadgeText = `Спеціальність: ${filterSpecialty}`;
        scopeDescriptionText = `Студенти напряму ${filterSpecialty} по всіх гуртожитках`;
    }

    const COURSE_CONFIG = [
        { num: 1, label: "1 курс", bg: "bg-sky-500", text: "text-sky-700 dark:text-sky-300", lightBg: "bg-sky-50 dark:bg-sky-950/40", border: "border-sky-300 dark:border-sky-700", ring: "ring-sky-500" },
        { num: 2, label: "2 курс", bg: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", lightBg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-300 dark:border-emerald-700", ring: "ring-emerald-500" },
        { num: 3, label: "3 курс", bg: "bg-indigo-500", text: "text-indigo-700 dark:text-indigo-300", lightBg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-300 dark:border-indigo-700", ring: "ring-indigo-500" },
        { num: 4, label: "4 курс", bg: "bg-amber-500", text: "text-amber-700 dark:text-amber-300", lightBg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-300 dark:border-amber-700", ring: "ring-amber-500" },
        { num: 5, label: "5 курс", bg: "bg-purple-500", text: "text-purple-700 dark:text-purple-300", lightBg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", ring: "ring-purple-500" },
        { num: 6, label: "6 курс", bg: "bg-rose-500", text: "text-rose-700 dark:text-rose-300", lightBg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-300 dark:border-rose-700", ring: "ring-rose-500" },
    ];

    return (
        <div className="space-y-6">
            {/* Головний Центр Керування Навчальним Роком та Курсами */}
            <div className="bg-gradient-to-br from-indigo-50/90 via-white to-emerald-50/80 dark:from-indigo-950/40 dark:via-gray-800 dark:to-emerald-950/30 border border-indigo-100/90 dark:border-indigo-800/50 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
                
                {/* 1. Верхній рядок: Інформація про період + Компактні, вирівняні дії */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-indigo-100/70 dark:border-gray-700/60 pb-5">
                    <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-3.5 py-1 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-xs tracking-wider uppercase">
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
                            Щороку 1 вересня діючі студенти переходять на наступний курс навчання (1 → 2, 2 → 3 тощо). 
                            Ви можете виконати масове підвищення, повернути курс назад (-1), або гнучко обрати студентів конкретного корпусу чи спеціальності.
                        </p>
                    </div>

                    {/* Блок швидких глобальних дій: компактний та згрупований */}
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0 self-start lg:self-center">
                        {/* Кнопка перемикання автопереведення */}
                        <button
                            type="button"
                            onClick={handleToggleAutoPromote}
                            title="Автоматичне переведення щороку 1 вересня"
                            className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-600 transition-all cursor-pointer shadow-2xs whitespace-nowrap flex items-center gap-1.5"
                        >
                            <span className={`w-2 h-2 rounded-full ${autoPromote ? "bg-emerald-500" : "bg-slate-400"}`} />
                            <span>{autoPromote ? "Вимкнути авто" : "Увімкнути авто"}</span>
                        </button>

                        {/* Згрупований сегментований тулбар: -1 курс та +1 курс */}
                        <div className="inline-flex items-center bg-white dark:bg-gray-700 p-1 rounded-xl border border-slate-200 dark:border-gray-600 shadow-2xs whitespace-nowrap">
                            {/* Понизити -1 курс для всіх */}
                            <button
                                type="button"
                                disabled={isProcessing}
                                onClick={handleDemoteAll}
                                title="Повернути ВСІХ студентів на 1 курс назад (мінімум 1 курс)"
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                            >
                                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                </svg>
                                <span>-1 курс</span>
                            </button>

                            {/* Розділювач */}
                            <div className="h-4 w-px bg-slate-200 dark:bg-gray-600 mx-1" />

                            {/* Підвищити +1 курс для всіх */}
                            <button
                                type="button"
                                disabled={isProcessing}
                                onClick={handlePromoteAll}
                                title="Перевести ВСІХ діючих студентів на наступний курс (+1)"
                                className="px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                            >
                                <span>+1 курс</span>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Блок аналітики та динамічного графіка розподілу курсів */}
                <div className="bg-white/90 dark:bg-gray-850/90 backdrop-blur-sm rounded-2xl border border-indigo-100 dark:border-gray-700/80 p-4 sm:p-5 space-y-4 shadow-2xs">
                    {/* Верхній рядок графіка: назва вибірки + швидкі фільтри корпусу/напряму + кнопка деталей */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-gray-700/60">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-gray-100 flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Графік розподілу студентів
                                </span>

                                {/* Динамічний тег активної вибірки з кількістю */}
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    hasActiveFilters
                                        ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                        : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700"
                                }`}>
                                    <span>{scopeBadgeText}</span>
                                    <span className="font-black ml-0.5">({scopedStudents.length} студ.)</span>
                                </span>

                                {/* Кнопка швидкого скидання фільтрів */}
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={resetAllFilters}
                                        className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-dotted ml-1 transition-colors cursor-pointer"
                                    >
                                        ✕ Показати всіх
                                    </button>
                                )}
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-gray-400">
                                {scopeDescriptionText}
                            </p>
                        </div>

                        {/* Швидкі селектори фільтрації корпусу та напряму прямо на графіку */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Швидкий вибір корпусу */}
                            <select
                                value={filterBuilding}
                                onChange={(e) => setFilterBuilding(e.target.value)}
                                className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-200 py-1.5 px-2.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                            >
                                <option value="all">Усі корпуси</option>
                                {buildings.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} ({buildingCounts[b.id] ?? 0} студ.)
                                    </option>
                                ))}
                                <option value="unassigned">Без корпусу ({buildingCounts["unassigned"] ?? 0})</option>
                            </select>

                            {/* Швидкий вибір спеціальності */}
                            <select
                                value={filterSpecialty}
                                onChange={(e) => setFilterSpecialty(e.target.value)}
                                className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-200 py-1.5 px-2.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                            >
                                <option value="all">Усі спеціальності</option>
                                {specialties.map((s) => (
                                    <option key={s.id} value={s.name}>
                                        {s.name} ({specialtyCounts[s.name.toUpperCase()] ?? 0} студ.)
                                    </option>
                                ))}
                            </select>

                            {/* Кнопка розгортання панелі параметрів точкового переведення */}
                            <button
                                type="button"
                                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
                                    isAdvancedOpen 
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/20" 
                                        : "bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-750"
                                }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                <span>Точкове керування</span>
                                {filterCourse !== "all" && (
                                    <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[10px]">
                                        {filterCourse} курс
                                    </span>
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
                    </div>

                    {/* Візуальна кольорова сегментована смуга розподілу */}
                    <div className="space-y-1.5">
                        <div className="h-3.5 w-full bg-slate-100 dark:bg-gray-750 rounded-full overflow-hidden flex p-0.5 gap-0.5 shadow-inner">
                            {scopedStudents.length === 0 ? (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-medium">
                                    Немає студентів за обраними критеріями
                                </div>
                            ) : (
                                COURSE_CONFIG.map((c) => {
                                    const count = scopedCourseDistribution[c.num] || 0;
                                    if (count === 0) return null;
                                    const pct = Math.round((count / scopedStudents.length) * 100);
                                    return (
                                        <div
                                            key={c.num}
                                            style={{ width: `${(count / scopedStudents.length) * 100}%` }}
                                            title={`${c.label}: ${count} студ. (${pct}%)`}
                                            className={`${c.bg} h-full rounded-full transition-all duration-300 hover:brightness-110 cursor-pointer`}
                                            onClick={() => {
                                                setFilterCourse(filterCourse === String(c.num) ? "all" : String(c.num));
                                                if (!isAdvancedOpen) setIsAdvancedOpen(true);
                                            }}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Інтерактивні картки курсів (1 - 6) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        {COURSE_CONFIG.map((c) => {
                            const count = scopedCourseDistribution[c.num] || 0;
                            const pct = scopedStudents.length > 0 ? Math.round((count / scopedStudents.length) * 100) : 0;
                            const isSelected = filterCourse === String(c.num);

                            return (
                                <button
                                    key={c.num}
                                    type="button"
                                    onClick={() => {
                                        setFilterCourse(isSelected ? "all" : String(c.num));
                                        if (!isAdvancedOpen) setIsAdvancedOpen(true);
                                    }}
                                    className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer relative overflow-hidden group shadow-2xs ${
                                        isSelected
                                            ? `bg-white dark:bg-gray-800 ${c.border} ring-2 ${c.ring} shadow-md scale-[1.02]`
                                            : count > 0
                                            ? `bg-white dark:bg-gray-800/90 border-slate-200/80 dark:border-gray-700/80 hover:border-slate-300 dark:hover:border-gray-600 hover:shadow-xs`
                                            : `bg-slate-50/70 dark:bg-gray-800/40 border-slate-100 dark:border-gray-750 opacity-60 hover:opacity-100`
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-1 w-full">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${c.bg}`} />
                                            <span className="text-xs font-bold text-slate-700 dark:text-gray-200">
                                                {c.label}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${c.lightBg} ${c.text}`}>
                                                Обрано
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-2.5 flex items-baseline justify-between w-full">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-slate-900 dark:text-white">
                                                {count}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                студ.
                                            </span>
                                        </div>
                                        <span className={`text-[11px] font-black ${count > 0 ? c.text : "text-slate-400"}`}>
                                            {pct}%
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
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
                                    {buildings.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} ({buildingCounts[b.id] ?? 0} студ.)
                                        </option>
                                    ))}
                                    <option value="unassigned">Без корпусу / Вільні ({buildingCounts["unassigned"] ?? 0} студ.)</option>
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
                                            {s.name} ({specialtyCounts[s.name.toUpperCase()] ?? 0} студ.)
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
                                            Тільки {c.number} курс ({scopedCourseDistribution[c.number] || 0} студ.)
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
                                        onClick={resetAllFilters}
                                        className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
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
