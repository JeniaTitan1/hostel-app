import React, { useState, useEffect, useMemo } from "react";
import { router } from "@inertiajs/react";
import AddRoomModal from "@/Pages/Admin/Modals/AddRoomModal";
import AddFloorModal from "@/Pages/Admin/Modals/AddFloorModal";
import AddBuildingModal from "@/Pages/Admin/Modals/AddBuildingModal";

export default function RoomMapTab({
    buildings = [],
    selectedBuildingFilter,
    setSelectedBuildingFilter,
    mapSearch,
    setMapSearch,
    genderFilter,
    setGenderFilter,
    getRoomGender,
    handleUpdateCapacity,
    handleToggleStatus,
    handleToggleIntake,
    handleToggleVisibility,
    handleToggleAccessibility,
    handleOpenManualBooking,
    handleOpenCloseRoomModal,
    handleEvictStudent,
    handleOpenEditUserModal,
    handleRequestReallocate,
    BedIcon,
    isSuperAdmin,
    liveHighlightedRoomIds = [],
    allUsers = [],
    specialties = [],
    courses = [],
}) {
    const [selectedFloor, setSelectedFloor] = useState("all");
    const [settingsRoomId, setSettingsRoomId] = useState(null);
    const [occupancyFilter, setOccupancyFilter] = useState("all");

    // Динамічний перелік поверхів для кнопок швидкого перемикання
    const availableFloors = useMemo(() => {
        const floorsSet = new Set();
        const targetBuildings = selectedBuildingFilter
            ? buildings.filter((b) => Number(b.id) === Number(selectedBuildingFilter))
            : buildings;
        targetBuildings.forEach((b) => {
            (b.rooms || []).forEach((r) => {
                if (r.floor !== undefined && r.floor !== null) {
                    floorsSet.add(Number(r.floor));
                }
            });
        });
        const list = Array.from(floorsSet).sort((a, b) => a - b);
        return list.length > 0 ? list : [1, 2, 3, 4, 5];
    }, [buildings, selectedBuildingFilter]);

    // Фільтри контингенту для інфографіки та підсвічування кімнат на шахматці
    const [academicCourseFilter, setAcademicCourseFilter] = useState("all");
    const [academicSpecialtyFilter, setAcademicSpecialtyFilter] = useState("all");
    const [isDemographicsOpen, setIsDemographicsOpen] = useState(true);

    const [addRoomModalOpen, setAddRoomModalOpen] = useState(false);
    const [roomModalData, setRoomModalData] = useState({ buildingId: null, buildingName: "", floor: 1, suggestedRoomNumber: "" });
    const [addFloorModalOpen, setAddFloorModalOpen] = useState(false);
    const [floorModalData, setFloorModalData] = useState({ buildingId: null, buildingName: "", suggestedFloor: 1 });
    const [addBuildingModalOpen, setAddBuildingModalOpen] = useState(false);

    const handleOpenAddRoom = (buildingId, floor, buildingName) => {
        const b = buildings.find((x) => Number(x.id) === Number(buildingId));
        const floorRooms = (b?.rooms || []).filter((r) => Number(r.floor) === Number(floor));
        let nextNum = Number(floor) * 100 + 1;
        if (floorRooms.length > 0) {
            const nums = floorRooms.map((r) => parseInt(r.room_number, 10)).filter((n) => !isNaN(n));
            if (nums.length > 0) {
                nextNum = Math.max(...nums) + 1;
            }
        }
        setRoomModalData({
            buildingId,
            buildingName: buildingName || b?.name || "",
            floor,
            suggestedRoomNumber: String(nextNum),
        });
        setAddRoomModalOpen(true);
    };

    const handleOpenAddFloor = (buildingId, buildingName) => {
        const b = buildings.find((x) => Number(x.id) === Number(buildingId));
        const floors = (b?.rooms || []).map((r) => Number(r.floor));
        const maxFloor = floors.length > 0 ? Math.max(...floors) : 0;
        setFloorModalData({
            buildingId,
            buildingName: buildingName || b?.name || "",
            suggestedFloor: maxFloor + 1,
        });
        setAddFloorModalOpen(true);
    };

    const handleDeleteRoom = (room) => {
        const hasApproved = (room.bookings || []).some(
            (b) => b.status === "approved" || (b.status === "pending" && b.new_room_id !== null)
        );
        if (hasApproved) {
            alert(`Неможливо видалити кімнату №${room.room_number}: у ній є активні мешканці або очікувані заявки на заселення.`);
            return;
        }
        if (confirm(`Ви дійсно бажаєте видалити кімнату №${room.room_number}? Дія незворотна.`)) {
            router.post(route("admin.rooms.destroy", room.id), {}, { preserveScroll: true });
        }
    };

    const handleDeleteFloor = (buildingId, floor, buildingName) => {
        const b = buildings.find((x) => Number(x.id) === Number(buildingId));
        const floorRooms = (b?.rooms || []).filter((r) => Number(r.floor) === Number(floor));
        const hasOccupants = floorRooms.some((r) =>
            (r.bookings || []).some((bk) => bk.status === "approved" || (bk.status === "pending" && bk.new_room_id !== null))
        );
        if (hasOccupants) {
            alert(`Неможливо видалити поверх ${floor}: у його кімнатах проживають студенти або є очікувані заявки.`);
            return;
        }
        if (confirm(`Ви дійсно бажаєте видалити поверх ${floor} та всі його кімнати (${floorRooms.length} кімн.) у корпусі "${buildingName}"? Дія незворотна.`)) {
            router.post(route("admin.floors.destroy"), { building_id: buildingId, floor: Number(floor) }, { preserveScroll: true });
        }
    };

    const handleDeleteBuilding = (building) => {
        const hasOccupants = (building.rooms || []).some((r) =>
            (r.bookings || []).some((bk) => bk.status === "approved" || (bk.status === "pending" && bk.new_room_id !== null))
        );
        if (hasOccupants) {
            alert(`Неможливо видалити корпус "${building.name}": у ньому проживають студенти або є очікувані заявки. Спочатку виселіть або розселіть їх.`);
            return;
        }
        if (confirm(`Ви дійсно бажаєте видалити корпус "${building.name}" та всі його кімнати? Дія незворотна!`)) {
            router.post(route("admin.buildings.destroy", building.id), {}, { preserveScroll: true });
        }
    };

    // Зведена статистика зайнятості для обраного корпусу або всіх корпусів
    const overviewStats = useMemo(() => {
        const targetBuildings = selectedBuildingFilter
            ? buildings.filter((b) => Number(b.id) === Number(selectedBuildingFilter))
            : buildings;

        let totalRooms = 0;
        let totalCapacity = 0;
        let totalOccupied = 0;
        let maleBeds = 0;
        let femaleBeds = 0;
        let emptyRoomBeds = 0;
        let repairRooms = 0;

        targetBuildings.forEach((b) => {
            (b.rooms || []).forEach((room) => {
                totalRooms += 1;
                const capacity = Number(room.max_capacity) || 0;
                const approvedBookings = (room.bookings || []).filter(
                    (bk) => bk.status === "approved" || (bk.status === "pending" && bk.new_room_id !== null)
                );
                const occupied = approvedBookings.length;
                const free = Math.max(0, capacity - occupied);

                totalCapacity += capacity;
                totalOccupied += occupied;

                if (room.status === "closed") {
                    repairRooms += 1;
                }

                const gender = getRoomGender ? getRoomGender(room) : { type: "empty" };
                if (gender.type === "male") {
                    maleBeds += free;
                } else if (gender.type === "female") {
                    femaleBeds += free;
                } else {
                    emptyRoomBeds += free;
                }
            });
        });

        const totalFree = Math.max(0, totalCapacity - totalOccupied);
        const percent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

        return {
            totalRooms,
            totalCapacity,
            totalOccupied,
            totalFree,
            maleBeds,
            femaleBeds,
            emptyRoomBeds,
            repairRooms,
            percent,
        };
    }, [buildings, selectedBuildingFilter, getRoomGender]);

    // Розрахунок загальної та динамічної інфографіки контингенту мешканців
    const { overallDemographics, activeDemographics } = useMemo(() => {
        const targetBuildings = selectedBuildingFilter
            ? buildings.filter((b) => Number(b.id) === Number(selectedBuildingFilter))
            : buildings;

        const allResidents = [];
        const overallSpecialtyCounts = {};
        const overallCourseCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        const overallCourseGenderCounts = {
            1: { male: 0, female: 0 },
            2: { male: 0, female: 0 },
            3: { male: 0, female: 0 },
            4: { male: 0, female: 0 },
            5: { male: 0, female: 0 },
            6: { male: 0, female: 0 },
        };
        let overallMale = 0;
        let overallFemale = 0;

        targetBuildings.forEach((b) => {
            (b.rooms || []).forEach((room) => {
                const approved = (room.bookings || []).filter(
                    (bk) => bk.status === "approved" || (bk.status === "pending" && bk.new_room_id !== null)
                );
                approved.forEach((bk) => {
                    const u = bk.user;
                    if (!u) return;

                    const c = Number(u.course);
                    const spec = String(u.specialty || "Не вказано").trim().toUpperCase();
                    const gender = u.gender === "female" ? "female" : "male";

                    allResidents.push({
                        user: u,
                        course: c,
                        specialty: spec,
                        gender,
                        roomId: room.id,
                        roomNumber: room.room_number,
                        floor: room.floor,
                        buildingId: b.id,
                    });

                    if (overallCourseCounts[c] !== undefined) {
                        overallCourseCounts[c] += 1;
                        if (gender === "female") overallCourseGenderCounts[c].female += 1;
                        else overallCourseGenderCounts[c].male += 1;
                    }

                    if (spec) {
                        overallSpecialtyCounts[spec] = (overallSpecialtyCounts[spec] || 0) + 1;
                    }

                    if (gender === "female") overallFemale += 1;
                    else overallMale += 1;
                });
            });
        });

        const overallTotal = allResidents.length;
        const overallMaxCourse = Math.max(...Object.values(overallCourseCounts), 1);

        // Динамічний зріз відповідно до активних фільтрів (спеціальність / курс)
        const isFiltered = academicSpecialtyFilter !== "all" || academicCourseFilter !== "all";

        const filteredResidents = allResidents.filter((r) => {
            const matchSpec = academicSpecialtyFilter === "all" || r.specialty === academicSpecialtyFilter;
            const matchCourse = academicCourseFilter === "all" || r.course === Number(academicCourseFilter);
            return matchSpec && matchCourse;
        });

        const activeCourseCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        const activeCourseGenderCounts = {
            1: { male: 0, female: 0 },
            2: { male: 0, female: 0 },
            3: { male: 0, female: 0 },
            4: { male: 0, female: 0 },
            5: { male: 0, female: 0 },
            6: { male: 0, female: 0 },
        };
        const activeSpecialtyCounts = {};
        let activeMale = 0;
        let activeFemale = 0;

        filteredResidents.forEach((r) => {
            if (activeCourseCounts[r.course] !== undefined) {
                activeCourseCounts[r.course] += 1;
                if (r.gender === "female") activeCourseGenderCounts[r.course].female += 1;
                else activeCourseGenderCounts[r.course].male += 1;
            }
            if (r.specialty) {
                activeSpecialtyCounts[r.specialty] = (activeSpecialtyCounts[r.specialty] || 0) + 1;
            }
            if (r.gender === "female") activeFemale += 1;
            else activeMale += 1;
        });

        const activeTotal = filteredResidents.length;
        const activeMaxCourse = Math.max(...Object.values(activeCourseCounts), 1);
        const activeRoomCount = new Set(filteredResidents.map((r) => r.roomId)).size;
        const percentOfTotal = overallTotal > 0 ? Math.round((activeTotal / overallTotal) * 100) : 0;
        const malePercent = activeTotal > 0 ? Math.round((activeMale / activeTotal) * 100) : 0;
        const femalePercent = activeTotal > 0 ? Math.round((activeFemale / activeTotal) * 100) : 0;

        return {
            overallDemographics: {
                totalResidents: overallTotal,
                courseCounts: overallCourseCounts,
                courseGenderCounts: overallCourseGenderCounts,
                specialtyCounts: overallSpecialtyCounts,
                maleResidents: overallMale,
                femaleResidents: overallFemale,
                maxCourseCount: overallMaxCourse,
            },
            activeDemographics: {
                isFiltered,
                totalResidents: activeTotal,
                percentOfTotal,
                courseCounts: activeCourseCounts,
                courseGenderCounts: activeCourseGenderCounts,
                specialtyCounts: activeSpecialtyCounts,
                maleResidents: activeMale,
                femaleResidents: activeFemale,
                malePercent,
                femalePercent,
                maxCourseCount: activeMaxCourse,
                activeRoomCount,
            },
        };
    }, [buildings, selectedBuildingFilter, academicSpecialtyFilter, academicCourseFilter]);

    const handleResetAcademicFilter = () => {
        setAcademicSpecialtyFilter("all");
        setAcademicCourseFilter("all");
    };

    const COURSE_CONFIG = [
        { num: 1, label: "1 курс", bg: "bg-sky-500", text: "text-sky-700 dark:text-sky-300", lightBg: "bg-sky-50 dark:bg-sky-950/40", border: "border-sky-300 dark:border-sky-700", ring: "ring-sky-500" },
        { num: 2, label: "2 курс", bg: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", lightBg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-300 dark:border-emerald-700", ring: "ring-emerald-500" },
        { num: 3, label: "3 курс", bg: "bg-indigo-500", text: "text-indigo-700 dark:text-indigo-300", lightBg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-300 dark:border-indigo-700", ring: "ring-indigo-500" },
        { num: 4, label: "4 курс", bg: "bg-amber-500", text: "text-amber-700 dark:text-amber-300", lightBg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-300 dark:border-amber-700", ring: "ring-amber-500" },
        { num: 5, label: "5 курс", bg: "bg-purple-500", text: "text-purple-700 dark:text-purple-300", lightBg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", ring: "ring-purple-500" },
        { num: 6, label: "6 курс", bg: "bg-rose-500", text: "text-rose-700 dark:text-rose-300", lightBg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-300 dark:border-rose-700", ring: "ring-rose-500" },
    ];

    const SPECIALTY_META = {
        'КН': { name: "Комп'ютерні науки", bg: "bg-indigo-50 dark:bg-indigo-950/60", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800/80", dot: "bg-indigo-500" },
        'ГРС': { name: "Готельно-ресторанна справа", bg: "bg-pink-50 dark:bg-pink-950/60", text: "text-pink-700 dark:text-pink-300", border: "border-pink-200 dark:border-pink-800/80", dot: "bg-pink-500" },
        'АГР': { name: "Агрономія", bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800/80", dot: "bg-emerald-500" },
        'МЕН': { name: "Менеджмент", bg: "bg-purple-50 dark:bg-purple-950/60", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800/80", dot: "bg-purple-500" },
        'ПВ': { name: "Право", bg: "bg-blue-50 dark:bg-blue-950/60", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800/80", dot: "bg-blue-500" },
        'ФІН': { name: "Фінанси та банківська справа", bg: "bg-teal-50 dark:bg-teal-950/60", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800/80", dot: "bg-teal-500" },
        'АІ': { name: "Агроінженерія", bg: "bg-amber-50 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800/80", dot: "bg-amber-500" },
        'ЕТ': { name: "Електроенергетика та електромеханіка", bg: "bg-cyan-50 dark:bg-cyan-950/60", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800/80", dot: "bg-cyan-500" },
        'ВМ': { name: "Ветеринарна медицина", bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800/80", dot: "bg-rose-500" },
        'ТВППЖ': { name: "Технологія тваринництва", bg: "bg-lime-50 dark:bg-lime-950/60", text: "text-lime-700 dark:text-lime-300", border: "border-lime-200 dark:border-lime-800/80", dot: "bg-lime-500" },
    };

    const matchesAcademicFilter = (room) => {
        if (academicCourseFilter === "all" && academicSpecialtyFilter === "all") return true;

        const approved = (room.bookings || []).filter(
            (bk) => bk.status === "approved" || (bk.status === "pending" && bk.new_room_id !== null)
        );

        return approved.some((bk) => {
            const u = bk.user;
            if (!u) return false;
            const matchCourse = academicCourseFilter === "all" || Number(u.course) === Number(academicCourseFilter);
            const matchSpec = academicSpecialtyFilter === "all" || String(u.specialty || "").trim().toUpperCase() === String(academicSpecialtyFilter).trim().toUpperCase();
            return matchCourse && matchSpec;
        });
    };

    // Клік за межами налаштувань закриває попап
    useEffect(() => {
        const handleGlobalClick = () => {
            if (settingsRoomId !== null) {
                setSettingsRoomId(null);
            }
        };

        window.addEventListener("click", handleGlobalClick);
        return () => window.removeEventListener("click", handleGlobalClick);
    }, [settingsRoomId]);

    return (
        <div className="space-y-6">
            {/* Комплексний Стан житлового фонду та Детальна інфографіка контингенту */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700/80 rounded-2xl shadow-xs p-4 sm:p-5 space-y-5">
                {/* 1. Верхній рядок: Назва корпусу + Заповненість + Кнопка згортання інфографіки */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-gray-700/70">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                                Стан житлового фонду та контингенту
                            </h4>
                            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-700/70 px-2 py-0.5 rounded-md">
                                {selectedBuildingFilter
                                    ? buildings.find((b) => Number(b.id) === Number(selectedBuildingFilter))?.name || "Обраний корпус"
                                    : (isSuperAdmin && buildings.length > 1 ? "Усі корпуси" : (buildings[0]?.name || "Корпус"))}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Заповненість:</span>
                            <span className="text-sm font-black text-gray-900 dark:text-white">{overviewStats.percent}%</span>
                            <div className="w-24 bg-slate-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                        overviewStats.percent >= 90
                                            ? "bg-rose-500"
                                            : overviewStats.percent >= 70
                                            ? "bg-amber-500"
                                            : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${Math.min(overviewStats.percent, 100)}%` }}
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsDemographicsOpen(!isDemographicsOpen)}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                        >
                            <span>{isDemographicsOpen ? "Згорнути інфографіку" : "Інфографіка контингенту"}</span>
                            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isDemographicsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 2. Шість карток житлового фонду (Місткість та вільні ліжка) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-100 dark:border-gray-700">
                        <span className="text-[11px] text-gray-400 block mb-0.5">Всього місць</span>
                        <span className="text-base font-black text-gray-900 dark:text-white">
                            {overviewStats.totalCapacity}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">у {overviewStats.totalRooms} кімнатах</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-100 dark:border-gray-700">
                        <span className="text-[11px] text-gray-400 block mb-0.5">Заселено</span>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                {overviewStats.totalOccupied}
                            </span>
                            {activeDemographics.isFiltered && (
                                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded">
                                    {academicSpecialtyFilter !== "all" ? academicSpecialtyFilter : ""}{academicSpecialtyFilter !== "all" && academicCourseFilter !== "all" ? " • " : ""}{academicCourseFilter !== "all" ? `${academicCourseFilter}к.` : ""}: {activeDemographics.totalResidents}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                            {activeDemographics.isFiltered
                                ? `у ${activeDemographics.activeRoomCount} кімн.`
                                : `${overviewStats.percent}% фонду`}
                        </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40">
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block mb-0.5 font-semibold">Вільних місць</span>
                        <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                            {overviewStats.totalFree}
                        </span>
                        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 block mt-0.5">доступно для заселення</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800/40">
                        <span className="text-[11px] text-sky-700 dark:text-sky-300 block mb-0.5 font-semibold">Вільні для хлопців</span>
                        <span className="text-base font-black text-sky-700 dark:text-sky-300">
                            {overviewStats.maleBeds}
                        </span>
                        <span className="text-[10px] text-sky-600/70 dark:text-sky-400/70 block mt-0.5">у чоловічих кімнатах</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/40">
                        <span className="text-[11px] text-rose-700 dark:text-rose-300 block mb-0.5 font-semibold">Вільні для дівчат</span>
                        <span className="text-base font-black text-rose-700 dark:text-rose-300">
                            {overviewStats.femaleBeds}
                        </span>
                        <span className="text-[10px] text-rose-600/70 dark:text-rose-400/70 block mt-0.5">у жіночих кімнатах</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-100 dark:border-gray-700">
                        <span className="text-[11px] text-gray-400 block mb-0.5">Ремонт / Вільні кімн.</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-black text-gray-800 dark:text-gray-200">{overviewStats.emptyRoomBeds}</span>
                            <span className="text-[10px] text-gray-400">вільних</span>
                        </div>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{overviewStats.repairRooms} кімн. на ремонті</span>
                    </div>
                </div>

                {/* 3. Детальна Інфографіка та Інтерактивний Графік контингенту */}
                {isDemographicsOpen && (
                    <div className="pt-4 border-t border-slate-100 dark:border-gray-700/80 space-y-4 animate-in fade-in duration-200">
                        
                        {/* Верхній рядок інфографіки: Заголовок + Активний фільтр мапи (фіксована висота, без підстрибування) */}
                        <div className="min-h-[42px] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-gray-700/70">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-gray-100 flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Графік та аналітика контингенту
                                </span>
                                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                                    {activeDemographics.isFiltered
                                        ? `${activeDemographics.totalResidents} з ${overallDemographics.totalResidents} студентів (${activeDemographics.percentOfTotal}%)`
                                        : `${overallDemographics.totalResidents} студентів`}
                                </span>
                                {activeDemographics.isFiltered && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-2xs">
                                        <span>Обрано:</span>
                                        {academicSpecialtyFilter !== "all" && <span>{academicSpecialtyFilter}</span>}
                                        {academicCourseFilter !== "all" && <span>{academicSpecialtyFilter !== "all" ? " • " : ""}{academicCourseFilter} курс</span>}
                                    </span>
                                )}
                            </div>

                            {/* Блок дій та скидання фільтру зі стабільною висотою (h-7) */}
                            <div className="flex items-center gap-2 self-start sm:self-auto h-7 shrink-0">
                                {activeDemographics.isFiltered ? (
                                    <button
                                        type="button"
                                        onClick={handleResetAcademicFilter}
                                        className="h-7 inline-flex items-center gap-1 px-2.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors duration-150 cursor-pointer shadow-2xs"
                                    >
                                        ✕ Скинути фільтр
                                    </button>
                                ) : (
                                    <span className="text-[11px] font-semibold text-slate-400 dark:text-gray-500 hidden sm:inline-block">
                                        Всі мешканці корпусу
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ОСНОВНА СІТКА ГРАФІКІВ: 12 колонок */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            
                            {/* ЛІВА ЧАСТИНА (7 колонок): Стовпчиковий графік розподілу за курсами з гендерним зрізом */}
                            <div className="lg:col-span-7 bg-slate-50/90 dark:bg-gray-900/60 rounded-2xl border border-slate-200/80 dark:border-gray-700/80 p-4 flex flex-col justify-between gap-3 shadow-2xs">
                                
                                {/* Шапка графіка: заголовок + легенда статі */}
                                <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-200/70 dark:border-gray-700/60">
                                    <div className="space-y-0.5">
                                        <h5 className="text-xs font-black text-slate-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Розподіл за курсами (1–6)</span>
                                        </h5>
                                        <p className="text-[11px] text-slate-400">
                                            {academicSpecialtyFilter !== "all"
                                                ? `Для спеціальності ${academicSpecialtyFilter} (${activeDemographics.totalResidents} студ.) • Клікніть для вибору курсу`
                                                : "Клікніть по стовпчику для фільтрації на шахматці"}
                                        </p>
                                    </div>

                                    {/* Легенда статі */}
                                    <div className="flex items-center gap-3 text-[11px] font-bold">
                                        <span className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-sky-600 to-sky-400" />
                                            Хлопці
                                        </span>
                                        <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-rose-600 to-rose-400" />
                                            Дівчата
                                        </span>
                                    </div>
                                </div>

                                {/* САМ ВІЗУАЛЬНИЙ СТОВПЧИКОВИЙ ГРАФІК */}
                                <div className="relative pt-6 pb-1">
                                    {/* Горизонтальні сіткові лінії */}
                                    <div className="absolute inset-x-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none opacity-30 dark:opacity-20">
                                        <div className="border-b border-dashed border-slate-400 dark:border-gray-500 w-full" />
                                        <div className="border-b border-dashed border-slate-400 dark:border-gray-500 w-full" />
                                        <div className="border-b border-dashed border-slate-400 dark:border-gray-500 w-full" />
                                    </div>

                                    {/* 6 стовпчиків курсів */}
                                    <div className="grid grid-cols-6 gap-2 sm:gap-3 items-end h-44 relative z-10">
                                        {COURSE_CONFIG.map((c) => {
                                            const count = activeDemographics.courseCounts[c.num] || 0;
                                            const genderData = activeDemographics.courseGenderCounts[c.num] || { male: 0, female: 0 };
                                            const pct = activeDemographics.totalResidents > 0 ? Math.round((count / activeDemographics.totalResidents) * 100) : 0;
                                            const heightPct = count > 0 ? Math.max(Math.round((count / activeDemographics.maxCourseCount) * 100), 16) : 4;
                                            const isSelected = academicCourseFilter === String(c.num);

                                            const malePct = count > 0 ? (genderData.male / count) * 100 : 0;
                                            const femalePct = count > 0 ? (genderData.female / count) * 100 : 0;

                                            return (
                                                <div
                                                    key={c.num}
                                                    className="flex flex-col items-center h-full justify-end group cursor-pointer"
                                                    onClick={() => setAcademicCourseFilter(isSelected ? "all" : String(c.num))}
                                                    title={`${c.label}: ${count} студ. (${pct}%) — Хлопців: ${genderData.male}, Дівчат: ${genderData.female}`}
                                                >
                                                    {/* Підпис зверху стовпчика: кількість та % */}
                                                    <div className="mb-1.5 text-center transition-colors duration-150">
                                                        <div className={`text-xs font-black ${isSelected ? "text-indigo-600 dark:text-indigo-400" : count > 0 ? "text-slate-800 dark:text-gray-100" : "text-slate-300 dark:text-gray-600"}`}>
                                                            {count}
                                                        </div>
                                                        {count > 0 && (
                                                            <div className="text-[9px] font-bold text-slate-400 dark:text-gray-400 leading-tight">
                                                                {pct}%
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Тіло стовпчика */}
                                                    <div className="w-full flex items-end justify-center h-28">
                                                        <div
                                                            style={{ height: `${heightPct}%` }}
                                                            className={`w-full max-w-[42px] rounded-t-xl overflow-hidden transition-[height] duration-300 flex flex-col justify-end shadow-xs ${
                                                                isSelected
                                                                    ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900 shadow-md shadow-indigo-500/25"
                                                                    : "group-hover:brightness-110"
                                                            } ${count === 0 ? "bg-slate-200/60 dark:bg-gray-800" : ""}`}
                                                        >
                                                            {count > 0 && (
                                                                <>
                                                                    {/* Жіноча частина стовпчика (верхня) */}
                                                                    {genderData.female > 0 && (
                                                                        <div
                                                                            style={{ height: `${femalePct}%` }}
                                                                            className="w-full bg-gradient-to-t from-rose-500 to-rose-400 flex items-center justify-center text-[9px] font-black text-white/90 transition-all"
                                                                        >
                                                                            {genderData.female > 1 && <span className="opacity-90">{genderData.female}</span>}
                                                                        </div>
                                                                    )}
                                                                    {/* Чоловіча частина стовпчика (нижня) */}
                                                                    {genderData.male > 0 && (
                                                                        <div
                                                                            style={{ height: `${malePct}%` }}
                                                                            className="w-full bg-gradient-to-t from-sky-600 to-sky-400 flex items-center justify-center text-[9px] font-black text-white/90 transition-all"
                                                                        >
                                                                            {genderData.male > 1 && <span className="opacity-90">{genderData.male}</span>}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Назва курсу знизу (кнопка) */}
                                                    <div className="mt-2 text-center w-full">
                                                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black transition-all duration-150 ${
                                                            isSelected
                                                                ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/30"
                                                                : count > 0
                                                                ? `${c.lightBg} ${c.text} border ${c.border} group-hover:brightness-95`
                                                                : "text-slate-400 dark:text-gray-600 bg-slate-100 dark:bg-gray-800"
                                                        }`}>
                                                            {c.num} к.
                                                        </span>
                                                        <div className="text-[9px] font-bold text-slate-400 dark:text-gray-500 mt-0.5 whitespace-nowrap">
                                                            {count > 0 ? `${genderData.male}ч / ${genderData.female}ж` : "—"}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* ПРАВА ЧАСТИНА (5 колонок): Гендерний баланс та Єдина інтерактивна картка спеціальностей */}
                            <div className="lg:col-span-5 flex flex-col justify-between gap-3 bg-slate-50/90 dark:bg-gray-900/60 rounded-2xl border border-slate-200/80 dark:border-gray-700/80 p-4 shadow-2xs">
                                
                                {/* 1. Блок гендерного балансу */}
                                <div className="space-y-2 pb-3 border-b border-slate-200/70 dark:border-gray-700/60">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-extrabold uppercase tracking-wider text-slate-800 dark:text-gray-100 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                            Гендерний баланс {academicSpecialtyFilter !== "all" ? `(${academicSpecialtyFilter})` : "корпусу"}
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-400">
                                            {activeDemographics.totalResidents} мешканців
                                        </span>
                                    </div>

                                    {/* Смуга пропорції хлопці/дівчата */}
                                    <div className="h-3 rounded-full overflow-hidden flex bg-slate-200 dark:bg-gray-700 p-0.5 gap-0.5">
                                        <div
                                            style={{ width: `${activeDemographics.totalResidents > 0 ? (activeDemographics.maleResidents / activeDemographics.totalResidents) * 100 : 50}%` }}
                                            className="bg-gradient-to-r from-sky-500 to-sky-400 h-full rounded-full transition-all duration-300"
                                        />
                                        <div
                                            style={{ width: `${activeDemographics.totalResidents > 0 ? (activeDemographics.femaleResidents / activeDemographics.totalResidents) * 100 : 50}%` }}
                                            className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full transition-all duration-300"
                                        />
                                    </div>

                                    {/* Числові показники статі */}
                                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                                        <div className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700 flex items-center justify-between shadow-2xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-sky-500" />
                                                <span className="text-[11px] font-bold text-slate-600 dark:text-gray-300">Хлопці:</span>
                                            </div>
                                            <span className="text-xs font-black text-sky-600 dark:text-sky-400">
                                                {activeDemographics.maleResidents} <span className="text-[10px] text-slate-400 font-normal">({activeDemographics.malePercent}%)</span>
                                            </span>
                                        </div>

                                        <div className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700 flex items-center justify-between shadow-2xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                <span className="text-[11px] font-bold text-slate-600 dark:text-gray-300">Дівчата:</span>
                                            </div>
                                            <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                                                {activeDemographics.femaleResidents} <span className="text-[10px] text-slate-400 font-normal">({activeDemographics.femalePercent}%)</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Єдина інтерактивна картка спеціальностей контингенту */}
                                <div className="space-y-2 flex-1 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold uppercase tracking-wider text-slate-800 dark:text-gray-100 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                Спеціальності контингенту
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 bg-slate-200/70 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">
                                                {Object.keys(overallDemographics.specialtyCounts).length}
                                            </span>
                                        </div>
                                        {academicSpecialtyFilter !== "all" ? (
                                            <button
                                                type="button"
                                                onClick={() => setAcademicSpecialtyFilter("all")}
                                                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                            >
                                                ✕ Скинути вибір
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-slate-400">
                                                Клік для фільтру на мапі
                                            </span>
                                        )}
                                    </div>

                                    {/* Повний інтерактивний список усіх спеціальностей (з повною назвою та прогресом) */}
                                    <div className="space-y-1.5 max-h-[185px] overflow-y-auto pr-1 no-scrollbar">
                                        {Object.entries(overallDemographics.specialtyCounts)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([spec, count]) => {
                                                const isSelected = academicSpecialtyFilter === spec;
                                                const specPct = overallDemographics.totalResidents > 0 ? Math.round((count / overallDemographics.totalResidents) * 100) : 0;
                                                const meta = SPECIALTY_META[spec] || { name: spec, dot: "bg-indigo-500" };

                                                return (
                                                    <button
                                                        key={spec}
                                                        type="button"
                                                        onClick={() => setAcademicSpecialtyFilter(isSelected ? "all" : spec)}
                                                        className={`w-full text-left p-2 rounded-xl border transition-all duration-150 flex flex-col gap-1.5 cursor-pointer ${
                                                            isSelected
                                                                ? "bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xs"
                                                                : "bg-white dark:bg-gray-800 border-slate-200/80 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-gray-700/60 shadow-2xs"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2 text-xs">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot || "bg-indigo-500"}`} />
                                                                <span className="font-extrabold text-slate-800 dark:text-gray-100 shrink-0">
                                                                    {spec}
                                                                </span>
                                                                <span className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-[200px]" title={meta.name}>
                                                                    • {meta.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <span className={`font-black text-xs ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-800 dark:text-gray-100"}`}>
                                                                    {count} студ.
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-medium">
                                                                    ({specPct}%)
                                                                </span>
                                                                {isSelected && (
                                                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-600 text-white shadow-2xs">
                                                                        Обрано
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Прогрес-бар частки спеціальності */}
                                                        <div className="w-full bg-slate-100 dark:bg-gray-700/80 h-1.5 rounded-full overflow-hidden">
                                                            <div
                                                                style={{ width: `${specPct}%` }}
                                                                className={`h-full rounded-full transition-all duration-300 ${
                                                                    isSelected
                                                                        ? "bg-indigo-600"
                                                                        : "bg-gradient-to-r from-indigo-500 to-emerald-500"
                                                                }`}
                                                            />
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Пошук та фільтри для мапи */}
            <div className="bg-white dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700/80 rounded-2xl shadow-xs p-4 sm:p-5 space-y-3.5">
                {/* Верхній рядок: Заголовок, Корпуси та кнопка додавання */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-gray-700/60">
                    <div>
                        <h3 className="font-extrabold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                            Карта корпусів МНАУ
                        </h3>
                        <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                            Інтерактивна схема кімнат, поверхів та розселення
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Фільтр корпусів / Фіксований корпус для коменданта */}
                        {isSuperAdmin && buildings.length > 1 ? (
                            <div className="relative min-w-[170px]">
                                <select
                                    value={selectedBuildingFilter}
                                    onChange={(e) =>
                                        setSelectedBuildingFilter(e.target.value)
                                    }
                                    className="w-full appearance-none text-xs font-bold rounded-xl border border-slate-200 dark:border-gray-600 pl-8 pr-8 py-2 bg-slate-50/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/80 focus:border-emerald-500 transition-all cursor-pointer shadow-2xs"
                                >
                                    <option value="">Усі корпуси</option>
                                    {buildings.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                    <svg className="w-3.5 h-3.5 text-slate-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs font-bold text-gray-700 dark:text-gray-200 px-3 py-2 bg-slate-100 dark:bg-gray-700/80 rounded-xl border border-slate-200 dark:border-gray-600 flex items-center gap-2 shrink-0 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>{buildings[0]?.name || "Мій корпус"}</span>
                            </div>
                        )}

                        {/* Кнопка створення корпусу (тільки SuperAdmin) */}
                        {isSuperAdmin && (
                            <button
                                type="button"
                                onClick={() => setAddBuildingModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs shrink-0"
                                title="Додати новий корпус"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Додати корпус</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Нижній рядок: Пошук, Фільтр статі, Окремий фільтр зайнятості/вільних місць, Вибір поверху */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 flex-wrap">
                        {/* 1. Пошук з іконкою та кнопкою очищення */}
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Пошук жильця або кімнати..."
                                value={mapSearch}
                                onChange={(e) => setMapSearch(e.target.value)}
                                className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50/70 dark:bg-gray-700/70 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/80 focus:border-emerald-500 transition-all font-medium shadow-2xs"
                            />
                            {mapSearch && (
                                <button
                                    type="button"
                                    onClick={() => setMapSearch("")}
                                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    title="Очистити пошук"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* 2. Фільтр статі кімнат (виключно за статтю) */}
                        <div className="relative min-w-[145px]">
                            <select
                                value={genderFilter}
                                onChange={(e) => setGenderFilter(e.target.value)}
                                className={`w-full appearance-none text-xs font-bold rounded-xl border pl-8 pr-8 py-2 transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/80 ${
                                    genderFilter
                                        ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200"
                                        : "border-slate-200 dark:border-gray-600 bg-slate-50/70 dark:bg-gray-700/70 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
                                }`}
                            >
                                <option value="">Всі статі</option>
                                <option value="male">Чоловічі кімнати</option>
                                <option value="female">Жіночі кімнати</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* 3. Окремий фільтр зайнятості та вільних ліжок (NEW!) */}
                        <div className="relative min-w-[185px]">
                            <select
                                value={occupancyFilter}
                                onChange={(e) => setOccupancyFilter(e.target.value)}
                                className={`w-full appearance-none text-xs font-bold rounded-xl border pl-8 pr-8 py-2 transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/80 ${
                                    occupancyFilter !== "all"
                                        ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/30"
                                        : "border-slate-200 dark:border-gray-600 bg-slate-50/70 dark:bg-gray-700/70 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
                                }`}
                            >
                                <option value="all">Усі кімнати (зайнятість)</option>
                                <option value="has_beds">Є вільні ліжка (койки)</option>
                                <option value="empty_rooms">Повністю вільні кімнати</option>
                                <option value="full">Повністю заселені (100%)</option>
                                <option value="repair">На ремонті</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 11.5c1.4 0 2.5-1.1 2.5-2.5S8.4 6.5 7 6.5 4.5 7.6 4.5 9s1.1 2.5 2.5 2.5zm12-5h-8v7H4V5H2v15h2v-3h16v3h2v-9c0-2.2-1.8-4-4-4z" />
                                </svg>
                            </div>
                            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Кнопка швидкого скидання фільтрів якщо щось активно */}
                        {(mapSearch || genderFilter || occupancyFilter !== "all" || selectedFloor !== "all") && (
                            <button
                                type="button"
                                onClick={() => {
                                    setMapSearch("");
                                    setGenderFilter("");
                                    setOccupancyFilter("all");
                                    setSelectedFloor("all");
                                }}
                                title="Скинути активні фільтри"
                                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors shrink-0 shadow-2xs"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Скинути</span>
                            </button>
                        )}
                    </div>

                    {/* 4. Швидкий вибір поверху (динамічний перелік поверхів) */}
                    <div className="flex items-center bg-slate-100 dark:bg-gray-700/60 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar border border-slate-200/60 dark:border-gray-600/60 shrink-0">
                        <button
                            type="button"
                            onClick={() => setSelectedFloor("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 shrink-0 ${
                                selectedFloor === "all"
                                    ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                                    : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            Усі поверхи
                        </button>
                        {availableFloors.map((fl) => (
                            <button
                                key={fl}
                                type="button"
                                onClick={() => setSelectedFloor(String(fl))}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 shrink-0 ${
                                    selectedFloor === String(fl)
                                        ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                                        : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                            >
                                {fl} пов.
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Відображення корпусів */}
            {buildings
                .filter(
                    (b) =>
                        !selectedBuildingFilter ||
                        b.id === Number(selectedBuildingFilter),
                )
                .map((building) => {
                    const floorsMap = {};
                    building.rooms?.forEach((room) => {
                        floorsMap[room.floor] = floorsMap[room.floor] || [];
                        floorsMap[room.floor].push(room);
                    });

                    Object.keys(floorsMap).forEach((fl) => {
                        floorsMap[fl].sort((a, b) =>
                            a.room_number.localeCompare(
                                b.room_number,
                                undefined,
                                { numeric: true },
                            ),
                        );
                    });

                    const floorsList = Object.keys(floorsMap)
                        .sort((a, b) => Number(a) - Number(b))
                        .filter(
                            (fl) =>
                                selectedFloor === "all" ||
                                String(fl) === selectedFloor,
                        );

                    return (
                        <div
                            key={building.id}
                            className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 space-y-6"
                        >
                            <div className="border-b border-slate-100/80 dark:border-gray-700 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                            Корпус
                                        </span>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-md">
                                            {building.name}
                                        </h4>
                                    </div>
                                    {isSuperAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteBuilding(building)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-1"
                                            title="Видалити цей корпус"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-gray-400 bg-slate-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium shadow-3xs">
                                        Всього кімнат: {building.rooms?.length || 0}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenAddFloor(building.id, building.name)}
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-xs"
                                        title="Додати поверх у цей корпус"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span>Додати поверх</span>
                                    </button>
                                </div>
                            </div>

                            {building.rooms?.length === 0 ? (
                                <p className="text-xs text-gray-400 py-2">
                                    У цьому корпусі ще немає кімнат.
                                </p>
                            ) : (
                                <div className="space-y-8">
                                    {floorsList.map((floor) => {
                                        const floorRooms = floorsMap[
                                            floor
                                        ].filter((room) => {
                                            if (!matchesAcademicFilter(room)) {
                                                return false;
                                            }
                                            const approvedBookings =
                                                room.bookings?.filter(
                                                    (b) =>
                                                        b.status ===
                                                            "approved" ||
                                                        (b.status ===
                                                            "pending" &&
                                                            b.new_room_id !==
                                                                null),
                                                ) || [];

                                            // Пошук за номером кімнати або жильцем
                                            const matchesSearch =
                                                !mapSearch ||
                                                room.room_number
                                                    .toLowerCase()
                                                    .includes(
                                                        mapSearch.toLowerCase(),
                                                    ) ||
                                                approvedBookings.some(
                                                    (b) =>
                                                        b.user?.name
                                                            ?.toLowerCase()
                                                            .includes(
                                                                mapSearch.toLowerCase(),
                                                            ) ||
                                                        b.user?.email
                                                            ?.toLowerCase()
                                                            .includes(
                                                                mapSearch.toLowerCase(),
                                                            ),
                                                );
                                            if (!matchesSearch) return false;

                                            // Фільтр статі
                                            if (genderFilter) {
                                                const rg = getRoomGender(room);
                                                if (rg.type !== genderFilter) {
                                                    return false;
                                                }
                                            }

                                            // Окремий фільтр зайнятості та вільних ліжок
                                            if (occupancyFilter && occupancyFilter !== "all") {
                                                const capacity = room.capacity || 0;
                                                const occupiedCount = approvedBookings.length;
                                                const freeBeds = Math.max(0, capacity - occupiedCount);
                                                const isRepair = room.status === "closed";

                                                if (occupancyFilter === "has_beds") {
                                                    // Кімнати де є вільні ліжка (койки для заселення), не на ремонті
                                                    if (isRepair || freeBeds <= 0) return false;
                                                } else if (occupancyFilter === "empty_rooms") {
                                                    // Повністю порожні кімнати (0 жильців), не на ремонті
                                                    if (isRepair || occupiedCount > 0) return false;
                                                } else if (occupancyFilter === "full") {
                                                    // Повністю зайняті кімнати (100%), не на ремонті
                                                    if (isRepair || freeBeds > 0) return false;
                                                } else if (occupancyFilter === "repair") {
                                                    // Кімнати на ремонті
                                                    if (!isRepair) return false;
                                                }
                                            }

                                            return true;
                                        });

                                        if (floorRooms.length === 0)
                                            return null;

                                        return (
                                            <div
                                                key={floor}
                                                className="space-y-3"
                                            >
                                                <div className="flex items-center justify-between pb-1">
                                                    <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
                                                        Поверх {floor}
                                                        <span className="text-[11px] font-medium text-gray-400">
                                                            ({floorRooms.length} кімн.)
                                                        </span>
                                                    </h5>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenAddRoom(building.id, floor, building.name)}
                                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-xs"
                                                            title="Додати кімнату на цей поверх"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                            </svg>
                                                            <span>Додати кімнату</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteFloor(building.id, floor, building.name)}
                                                            className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                                            title="Видалити поверх"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                    {floorRooms.map((room) => {
                                                            const approvedBookings =
                                                                room.bookings?.filter(
                                                                    (b) =>
                                                                        b.status ===
                                                                            "approved" ||
                                                                        (b.status ===
                                                                            "pending" &&
                                                                            b.new_room_id !==
                                                                                null),
                                                                ) || [];
                                                            const isFull =
                                                                approvedBookings.length >=
                                                                room.max_capacity;
                                                            const occupiedCount =
                                                                approvedBookings.length;
                                                            const capacityPercent =
                                                                Math.min(
                                                                    Math.round(
                                                                        (occupiedCount /
                                                                            room.max_capacity) *
                                                                            100,
                                                                    ),
                                                                    100,
                                                                );
                                                            const isSettingsOpen =
                                                                settingsRoomId ===
                                                                room.id;

                                                            // Візуальні стани без бесячих анімацій руху
                                                            const isRepair =
                                                                room.status ===
                                                                "closed";
                                                            const isIntakeClosed =
                                                                Boolean(
                                                                    room.intake_closed,
                                                                );
                                                            const isHidden =
                                                                Boolean(
                                                                    room.hide_from_frontend,
                                                                );
                                                            const isBothClosedAndHidden =
                                                                isIntakeClosed &&
                                                                isHidden;
                                                            const isOnlyIntakeClosed =
                                                                isIntakeClosed &&
                                                                !isHidden;
                                                            const isOnlyHidden =
                                                                !isIntakeClosed &&
                                                                isHidden;

                                                            let cardBgStyle =
                                                                "bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover:border-emerald-500 transition-colors duration-200";
                                                            if (isRepair) {
                                                                cardBgStyle =
                                                                    "bg-white dark:bg-gray-800 bg-[repeating-linear-gradient(45deg,rgba(239,68,68,0.06),rgba(239,68,68,0.06)_10px,transparent_10px,transparent_20px)] border-2 border-red-400 dark:border-red-800";
                                                            } else if (
                                                                isBothClosedAndHidden
                                                            ) {
                                                                cardBgStyle =
                                                                    "bg-white dark:bg-gray-800 border-2 border-purple-400 dark:border-purple-600 bg-gradient-to-br from-amber-50/30 via-purple-50/20 to-indigo-50/30 dark:from-amber-950/20 dark:via-purple-950/20 dark:to-indigo-950/20 hover:border-purple-500 transition-colors duration-200";
                                                            } else if (
                                                                isOnlyIntakeClosed
                                                            ) {
                                                                cardBgStyle =
                                                                    "bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-500 transition-colors duration-200";
                                                            } else if (
                                                                isOnlyHidden
                                                            ) {
                                                                cardBgStyle =
                                                                    "bg-white dark:bg-gray-800 border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/20 dark:bg-purple-950/10 hover:border-purple-500 transition-colors duration-200";
                                                            } else if (isFull) {
                                                                cardBgStyle =
                                                                    "bg-white dark:bg-gray-800 bg-red-50/20 dark:bg-red-950/10 border border-red-200 dark:border-red-800 hover:border-red-400 transition-colors duration-200";
                                                            }

                                                            const isHighlighted = liveHighlightedRoomIds.includes(Number(room.id));
                                                            const isAcademicFiltered = (academicCourseFilter !== "all" || academicSpecialtyFilter !== "all") && matchesAcademicFilter(room);

                                                            return (
                                                                <div
                                                                    key={
                                                                        room.id
                                                                    }
                                                                    className={`p-4 rounded-2xl flex flex-col justify-between min-h-[190px] relative bg-white dark:bg-gray-800 shadow-sm ${cardBgStyle} ${
                                                                        isSettingsOpen
                                                                            ? "z-30"
                                                                            : "z-0"
                                                                    } ${
                                                                        isHighlighted
                                                                            ? "ring-4 ring-emerald-400 dark:ring-emerald-500 scale-[1.02] shadow-lg shadow-emerald-500/25 transition-all duration-300 animate-pulse"
                                                                            : isAcademicFiltered
                                                                            ? "ring-2 ring-indigo-500/80 shadow-md shadow-indigo-500/10"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    {/* Бейджик оновлення в реальному часі */}
                                                                    {isHighlighted && (
                                                                        <span className="absolute -top-2.5 -left-2 bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md border border-white z-20 animate-bounce flex items-center gap-1">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                                                            Оновлено live
                                                                        </span>
                                                                    )}
                                                                    <div>
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <div>
                                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                                    <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">
                                                                                        Кімната №{room.room_number}
                                                                                    </span>
                                                                                    {Boolean(room.is_accessible) && (
                                                                                        <span
                                                                                            className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80"
                                                                                            title="Кімната для осіб з інвалідністю / обмеженими можливостями (інклюзивна)"
                                                                                        >
                                                                                            Інклюзивна
                                                                                        </span>
                                                                                    )}
                                                                                    {isAcademicFiltered && (
                                                                                        <span
                                                                                            className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 shadow-2xs"
                                                                                            title="Кімната відповідає обраному фільтру контингенту"
                                                                                        >
                                                                                            {academicSpecialtyFilter !== "all" ? academicSpecialtyFilter : ""}{academicSpecialtyFilter !== "all" && academicCourseFilter !== "all" ? " • " : ""}{academicCourseFilter !== "all" ? `${academicCourseFilter}к.` : ""}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <span className="text-[11px] text-gray-400 block font-medium">
                                                                                    Поверх {room.floor}
                                                                                </span>

                                                                                {/* Причина ремонту */}
                                                                                {isRepair &&
                                                                                    room.closure_reason && (
                                                                                        <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-1 mt-1">
                                                                                            <svg className="w-3 h-3 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                                                            </svg>
                                                                                            <span className="truncate max-w-[150px]">
                                                                                                {
                                                                                                    room.closure_reason
                                                                                                }
                                                                                            </span>
                                                                                        </p>
                                                                                    )}

                                                                                {/* Бейджики станів */}
                                                                                {(isRepair ||
                                                                                    isIntakeClosed ||
                                                                                    isHidden) && (
                                                                                    <div className="flex items-center gap-1 flex-wrap mt-1">
                                                                                        {isRepair && (
                                                                                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-600 text-white">
                                                                                                На ремонті
                                                                                            </span>
                                                                                        )}
                                                                                        {!isRepair &&
                                                                                            isBothClosedAndHidden && (
                                                                                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 text-white">
                                                                                                    Прихована та закрита
                                                                                                </span>
                                                                                            )}
                                                                                        {!isRepair &&
                                                                                            isOnlyIntakeClosed && (
                                                                                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200">
                                                                                                    Набір закритий
                                                                                                </span>
                                                                                            )}
                                                                                        {!isRepair &&
                                                                                            isOnlyHidden && (
                                                                                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200">
                                                                                                    Прихована
                                                                                                </span>
                                                                                            )}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Кнопка шестерні для налаштувань кімнати */}
                                                                            <div className="relative">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(
                                                                                        e,
                                                                                    ) => {
                                                                                        e.stopPropagation();
                                                                                        setSettingsRoomId(
                                                                                            isSettingsOpen
                                                                                                ? null
                                                                                                : room.id,
                                                                                        );
                                                                                    }}
                                                                                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150"
                                                                                    title="Налаштування кімнати"
                                                                                >
                                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                    </svg>
                                                                                </button>

                                                                                {/* Попап Налаштувань кімнати */}
                                                                                {isSettingsOpen && (
                                                                                    <div
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        className="absolute right-0 top-10 z-50 w-80 bg-white dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700 rounded-2xl shadow-2xl p-4 space-y-3.5 origin-top-right border-emerald-500/20 backdrop-blur-sm"
                                                                                    >
                                                                                        {/* Popover Header */}
                                                                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-700 pb-2.5">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isRepair ? "bg-red-500 animate-pulse" : isIntakeClosed ? "bg-amber-500" : "bg-emerald-500"}`} />
                                                                                                <div>
                                                                                                    <h6 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                                                                                                        Кімната №{room.room_number}
                                                                                                    </h6>
                                                                                                    <span className="text-[10px] text-gray-400 font-medium block">
                                                                                                        Поверх {room.floor}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => setSettingsRoomId(null)}
                                                                                                className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xs font-bold transition-colors"
                                                                                            >
                                                                                                ✕
                                                                                            </button>
                                                                                        </div>

                                                                                        {/* Блок: Місткість (кількість ліжок) */}
                                                                                        <div className="space-y-1.5">
                                                                                            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                                                                                                <span>Місткість (кількість ліжок)</span>
                                                                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold normal-case">
                                                                                                    {approvedBookings.length} / {room.max_capacity} зайнято
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex items-center justify-between bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-200 dark:border-gray-700 p-1.5">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleUpdateCapacity(room.id, room.max_capacity - 1)}
                                                                                                    disabled={room.max_capacity <= 1 || room.max_capacity <= approvedBookings.length}
                                                                                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-black hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-30 disabled:pointer-events-none shadow-xs text-base"
                                                                                                    title="Зменшити кількість ліжок"
                                                                                                >
                                                                                                    −
                                                                                                </button>
                                                                                                <div className="flex items-baseline gap-1.5">
                                                                                                    <span className="text-lg font-black text-gray-900 dark:text-white tabular-nums">
                                                                                                        {room.max_capacity}
                                                                                                    </span>
                                                                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                                                        {room.max_capacity === 1 ? "ліжко" : room.max_capacity < 5 ? "ліжка" : "ліжок"}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleUpdateCapacity(room.id, room.max_capacity + 1)}
                                                                                                    disabled={room.max_capacity >= 20}
                                                                                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-black hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 transition-colors disabled:opacity-30 shadow-xs text-base"
                                                                                                    title="Збільшити кількість ліжок"
                                                                                                >
                                                                                                    +
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Розділювач */}
                                                                                        <div className="border-t border-slate-100 dark:border-gray-700" />

                                                                                        {/* Toggles */}
                                                                                        <div className="space-y-2 text-xs">
                                                                                            {/* Toggle: Прийом */}
                                                                                            <div
                                                                                                onClick={() => handleToggleIntake(room.id)}
                                                                                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-gray-700/50 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer select-none border border-slate-100 dark:border-gray-700/60"
                                                                                            >
                                                                                                <span className="font-semibold text-gray-700 dark:text-gray-200">
                                                                                                    {Boolean(room.intake_closed) ? "Прийом закритий" : "Прийом відкритий"}
                                                                                                </span>
                                                                                                <div
                                                                                                    className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center ${Boolean(room.intake_closed) ? "bg-red-500" : "bg-emerald-500"}`}
                                                                                                >
                                                                                                    <span
                                                                                                        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${Boolean(room.intake_closed) ? "translate-x-0" : "translate-x-4"}`}
                                                                                                    />
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Toggle: Видимість */}
                                                                                            <div
                                                                                                onClick={() => handleToggleVisibility(room.id)}
                                                                                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-gray-700/50 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer select-none border border-slate-100 dark:border-gray-700/60"
                                                                                            >
                                                                                                <span className="font-semibold text-gray-700 dark:text-gray-200">
                                                                                                    {Boolean(room.hide_from_frontend) ? "Прихована з сайту" : "Видима на сайті"}
                                                                                                </span>
                                                                                                <div
                                                                                                    className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center ${Boolean(room.hide_from_frontend) ? "bg-amber-500" : "bg-emerald-500"}`}
                                                                                                >
                                                                                                    <span
                                                                                                        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${Boolean(room.hide_from_frontend) ? "translate-x-0" : "translate-x-4"}`}
                                                                                                    />
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Toggle: Інклюзивна (для осіб з інвалідністю) */}
                                                                                            <div
                                                                                                onClick={() => handleToggleAccessibility && handleToggleAccessibility(room.id)}
                                                                                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-gray-700/50 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer select-none border border-slate-100 dark:border-gray-700/60"
                                                                                                title="Кімната для осіб з обмеженими фізичними можливостями / інвалідністю"
                                                                                            >
                                                                                                <div className="flex items-center gap-1.5">
                                                                                                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                                                                                                        {Boolean(room.is_accessible) ? "Інклюзивна кімната" : "Звичайна кімната"}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div
                                                                                                    className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center ${Boolean(room.is_accessible) ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
                                                                                                >
                                                                                                    <span
                                                                                                        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${Boolean(room.is_accessible) ? "translate-x-4" : "translate-x-0"}`}
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Дії: Ремонт та Видалення */}
                                                                                        <div className="pt-2 border-t border-slate-100 dark:border-gray-700 space-y-2">
                                                                                            {/* Кнопка Ремонту */}
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setSettingsRoomId(null);
                                                                                                    if (room.status === "closed") {
                                                                                                        handleToggleStatus(room.id);
                                                                                                    } else if (handleOpenCloseRoomModal) {
                                                                                                        handleOpenCloseRoomModal(room);
                                                                                                    } else {
                                                                                                        handleToggleStatus(room.id);
                                                                                                    }
                                                                                                }}
                                                                                                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/60 transition-colors"
                                                                                            >
                                                                                                <span>
                                                                                                    {room.status === "closed" ? "Відкрити з ремонту" : "Закрити на ремонт"}
                                                                                                </span>
                                                                                            </button>

                                                                                            {/* Кнопка Видалення кімнати */}
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setSettingsRoomId(null);
                                                                                                    handleDeleteRoom(room);
                                                                                                }}
                                                                                                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200 dark:border-rose-900/60 transition-colors shadow-2xs"
                                                                                            >
                                                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                                </svg>
                                                                                                <span>Видалити кімнату</span>
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Візуальний прогрес-бар місткості */}
                                                                        <div className="space-y-1 my-2.5">
                                                                            <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                                                                                <span>Заповненість</span>
                                                                                <span>
                                                                                    {occupiedCount} / {room.max_capacity} місць
                                                                                </span>
                                                                            </div>
                                                                            <div className="w-full h-2 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden p-0.5">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all duration-300 ${
                                                                                        capacityPercent === 100
                                                                                            ? "bg-red-500"
                                                                                            : capacityPercent > 50
                                                                                            ? "bg-amber-500"
                                                                                            : "bg-emerald-500"
                                                                                    }`}
                                                                                    style={{ width: `${capacityPercent}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Список мешканців */}
                                                                        <div className="space-y-1.5 mt-3">
                                                                            {approvedBookings.map(
                                                                                (
                                                                                    b,
                                                                                ) => {
                                                                                    const userSpec = String(b.user?.specialty || "").trim().toUpperCase();
                                                                                    const userCourse = Number(b.user?.course);
                                                                                    const userGroup = b.user?.group ? String(b.user.group).trim() : null;
                                                                                    const isMatchingResident = (academicSpecialtyFilter !== "all" || academicCourseFilter !== "all") && (
                                                                                        (academicSpecialtyFilter === "all" || userSpec === String(academicSpecialtyFilter).trim().toUpperCase()) &&
                                                                                        (academicCourseFilter === "all" || userCourse === Number(academicCourseFilter))
                                                                                    );

                                                                                    const courseCfg = COURSE_CONFIG.find((c) => c.num === userCourse);
                                                                                    const specInfo = SPECIALTY_META[userSpec] || {
                                                                                        name: userSpec,
                                                                                        bg: "bg-slate-100 dark:bg-gray-750",
                                                                                        text: "text-slate-700 dark:text-gray-200",
                                                                                        border: "border-slate-200/80 dark:border-gray-700",
                                                                                        dot: "bg-slate-400",
                                                                                    };
                                                                                    const isSpecActive = academicSpecialtyFilter === userSpec;
                                                                                    const isCourseActive = academicCourseFilter === String(userCourse);

                                                                                    return (
                                                                                        <div
                                                                                            key={
                                                                                                b.id
                                                                                            }
                                                                                            onClick={() =>
                                                                                                handleOpenEditUserModal(
                                                                                                    b.user ||
                                                                                                        b,
                                                                                                    {
                                                                                                        room_number:
                                                                                                            room.room_number,
                                                                                                        building_name:
                                                                                                            building.name,
                                                                                                    },
                                                                                                )
                                                                                            }
                                                                                            className={`group p-2.5 rounded-xl border text-xs cursor-pointer transition-all duration-150 ${
                                                                                                isMatchingResident
                                                                                                    ? "bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-500/25 shadow-2xs"
                                                                                                    : "bg-white dark:bg-gray-800/90 border-slate-200/80 dark:border-gray-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs"
                                                                                            }`}
                                                                                        >
                                                                                            {/* Верхній рядок: Аватар з іконкою статі, ім'я студента та кнопки дій */}
                                                                                            <div className="flex items-center justify-between gap-1.5">
                                                                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                                                    <div
                                                                                                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                                                                                                            b.user?.gender === "female"
                                                                                                                ? "bg-pink-50/80 dark:bg-pink-950/40 border-pink-200/70 dark:border-pink-900/50"
                                                                                                                : "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-900/50"
                                                                                                        }`}
                                                                                                    >
                                                                                                        <BedIcon
                                                                                                            gender={
                                                                                                                b
                                                                                                                    .user
                                                                                                                    ?.gender
                                                                                                            }
                                                                                                            isOccupied={
                                                                                                                true
                                                                                                            }
                                                                                                            name={
                                                                                                                b
                                                                                                                    .user
                                                                                                                    ?.name
                                                                                                            }
                                                                                                        />
                                                                                                    </div>
                                                                                                    <span
                                                                                                        className="truncate font-bold text-xs text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                                                                                                        title={
                                                                                                            b.user?.name ||
                                                                                                            "Користувач"
                                                                                                        }
                                                                                                    >
                                                                                                        {b.user?.name ||
                                                                                                            "Користувач"}
                                                                                                    </span>
                                                                                                </div>

                                                                                                {/* Кнопки дій (переселити, виселити) */}
                                                                                                <div className="flex items-center gap-0.5 shrink-0 ml-1 opacity-75 group-hover:opacity-100 transition-opacity">
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={(
                                                                                                            e,
                                                                                                        ) => {
                                                                                                            e.stopPropagation();
                                                                                                            handleRequestReallocate(
                                                                                                                b,
                                                                                                                room,
                                                                                                            );
                                                                                                        }}
                                                                                                        title="Переселити студента"
                                                                                                        className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                                                                                                    >
                                                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                                                                        </svg>
                                                                                                    </button>
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={(
                                                                                                            e,
                                                                                                        ) => {
                                                                                                            e.stopPropagation();
                                                                                                            handleEvictStudent &&
                                                                                                                handleEvictStudent(
                                                                                                                    b,
                                                                                                                );
                                                                                                        }}
                                                                                                        title="Виселити студента"
                                                                                                        className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                                                                                                    >
                                                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                                                        </svg>
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Нижній рядок: Детальні бейджі навчання (Курс, Спеціальність, Група) */}
                                                                                            {(userCourse || userSpec || userGroup) && (
                                                                                                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap pl-8">
                                                                                                    {userCourse ? (
                                                                                                        <span
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation();
                                                                                                                setAcademicCourseFilter(isCourseActive ? "all" : String(userCourse));
                                                                                                            }}
                                                                                                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold border transition-all cursor-pointer ${
                                                                                                                isCourseActive
                                                                                                                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs border-slate-900 dark:border-white"
                                                                                                                    : `${courseCfg?.lightBg || "bg-slate-100 dark:bg-gray-700"} ${courseCfg?.text || "text-slate-600 dark:text-gray-300"} ${courseCfg?.border || "border-slate-200 dark:border-gray-600"} hover:brightness-95 dark:hover:brightness-110`
                                                                                                            }`}
                                                                                                            title={`${userCourse} курс — клікніть для фільтрації на мапі`}
                                                                                                        >
                                                                                                            <span className={`w-1.5 h-1.5 rounded-full ${isCourseActive ? "bg-white dark:bg-slate-900" : courseCfg?.bg || "bg-slate-400"}`} />
                                                                                                            <span>{userCourse} курс</span>
                                                                                                        </span>
                                                                                                    ) : null}

                                                                                                    {userSpec ? (
                                                                                                        <span
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation();
                                                                                                                setAcademicSpecialtyFilter(isSpecActive ? "all" : userSpec);
                                                                                                            }}
                                                                                                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold border transition-all cursor-pointer ${
                                                                                                                isSpecActive
                                                                                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                                                                                                    : `${specInfo.bg} ${specInfo.text} ${specInfo.border} hover:brightness-95 dark:hover:brightness-110`
                                                                                                            }`}
                                                                                                            title={`${specInfo.name || userSpec} — клікніть для фільтрації на мапі`}
                                                                                                        >
                                                                                                            <span className={`w-1.5 h-1.5 rounded-full ${isSpecActive ? "bg-white" : specInfo.dot}`} />
                                                                                                            <span>{userSpec}</span>
                                                                                                        </span>
                                                                                                    ) : null}

                                                                                                    {userGroup && (
                                                                                                        <span
                                                                                                            className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-gray-750 text-slate-500 dark:text-gray-400 border border-slate-200/70 dark:border-gray-700"
                                                                                                            title={`Академічна група: ${userGroup}`}
                                                                                                        >
                                                                                                            гр. {userGroup}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                },
                                                                            )}

                                                                            {/* Вільні ліжка */}
                                                                            {Array.from(
                                                                                {
                                                                                    length: Math.max(
                                                                                        0,
                                                                                        room.max_capacity -
                                                                                            approvedBookings.length,
                                                                                    ),
                                                                                },
                                                                            ).map(
                                                                                (
                                                                                    _,
                                                                                    idx,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        onClick={() =>
                                                                                            handleOpenManualBooking &&
                                                                                            handleOpenManualBooking(
                                                                                                room,
                                                                                            )
                                                                                        }
                                                                                        className="group flex items-center justify-between p-2.5 rounded-xl border border-dashed border-slate-200/90 dark:border-gray-700 text-xs text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-all duration-150"
                                                                                    >
                                                                                        <div className="flex items-center gap-2">
                                                                                            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 group-hover:text-emerald-600 transition-colors border border-slate-200/60 dark:border-gray-700">
                                                                                                <BedIcon
                                                                                                    isOccupied={
                                                                                                        false
                                                                                                    }
                                                                                                />
                                                                                            </div>
                                                                                            <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                                                                Вільне ліжко
                                                                                            </span>
                                                                                        </div>
                                                                                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            + Поселити
                                                                                        </span>
                                                                                    </div>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}

            {/* Модальні вікна для створення кімнати, поверху та корпусу */}
            <AddRoomModal
                isOpen={addRoomModalOpen}
                onClose={() => setAddRoomModalOpen(false)}
                buildingId={roomModalData.buildingId}
                buildingName={roomModalData.buildingName}
                floor={roomModalData.floor}
                suggestedRoomNumber={roomModalData.suggestedRoomNumber}
            />

            <AddFloorModal
                isOpen={addFloorModalOpen}
                onClose={() => setAddFloorModalOpen(false)}
                buildingId={floorModalData.buildingId}
                buildingName={floorModalData.buildingName}
                suggestedFloor={floorModalData.suggestedFloor}
            />

            <AddBuildingModal
                isOpen={addBuildingModalOpen}
                onClose={() => setAddBuildingModalOpen(false)}
            />
        </div>
    );
}
