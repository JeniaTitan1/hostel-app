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

    const [promotionMode, setPromotionMode] = React.useState("targeted"); // "targeted" | "mass"

    return (
        <div className="space-y-6">
            {/* Пульт керування та переведення курсів */}
            <div className="bg-gradient-to-br from-indigo-50/90 via-white to-emerald-50/80 dark:from-indigo-950/40 dark:via-gray-800 dark:to-emerald-950/30 border border-indigo-100/90 dark:border-indigo-800/50 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
                
                {/* 1. Верхній рядок: Інформація про період + Автопереведення */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-indigo-100/70 dark:border-gray-700/60 pb-5">
                    <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-3 py-1 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-xs tracking-wider uppercase">
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
                            Пульт керування та переведення курсів
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                            Інструмент переведення студентів з курсу на курс (+1 або -1). Ви можете перевести всіх студентів коледжу в один клік або точково обрати окремий корпус, факультет чи курс.
                        </p>
                    </div>

                    {/* Перемикач автоматичного переведення */}
                    <div className="flex items-center gap-2.5 flex-shrink-0 self-start lg:self-center">
                        <button
                            type="button"
                            onClick={handleToggleAutoPromote}
                            title="Перемикач автоматичного переведення на 1 вересня"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-600 transition-all cursor-pointer shadow-2xs whitespace-nowrap flex items-center gap-2"
                        >
                            <span className={`w-2 h-2 rounded-full ${autoPromote ? "bg-emerald-500" : "bg-slate-400"}`} />
                            <span>{autoPromote ? "Вимкнути авто 1 вересня" : "Увімкнути авто 1 вересня"}</span>
                        </button>
                    </div>
                </div>

                {/* 2. Перемикач режимів: Точкове за фільтрами / Масове для всіх */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="inline-flex p-1 bg-slate-100 dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-gray-700 shadow-inner">
                        <button
                            type="button"
                            onClick={() => setPromotionMode("targeted")}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                                promotionMode === "targeted"
                                    ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            <span>Вибіркове переведення за параметрами</span>
                            {hasActiveFilters && (
                                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setPromotionMode("mass")}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                                promotionMode === "mass"
                                    ? "bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Масове переведення для всіх студентів</span>
                        </button>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                        <span>Загалом у коледжі:</span>
                        <strong className="text-slate-800 dark:text-white font-black">{totalStudents} діючих студентів</strong>
                    </div>
                </div>

                {/* 3. РЕЖИМ А: ВИБІРКОВЕ ПЕРЕВЕДЕННЯ ЗА ФІЛЬТРАМИ */}
                {promotionMode === "targeted" && (
                    <div className="bg-white/95 dark:bg-gray-850 backdrop-blur-sm rounded-2xl border border-indigo-100 dark:border-gray-700/80 p-5 space-y-5 shadow-xs animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-700/60 pb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-gray-200">
                                    Параметри вибірки студентів
                                </h4>
                                {hasActiveFilters && (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                        {scopeBadgeText}
                                    </span>
                                )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                                Оберіть корпус, напрям та початковий курс для точкового переведення
                            </span>
                        </div>

                        {/* Сітка 4-х селекторів */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                            {/* 1. Корпус */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-gray-300">
                                    Гуртожиток / Корпус
                                </label>
                                <select
                                    value={filterBuilding}
                                    onChange={(e) => setFilterBuilding(e.target.value)}
                                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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

                            {/* 2. Спеціальність / Факультет */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-gray-300">
                                    Спеціальність / Факультет
                                </label>
                                <select
                                    value={filterSpecialty}
                                    onChange={(e) => setFilterSpecialty(e.target.value)}
                                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                    <option value="all">Усі спеціальності</option>
                                    {specialties.map((s) => (
                                        <option key={s.id} value={s.name}>
                                            {s.name} ({specialtyCounts[s.name.toUpperCase()] ?? 0} студ.)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. Початковий курс */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-gray-300">
                                    Поточний курс студентів
                                </label>
                                <select
                                    value={filterCourse}
                                    onChange={(e) => setFilterCourse(e.target.value)}
                                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                    <option value="all">Усі курси (1 - 6)</option>
                                    {courses.map((c) => (
                                        <option key={c.id} value={c.number}>
                                            Тільки {c.number} курс ({scopedCourseDistribution[c.number] || 0} студ.)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 4. Напрямок зміни курсу */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-gray-300">
                                    Напрямок переведення
                                </label>
                                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-gray-800 rounded-xl border border-slate-200/80 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setDirection("+1")}
                                        className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                            direction === "+1" 
                                                ? "bg-emerald-600 text-white shadow-xs" 
                                                : "text-slate-600 dark:text-gray-400 hover:text-slate-900"
                                        }`}
                                    >
                                        <span>+1 Наступний</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDirection("-1")}
                                        className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                            direction === "-1" 
                                                ? "bg-amber-600 text-white shadow-xs" 
                                                : "text-slate-600 dark:text-gray-400 hover:text-slate-900"
                                        }`}
                                    >
                                        <span>-1 Попередній</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Live Preview панель підсумку та запуску дії */}
                        <div className="pt-4 border-t border-slate-100 dark:border-gray-700/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap text-xs">
                                    <span className="font-bold text-slate-700 dark:text-gray-200">
                                        Під дію підпадає:
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-black">
                                        {matchingStudents.length} студентів
                                    </span>
                                    <span className="text-slate-400 font-medium text-[11px]">
                                        ({direction === "+1" ? "перейдуть на курс вище" : "повернуться на курс назад"})
                                    </span>
                                </div>

                                {/* Список карток студентів з зазначенням конкретного переходу */}
                                {matchingStudents.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                        <span className="text-slate-400 font-medium">Попередній перегляд:</span>
                                        {matchingStudents.slice(0, 5).map((s) => {
                                            const currentC = Number(s.course);
                                            const targetC = direction === "+1" ? Math.min(6, currentC + 1) : Math.max(1, currentC - 1);
                                            return (
                                                <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-gray-200 border border-slate-200/80 dark:border-gray-700">
                                                    <span className="font-bold">{s.name}</span>
                                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                                                        ({currentC}к → {targetC}к)
                                                    </span>
                                                </span>
                                            );
                                        })}
                                        {matchingStudents.length > 5 && (
                                            <span className="text-slate-400 font-medium">
                                                + ще {matchingStudents.length - 5} студентів
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Кнопки скидання та застосування */}
                            <div className="flex items-center gap-2.5 self-end lg:self-center">
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={resetAllFilters}
                                        className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                                    >
                                        Скинути параметри
                                    </button>
                                )}

                                <button
                                    type="button"
                                    disabled={isProcessing || matchingStudents.length === 0}
                                    onClick={handleExecuteTargeted}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40 flex items-center gap-2 ${
                                        direction === "+1"
                                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                                            : "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                                    }`}
                                >
                                    {isProcessing ? (
                                        "Виконується..."
                                    ) : (
                                        <>
                                            <span>Застосувати {direction === "+1" ? "+1 курс" : "-1 курс"}</span>
                                            <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">
                                                для {matchingStudents.length} студ.
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. РЕЖИМ Б: МАСОВЕ ПЕРЕВЕДЕННЯ ДЛЯ ВСІХ СТУДЕНТІВ */}
                {promotionMode === "mass" && (
                    <div className="bg-white/95 dark:bg-gray-850 backdrop-blur-sm rounded-2xl border border-indigo-100 dark:border-gray-700/80 p-5 space-y-5 shadow-xs animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-700/60 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-gray-200">
                                    Масове переведення для всіх студентів коледжу
                                </h4>
                            </div>
                            <span className="text-[11px] text-slate-400">
                                Діє одночасно на всіх {totalStudents} діючих студентів
                            </span>
                        </div>

                        {/* Зведення студентів за курсами */}
                        <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-50 dark:bg-gray-800/60 p-3 rounded-xl border border-slate-100 dark:border-gray-700">
                            <span className="text-slate-500 dark:text-gray-400 font-bold mr-1">
                                Поточний розподіл ({totalStudents} студентів):
                            </span>
                            {[1, 2, 3, 4, 5, 6].map((num) => {
                                const count = courseDistribution[num] || 0;
                                return (
                                    <span
                                        key={num}
                                        className="px-2.5 py-1 rounded-lg font-bold bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-200 border border-slate-200 dark:border-gray-600 text-xs shadow-2xs"
                                    >
                                        {num} курс: <strong className="ml-0.5 text-indigo-600 dark:text-indigo-400">{count}</strong>
                                    </span>
                                );
                            })}
                        </div>

                        {/* Дві великі картки швидкої масової дії */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Картка підвищення +1 */}
                            <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/70 bg-gradient-to-br from-emerald-50/70 to-white dark:from-emerald-950/30 dark:to-gray-800 space-y-3 flex flex-col justify-between shadow-2xs">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
                                            +1
                                        </span>
                                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                            Перевести ВСІХ на наступний курс
                                        </h5>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                                        Збільшує курс кожного діючого студента на +1 (1 курс → 2, 2 → 3 тощо). Випускники 6-го курсу позначаються як такі, що завершили навчання.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={isProcessing || totalStudents === 0}
                                    onClick={handlePromoteAll}
                                    className="w-full py-3 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    <span>Перевести всіх {totalStudents} студентів на +1 курс</span>
                                </button>
                            </div>

                            {/* Картка повернення -1 */}
                            <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-800/70 bg-gradient-to-br from-amber-50/70 to-white dark:from-amber-950/30 dark:to-gray-800 space-y-3 flex flex-col justify-between shadow-2xs">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black shadow-xs">
                                            -1
                                        </span>
                                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                            Повернути ВСІХ на 1 курс назад
                                        </h5>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                                        Зменшує курс кожного студента на 1 назад (2 курс → 1, 3 → 2 тощо). Використовуйте у разі випадкової помилки або для відкату. Мінімальний курс — 1-й.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={isProcessing || totalStudents === 0}
                                    onClick={handleDemoteAll}
                                    className="w-full py-3 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-amber-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                    </svg>
                                    <span>Повернути всіх {totalStudents} студентів на -1 курс</span>
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
