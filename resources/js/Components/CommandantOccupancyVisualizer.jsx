import React, { useState, useMemo } from "react";

export default function CommandantOccupancyVisualizer({
    building,
    allBuildings = [],
    selectedBuildingId,
    onSelectBuilding,
    getRoomGender,
    handleOpenManualBooking,
    handleOpenCloseRoomModal,
    handleToggleStatus,
    handleToggleIntake,
    handleToggleVisibility,
    handleUpdateCapacity,
    handleEvictStudent,
    handleOpenEditUserModal,
    handleRequestReallocate,
    isSuperAdmin,
    liveHighlightedRoomIds = [],
}) {
    const [selectedFloor, setSelectedFloor] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // all, free, full, male, female, empty, repair
    const [inspectingRoom, setInspectingRoom] = useState(null);

    // Розрахунок аналітики корпусу
    const stats = useMemo(() => {
        if (!building || !building.rooms) {
            return {
                totalRooms: 0,
                totalCapacity: 0,
                totalOccupied: 0,
                totalFree: 0,
                maleBeds: 0,
                femaleBeds: 0,
                emptyRoomBeds: 0,
                repairRooms: 0,
                occupancyRate: 0,
                floorsMap: {},
            };
        }

        let totalCapacity = 0;
        let totalOccupied = 0;
        let maleBeds = 0;
        let femaleBeds = 0;
        let emptyRoomBeds = 0;
        let repairRooms = 0;
        const floorsMap = {};

        building.rooms.forEach((room) => {
            const floorNum = Number(room.floor) || 1;
            if (!floorsMap[floorNum]) {
                floorsMap[floorNum] = {
                    floor: floorNum,
                    rooms: [],
                    capacity: 0,
                    occupied: 0,
                    free: 0,
                };
            }
            floorsMap[floorNum].rooms.push(room);

            const activeBookings = (room.bookings || []).filter(
                (b) => b.status === "approved" || (b.status === "pending" && b.new_room_id !== null)
            );
            const occupied = activeBookings.length;
            const capacity = Number(room.max_capacity) || 0;
            const free = Math.max(0, capacity - occupied);

            totalCapacity += capacity;
            totalOccupied += occupied;

            floorsMap[floorNum].capacity += capacity;
            floorsMap[floorNum].occupied += occupied;
            floorsMap[floorNum].free += free;

            if (room.status === "closed") {
                repairRooms += 1;
            }

            const roomGenderInfo = getRoomGender ? getRoomGender(room) : { type: "empty" };
            if (roomGenderInfo.type === "male") {
                maleBeds += occupied;
            } else if (roomGenderInfo.type === "female") {
                femaleBeds += occupied;
            } else {
                emptyRoomBeds += free;
            }
        });

        const totalFree = Math.max(0, totalCapacity - totalOccupied);
        const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

        return {
            totalRooms: building.rooms.length,
            totalCapacity,
            totalOccupied,
            totalFree,
            maleBeds,
            femaleBeds,
            emptyRoomBeds,
            repairRooms,
            occupancyRate,
            floorsMap,
        };
    }, [building, getRoomGender]);

    // Список поверхів відсортований від верхнього до нижнього (як реальний корпус)
    const sortedFloors = useMemo(() => {
        return Object.keys(stats.floorsMap)
            .map(Number)
            .sort((a, b) => b - a); // 5, 4, 3, 2, 1
    }, [stats.floorsMap]);

    // Фільтрація кімнат
    const filteredRooms = useMemo(() => {
        if (!building || !building.rooms) return [];

        return building.rooms
            .filter((room) => {
                // Фільтр за поверхом
                if (selectedFloor !== "all" && Number(room.floor) !== Number(selectedFloor)) {
                    return false;
                }

                const activeBookings = (room.bookings || []).filter(
                    (b) => b.status === "approved" || (b.status === "pending" && b.new_room_id !== null)
                );
                const isFull = activeBookings.length >= room.max_capacity;
                const isRepair = room.status === "closed";
                const roomGender = getRoomGender ? getRoomGender(room).type : "empty";

                // Фільтр за статусом
                if (filterStatus === "free" && (isFull || isRepair)) return false;
                if (filterStatus === "full" && !isFull) return false;
                if (filterStatus === "repair" && !isRepair) return false;
                if (filterStatus === "male" && roomGender !== "male") return false;
                if (filterStatus === "female" && roomGender !== "female") return false;
                if (filterStatus === "empty" && roomGender !== "empty") return false;

                // Пошук
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase().trim();
                    const matchRoom = room.room_number.toLowerCase().includes(q);
                    const matchUser = activeBookings.some(
                        (b) =>
                            b.user?.name?.toLowerCase().includes(q) ||
                            b.user?.email?.toLowerCase().includes(q) ||
                            b.user?.phone?.includes(q) ||
                            b.user?.group?.toLowerCase().includes(q)
                    );
                    if (!matchRoom && !matchUser) return false;
                }

                return true;
            })
            .sort((a, b) =>
                a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
            );
    }, [building, selectedFloor, filterStatus, searchQuery, getRoomGender]);

    if (!building) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center text-gray-400">
                Корпус не знайдено або не призначено.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Головна картка корпусу з показниками зайнятості */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white shadow-xl border border-emerald-800/40 p-6 sm:p-8">
                {/* Фоновий декор */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {building.name}
                            </span>
                            {allBuildings.length > 1 && onSelectBuilding && (
                                <select
                                    value={selectedBuildingId || building.id}
                                    onChange={(e) => onSelectBuilding(e.target.value)}
                                    className="text-xs bg-slate-800/80 border border-slate-700 text-white rounded-xl px-2.5 py-1 focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                                >
                                    {allBuildings.map((b) => (
                                        <option key={b.id} value={b.id} className="bg-gray-900 text-white">
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                            <span>Інтерактивна схема зайнятості</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl leading-relaxed">
                            Наочний моніторинг житлового фонду корпусу, архітектурний зріз поверхів та оперативне управління кімнатами гуртожитку.
                        </p>
                    </div>

                    {/* Інтерактивний круговий показник зайнятості */}
                    <div className="flex items-center gap-5 bg-white/5 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 shrink-0">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-white/10"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className={
                                        stats.occupancyRate >= 90
                                            ? "text-rose-400"
                                            : stats.occupancyRate >= 70
                                            ? "text-amber-400"
                                            : "text-emerald-400"
                                    }
                                    strokeDasharray={`${stats.occupancyRate}, 100`}
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-lg font-black leading-none">{stats.occupancyRate}%</span>
                                <span className="text-[9px] text-emerald-200/80 uppercase tracking-tighter">зайнято</span>
                            </div>
                        </div>

                        <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-300 text-[11px]">Заселено:</span>
                                <span className="font-bold text-white text-sm">
                                    {stats.totalOccupied} <span className="text-xs text-slate-400">/ {stats.totalCapacity}</span>
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-emerald-300 text-[11px] font-semibold">Вільних місць:</span>
                                <span className="font-black text-emerald-400 text-sm">{stats.totalFree}</span>
                            </div>
                            {stats.repairRooms > 0 && (
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-rose-300 text-[11px]">На ремонті:</span>
                                    <span className="font-bold text-rose-400">{stats.repairRooms} кімн.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Швидкі метрики внизу головної картки */}
                <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Всього кімнат</span>
                        <span className="text-lg font-bold text-white">{stats.totalRooms}</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-sky-300 block mb-0.5">🚹 Хлопці (зайнято)</span>
                        <span className="text-lg font-bold text-sky-300">{stats.maleBeds} ліжок</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-rose-300 block mb-0.5">🚺 Дівчата (зайнято)</span>
                        <span className="text-lg font-bold text-rose-300">{stats.femaleBeds} ліжок</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-0.5">⚪ Вільних кімнат</span>
                        <span className="text-lg font-bold text-emerald-300">{stats.emptyRoomBeds} ліжок</span>
                    </div>
                </div>
            </div>

            {/* Архітектурний інтерактивний зріз корпусу (Elevation Cross-Section) */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-100 dark:border-gray-700 shadow-sm p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-gray-700/80 pb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>Архітектурний зріз корпусу по поверхах</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Оберіть поверх для миттєвої фільтрації або перегляньте розподіл вільних місць
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSelectedFloor("all")}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            selectedFloor === "all"
                                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                                : "bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600"
                        }`}
                    >
                        Показати всі поверхи ({building.rooms?.length || 0})
                    </button>
                </div>

                {/* Вертикальний стек поверхів */}
                <div className="space-y-2.5">
                    {sortedFloors.map((floorNum) => {
                        const floorData = stats.floorsMap[floorNum];
                        const isSelected = selectedFloor === String(floorNum);
                        const floorPercent = floorData.capacity > 0
                            ? Math.round((floorData.occupied / floorData.capacity) * 100)
                            : 0;

                        return (
                            <div
                                key={floorNum}
                                onClick={() => setSelectedFloor(isSelected ? "all" : String(floorNum))}
                                className={`cursor-pointer group p-3.5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                    isSelected
                                        ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600 shadow-md ring-2 ring-emerald-500/20"
                                        : "bg-slate-50/70 dark:bg-gray-700/40 border-slate-200/70 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/30"
                                }`}
                            >
                                {/* Назва поверху */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm transition-all ${
                                            isSelected
                                                ? "bg-emerald-600 text-white shadow-sm"
                                                : "bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-gray-600 group-hover:border-emerald-400"
                                        }`}
                                    >
                                        {floorNum}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                                            <span>Поверх {floorNum}</span>
                                            {isSelected && (
                                                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.2 rounded-full">
                                                    Активний
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-gray-400">
                                            {floorData.rooms.length} кімнат • {floorData.capacity} ліжко-місць
                                        </span>
                                    </div>
                                </div>

                                {/* Міні-стрічка кімнат на поверсі (візуальні піни) */}
                                <div className="flex-1 flex items-center gap-1.5 flex-wrap overflow-hidden py-1">
                                    {floorData.rooms.slice(0, 16).map((rm) => {
                                        const approvedB = (rm.bookings || []).filter(
                                            (b) => b.status === "approved" || (b.status === "pending" && b.new_room_id !== null)
                                        );
                                        const isRmFull = approvedB.length >= rm.max_capacity;
                                        const isRmRepair = rm.status === "closed";
                                        const rmGender = getRoomGender ? getRoomGender(rm).type : "empty";

                                        let dotColor = "bg-emerald-500 hover:scale-125";
                                        if (isRmRepair) {
                                            dotColor = "bg-purple-500";
                                        } else if (isRmFull) {
                                            dotColor = rmGender === "male" ? "bg-sky-500" : rmGender === "female" ? "bg-rose-500" : "bg-red-500";
                                        }

                                        return (
                                            <span
                                                key={rm.id}
                                                title={`Кімната №${rm.room_number}: ${approvedB.length}/${rm.max_capacity} місць`}
                                                className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer shadow-2xs ${dotColor}`}
                                            />
                                        );
                                    })}
                                    {floorData.rooms.length > 16 && (
                                        <span className="text-[10px] text-gray-400 font-bold">
                                            +{floorData.rooms.length - 16}
                                        </span>
                                    )}
                                </div>

                                {/* Шкала прогресу та вільні місця */}
                                <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                                    <div className="w-28 sm:w-36 space-y-1">
                                        <div className="flex justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                            <span>Зайнятість</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{floorPercent}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-gray-600 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    floorPercent >= 90
                                                        ? "bg-rose-500"
                                                        : floorPercent >= 70
                                                        ? "bg-amber-500"
                                                        : "bg-emerald-500"
                                                }`}
                                                style={{ width: `${Math.min(floorPercent, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="text-right min-w-[70px]">
                                        <span className="text-emerald-700 dark:text-emerald-300 font-black text-xs sm:text-sm block">
                                            {floorData.free} вільних
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {floorData.occupied} зайнято
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Панель фільтрів та пошуку по кімнатах */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Пошук за номером кімнати, ім'ям або телефоном студента..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 py-2.5 pl-9 pr-4 bg-slate-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Кнопки-фільтри */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {[
                        { key: "all", label: "Всі кімнати" },
                        { key: "free", label: "🟢 З вільними місцями" },
                        { key: "full", label: "🔴 Повні" },
                        { key: "male", label: "🚹 Чоловічі" },
                        { key: "female", label: "🚺 Жіночі" },
                        { key: "empty", label: "⚪ Вільні" },
                        { key: "repair", label: "🛠️ Ремонт" },
                    ].map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => setFilterStatus(f.key)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                                filterStatus === f.key
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Сітка інтерактивних кімнат із візуалізацією спальних місць */}
            {filteredRooms.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-12 text-center text-gray-400">
                    <p className="text-sm font-semibold">Кімнат за обраними критеріями не знайдено.</p>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedFloor("all");
                            setFilterStatus("all");
                            setSearchQuery("");
                        }}
                        className="mt-3 text-xs text-emerald-600 font-bold hover:underline"
                    >
                        Скинути всі фільтри
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredRooms.map((room) => {
                        const approvedBookings = (room.bookings || []).filter(
                            (b) => b.status === "approved" || (b.status === "pending" && b.new_room_id !== null)
                        );
                        const capacity = Number(room.max_capacity) || 1;
                        const occupied = approvedBookings.length;
                        const freeSlotsCount = Math.max(0, capacity - occupied);
                        const isFull = occupied >= capacity;
                        const isRepair = room.status === "closed";
                        const isIntakeClosed = Boolean(room.intake_closed);
                        const roomGender = getRoomGender ? getRoomGender(room) : { type: "empty", label: "Вільна" };
                        const isLiveHighlighted = liveHighlightedRoomIds.includes(Number(room.id));

                        return (
                            <div
                                key={room.id}
                                className={`rounded-2xl p-4 bg-white dark:bg-gray-800 border transition-all duration-200 flex flex-col justify-between relative shadow-sm hover:shadow-md ${
                                    isRepair
                                        ? "border-purple-300 dark:border-purple-800 bg-purple-50/10 dark:bg-purple-950/10"
                                        : isFull
                                        ? "border-slate-200 dark:border-gray-700"
                                        : "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/5 dark:bg-emerald-950/5"
                                } ${
                                    isLiveHighlighted
                                        ? "ring-4 ring-emerald-400 dark:ring-emerald-500 scale-[1.02] shadow-emerald-500/25 animate-pulse"
                                        : ""
                                }`}
                            >
                                {/* Верхній рядок: Номер кімнати, поверх, бейдж статі */}
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2.5">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-extrabold text-gray-900 dark:text-white text-base tracking-tight">
                                                    №{room.room_number}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-slate-300">
                                                    {room.floor} пов.
                                                </span>
                                            </div>

                                            {/* Бейдж статі */}
                                            <div className="mt-1">
                                                {roomGender.type === "male" && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                                                        🚹 Чоловіча
                                                    </span>
                                                )}
                                                {roomGender.type === "female" && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                                                        🚺 Жіноча
                                                    </span>
                                                )}
                                                {roomGender.type === "empty" && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                                        ⚪ Вільна
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Індикатор заповненості */}
                                        <div className="text-right">
                                            <span
                                                className={`text-xs font-black px-2.5 py-1 rounded-xl block ${
                                                    isRepair
                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                                        : isFull
                                                        ? "bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-300"
                                                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                                                }`}
                                            >
                                                {occupied} / {capacity}
                                            </span>
                                            <span className="text-[9px] text-gray-400 block mt-0.5 font-medium">
                                                {isRepair ? "На ремонті" : isFull ? "Заповнена" : `${freeSlotsCount} вільних`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Візуалізатор ліжок (Bed Slot Visualizer) */}
                                    <div className="my-3 p-2.5 bg-slate-50 dark:bg-gray-900/50 rounded-xl border border-slate-100 dark:border-gray-700/60 space-y-1.5">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                                            <span>Спальні місця</span>
                                            <span>{capacity} ліж.</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-1.5">
                                            {/* Зайняті ліжка */}
                                            {approvedBookings.map((b, bIdx) => (
                                                <div
                                                    key={b.id || bIdx}
                                                    onClick={() => setInspectingRoom(room)}
                                                    className="cursor-pointer group flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-emerald-400 transition-all text-left"
                                                    title={`Жилець: ${b.user?.name || "Студент"}`}
                                                >
                                                    <div
                                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ${
                                                            b.user?.gender === "female"
                                                                ? "bg-rose-500"
                                                                : "bg-indigo-600"
                                                        }`}
                                                    >
                                                        {b.user?.name ? b.user.name.charAt(0) : "S"}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate block group-hover:text-emerald-600">
                                                            {b.user?.name ? b.user.name.split(" ")[0] : "Жилець"}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 block truncate">
                                                            {b.user?.course ? `${b.user.course} курс` : "Студент"}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Вільні ліжка (клікабельні слоти для швидкого заселення) */}
                                            {Array.from({ length: freeSlotsCount }).map((_, slotIdx) => (
                                                <button
                                                    key={`free-${slotIdx}`}
                                                    type="button"
                                                    disabled={isRepair}
                                                    onClick={() => handleOpenManualBooking && handleOpenManualBooking(room)}
                                                    className={`flex items-center justify-center gap-1 p-1.5 rounded-lg border border-dashed text-left transition-all ${
                                                        isRepair
                                                            ? "border-gray-300 dark:border-gray-700 opacity-50 cursor-not-allowed"
                                                            : "border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50 hover:border-emerald-500 cursor-pointer group"
                                                    }`}
                                                    title="Вільне місце — натисніть для швидкого заселення"
                                                >
                                                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
                                                        +
                                                    </span>
                                                    <span className="text-[10px] font-bold truncate">Вільне</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Швидкі дії на картці */}
                                <div className="pt-2 border-t border-slate-100 dark:border-gray-700/60 flex items-center justify-between gap-1.5 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setInspectingRoom(room)}
                                        className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:text-emerald-600 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-all"
                                    >
                                        Деталі
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {!isFull && !isRepair && (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenManualBooking && handleOpenManualBooking(room)}
                                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs"
                                            >
                                                Заселити
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => handleOpenCloseRoomModal ? handleOpenCloseRoomModal(room) : handleToggleStatus && handleToggleStatus(room)}
                                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                                isRepair
                                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                                                    : "bg-slate-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-slate-200"
                                            }`}
                                            title={isRepair ? "Відкрити кімнату з ремонту" : "Закрити кімнату на ремонт"}
                                        >
                                            {isRepair ? "З ремонту" : "Ремонт"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Модальне вікно інспекції кімнати */}
            {inspectingRoom && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-gray-700 space-y-5 animate-scale-up">
                        <div className="flex justify-between items-start border-b border-slate-100 dark:border-gray-700 pb-3">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                    Інформація про кімнату
                                </span>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                    Кімната №{inspectingRoom.room_number} (Поверх {inspectingRoom.floor})
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setInspectingRoom(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Список жильців */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Заселені студенти ({inspectingRoom.bookings?.filter(b => b.status === "approved").length || 0} із {inspectingRoom.max_capacity})
                            </h4>

                            {inspectingRoom.bookings?.filter(b => b.status === "approved").length === 0 ? (
                                <p className="text-xs text-gray-400 italic py-2">У цій кімнаті наразі немає проживаючих.</p>
                            ) : (
                                inspectingRoom.bookings?.filter(b => b.status === "approved").map((b) => (
                                    <div
                                        key={b.id}
                                        className="p-3 bg-slate-50 dark:bg-gray-700/50 rounded-xl border border-slate-200 dark:border-gray-600 flex items-center justify-between gap-3 text-xs"
                                    >
                                        <div>
                                            <span className="font-bold text-gray-900 dark:text-white block">
                                                {b.user?.name}
                                            </span>
                                            <span className="text-[11px] text-gray-400">
                                                {b.user?.email} • {b.user?.phone || "Без телефону"}
                                            </span>
                                            {b.user?.group && (
                                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                                                    Група: {b.user.group} ({b.user.course} курс)
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {handleEvictStudent && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleEvictStudent(b.id, b.user?.name, inspectingRoom.room_number);
                                                        setInspectingRoom(null);
                                                    }}
                                                    className="px-2 py-1 text-[10px] font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                                                >
                                                    Виселити
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Швидкі дії в модалці */}
                        <div className="pt-3 border-t border-slate-100 dark:border-gray-700 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    handleOpenManualBooking && handleOpenManualBooking(inspectingRoom);
                                    setInspectingRoom(null);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm"
                            >
                                + Заселити студента
                            </button>
                            <button
                                type="button"
                                onClick={() => setInspectingRoom(null)}
                                className="px-4 py-2 bg-slate-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl"
                            >
                                Закрити
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
