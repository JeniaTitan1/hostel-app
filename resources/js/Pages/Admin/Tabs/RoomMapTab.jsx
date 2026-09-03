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
    handleOpenManualBooking,
    handleOpenCloseRoomModal,
    handleEvictStudent,
    handleOpenEditUserModal,
    handleRequestReallocate,
    BedIcon,
    isSuperAdmin,
    liveHighlightedRoomIds = [],
}) {
    const [selectedFloor, setSelectedFloor] = useState("all");
    const [settingsRoomId, setSettingsRoomId] = useState(null);

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
            {/* Коротке та функціональне зведення зайнятості (без емодзі) */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700/80 rounded-2xl shadow-xs p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-gray-700/70">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                Стан житлового фонду
                            </h4>
                            <span className="text-xs text-gray-400">
                                {selectedBuildingFilter
                                    ? buildings.find((b) => Number(b.id) === Number(selectedBuildingFilter))?.name || "Обраний корпус"
                                    : (isSuperAdmin && buildings.length > 1 ? "Усі корпуси" : (buildings[0]?.name || "Корпус"))}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Заповненість:</span>
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
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-100 dark:border-gray-700">
                        <span className="text-[11px] text-gray-400 block mb-0.5">Всього місць</span>
                        <span className="text-base font-black text-gray-900 dark:text-white">
                            {overviewStats.totalCapacity}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">у {overviewStats.totalRooms} кімнатах</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-700/40 border border-slate-100 dark:border-gray-700">
                        <span className="text-[11px] text-gray-400 block mb-0.5">Заселено</span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            {overviewStats.totalOccupied}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{overviewStats.percent}% фонду</span>
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
            </div>

            {/* Пошук та фільтри для мапи */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight flex items-center gap-2">
                        Карта корпусів МНАУ
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                        Інтерактивна схема кімнат, поверхів та розселення
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                    {/* Фільтр корпусів / Фіксований корпус для коменданта */}
                    {isSuperAdmin && buildings.length > 1 ? (
                        <select
                            value={selectedBuildingFilter}
                            onChange={(e) =>
                                setSelectedBuildingFilter(e.target.value)
                            }
                            className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-44 transition-all font-medium"
                        >
                            <option value="">Усі корпуси</option>
                            {buildings.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-200 px-3.5 py-2 bg-slate-100 dark:bg-gray-700/80 rounded-xl border border-slate-200 dark:border-gray-600 flex items-center gap-2 shrink-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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

                    {/* Пошук */}
                    <input
                        type="text"
                        placeholder="Пошук жильця або кімнати..."
                        value={mapSearch}
                        onChange={(e) => setMapSearch(e.target.value)}
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-48 transition-all"
                    />

                    {/* Фільтр статі */}
                    <select
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value)}
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-36 transition-all"
                    >
                        <option value="">Всі статі</option>
                        <option value="male">Чоловічі</option>
                        <option value="female">Жіночі</option>
                        <option value="empty">Вільні кімнати</option>
                    </select>

                    {/* Швидкий вибір поверху */}
                    <div className="flex items-center bg-slate-100 dark:bg-gray-700/60 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setSelectedFloor("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 shrink-0 ${
                                selectedFloor === "all"
                                    ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                    : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            Усі поверхи
                        </button>
                        {[1, 2, 3, 4, 5].map((fl) => (
                            <button
                                key={fl}
                                type="button"
                                onClick={() => setSelectedFloor(String(fl))}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 shrink-0 ${
                                    selectedFloor === String(fl)
                                        ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
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
                                            return (
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
                                                )
                                            );
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
                                                    {floorRooms
                                                        .filter((room) => {
                                                            if (!genderFilter)
                                                                return true;
                                                            const rg =
                                                                getRoomGender(
                                                                    room,
                                                                );
                                                            if (
                                                                genderFilter ===
                                                                "empty"
                                                            )
                                                                return (
                                                                    rg.type ===
                                                                    "empty"
                                                                );
                                                            return (
                                                                rg.type ===
                                                                genderFilter
                                                            );
                                                        })
                                                        .map((room) => {
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
                                                                                <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">
                                                                                    Кімната
                                                                                    №
                                                                                    {
                                                                                        room.room_number
                                                                                    }
                                                                                </span>
                                                                                <span className="text-[11px] text-gray-400 block font-medium">
                                                                                    Поверх{" "}
                                                                                    {
                                                                                        room.floor
                                                                                    }
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
                                                                                <span>
                                                                                    Заповненість
                                                                                </span>
                                                                                <span>
                                                                                    {
                                                                                        occupiedCount
                                                                                    }{" "}
                                                                                    /{" "}
                                                                                    {
                                                                                        room.max_capacity
                                                                                    }{" "}
                                                                                    місць
                                                                                </span>
                                                                            </div>
                                                                            <div className="w-full h-2 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden p-0.5">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all duration-300 ${
                                                                                        capacityPercent ===
                                                                                        100
                                                                                            ? "bg-red-500"
                                                                                            : capacityPercent >
                                                                                                50
                                                                                              ? "bg-amber-500"
                                                                                              : "bg-emerald-500"
                                                                                    }`}
                                                                                    style={{
                                                                                        width: `${capacityPercent}%`,
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Список мешканців */}
                                                                        <div className="space-y-1.5 mt-3">
                                                                            {approvedBookings.map(
                                                                                (
                                                                                    b,
                                                                                ) => (
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
                                                                                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-gray-700/60 border border-slate-200/80 dark:border-gray-600/60 text-xs cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-white dark:hover:bg-gray-700 transition-colors duration-150"
                                                                                    >
                                                                                        <div className="flex items-center gap-2 truncate">
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
                                                                                            <span className="truncate font-semibold text-gray-800 dark:text-gray-100">
                                                                                                {b
                                                                                                    .user
                                                                                                    ?.name ||
                                                                                                    "Користувач"}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-1 shrink-0">
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
                                                                                                title="Переселити"
                                                                                                className="p-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
                                                                                            >
                                                                                                ⇄
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
                                                                                                className="p-1 text-xs font-bold text-red-500 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg transition-colors"
                                                                                            >
                                                                                                ✕
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ),
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
                                                                                        className="flex items-center gap-2 p-2 rounded-xl border border-dashed border-slate-200 dark:border-gray-700 text-xs text-slate-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors duration-150"
                                                                                    >
                                                                                        <BedIcon
                                                                                            isOccupied={
                                                                                                false
                                                                                            }
                                                                                        />
                                                                                        <span className="text-[11px] font-medium">
                                                                                            Вільне
                                                                                            місце
                                                                                            (+
                                                                                            Поселити)
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
