import React, { useState, useEffect } from "react";

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
}) {
    const [selectedFloor, setSelectedFloor] = useState("all");
    const [settingsRoomId, setSettingsRoomId] = useState(null);

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
            {/* Пошук та фільтри для мапи */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight flex items-center gap-2">
                        <span>🏛️</span> Карта корпусів МНАУ
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Інтерактивна схема кімнат, поверхів та розселення
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Фільтр корпусів */}
                    <select
                        value={selectedBuildingFilter}
                        onChange={(e) =>
                            setSelectedBuildingFilter(e.target.value)
                        }
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-44 transition-all"
                    >
                        <option value="">Усі корпуси</option>
                        {buildings.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>

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
                        className="text-xs rounded-xl border border-slate-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-40 transition-all"
                    >
                        <option value="">Всі статі</option>
                        <option value="male">Чоловічі ♂</option>
                        <option value="female">Жіночі ♀</option>
                        <option value="empty">Вільні кімнати</option>
                    </select>

                    {/* Швидкий вибір поверху */}
                    <div className="flex flex-wrap items-center bg-slate-100 dark:bg-gray-700/60 p-1 rounded-xl gap-1">
                        <button
                            type="button"
                            onClick={() => setSelectedFloor("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${
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
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${
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
                            <div className="border-b border-slate-100/80 dark:border-gray-700 pb-3 flex justify-between items-center">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                        Корпус
                                    </span>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-md">
                                        {building.name}
                                    </h4>
                                </div>
                                <span className="text-xs text-gray-400 bg-slate-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium shadow-3xs">
                                    Всього кімнат: {building.rooms?.length || 0}
                                </span>
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
                                                <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
                                                    Поверх {floor}
                                                </h5>
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
                                                                    "bg-[repeating-linear-gradient(45deg,rgba(239,68,68,0.06),rgba(239,68,68,0.06)_10px,transparent_10px,transparent_20px)] border-2 border-red-400 dark:border-red-800 opacity-90";
                                                            } else if (
                                                                isBothClosedAndHidden
                                                            ) {
                                                                cardBgStyle =
                                                                    "border-2 border-purple-400 dark:border-purple-600 bg-gradient-to-br from-amber-50/30 via-purple-50/20 to-indigo-50/30 dark:from-amber-950/20 dark:via-purple-950/20 dark:to-indigo-950/20 hover:border-purple-500 transition-colors duration-200";
                                                            } else if (
                                                                isOnlyIntakeClosed
                                                            ) {
                                                                cardBgStyle =
                                                                    "border border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-500 transition-colors duration-200";
                                                            } else if (
                                                                isOnlyHidden
                                                            ) {
                                                                cardBgStyle =
                                                                    "border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/20 dark:bg-purple-950/10 hover:border-purple-500 transition-colors duration-200";
                                                            } else if (isFull) {
                                                                cardBgStyle =
                                                                    "bg-red-50/20 dark:bg-red-950/10 border border-red-200 dark:border-red-800 hover:border-red-400 transition-colors duration-200";
                                                            }

                                                            return (
                                                                <div
                                                                    key={
                                                                        room.id
                                                                    }
                                                                    className={`p-4 rounded-2xl flex flex-col justify-between min-h-[190px] relative ${cardBgStyle}`}
                                                                >
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
                                                                                            <span>
                                                                                                💬
                                                                                            </span>
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
                                                                                                🔧
                                                                                                На
                                                                                                ремонті
                                                                                            </span>
                                                                                        )}
                                                                                        {!isRepair &&
                                                                                            isBothClosedAndHidden && (
                                                                                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 text-white">
                                                                                                    🔒🙈
                                                                                                    Прихована
                                                                                                    та
                                                                                                    закрита
                                                                                                </span>
                                                                                            )}
                                                                                        {!isRepair &&
                                                                                            isOnlyIntakeClosed && (
                                                                                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200">
                                                                                                    🔒
                                                                                                    Набір
                                                                                                    закритий
                                                                                                </span>
                                                                                            )}
                                                                                        {!isRepair &&
                                                                                            isOnlyHidden && (
                                                                                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200">
                                                                                                    🙈
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
                                                                                    ⚙️
                                                                                </button>

                                                                                {/* Попап Налаштувань кімнати */}
                                                                                {isSettingsOpen && (
                                                                                    <div
                                                                                        onClick={(
                                                                                            e,
                                                                                        ) =>
                                                                                            e.stopPropagation()
                                                                                        }
                                                                                        className="absolute right-0 top-10 z-50 w-72 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl shadow-xl p-4 space-y-3.5 origin-top-right border-emerald-500/20"
                                                                                    >
                                                                                        {/* Popover Header */}
                                                                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-gray-700 pb-2.5">
                                                                                            <div className="flex items-center gap-1.5">
                                                                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                                                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                                                                                                    Налаштування
                                                                                                    №
                                                                                                    {
                                                                                                        room.room_number
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    setSettingsRoomId(
                                                                                                        null,
                                                                                                    )
                                                                                                }
                                                                                                className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xs font-bold transition-colors"
                                                                                            >
                                                                                                ✕
                                                                                            </button>
                                                                                        </div>

                                                                                        {/* Місткість (−/+) */}
                                                                                        <div className="space-y-1.5">
                                                                                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider block">
                                                                                                Місткість
                                                                                                (кількість
                                                                                                ліжок)
                                                                                            </span>
                                                                                            <div className="flex items-center justify-between bg-slate-50 dark:bg-gray-700/60 rounded-xl border border-slate-200 dark:border-gray-600 p-1">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() =>
                                                                                                        handleUpdateCapacity(
                                                                                                            room.id,
                                                                                                            room.max_capacity -
                                                                                                                1,
                                                                                                        )
                                                                                                    }
                                                                                                    disabled={
                                                                                                        room.max_capacity <=
                                                                                                            1 ||
                                                                                                        room.max_capacity <=
                                                                                                            approvedBookings.length
                                                                                                    }
                                                                                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-extrabold hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30"
                                                                                                >
                                                                                                    −
                                                                                                </button>
                                                                                                <span className="text-base font-extrabold text-gray-900 dark:text-white tabular-nums">
                                                                                                    {
                                                                                                        room.max_capacity
                                                                                                    }
                                                                                                </span>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() =>
                                                                                                        handleUpdateCapacity(
                                                                                                            room.id,
                                                                                                            room.max_capacity +
                                                                                                                1,
                                                                                                        )
                                                                                                    }
                                                                                                    disabled={
                                                                                                        room.max_capacity >=
                                                                                                        20
                                                                                                    }
                                                                                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-extrabold hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-30"
                                                                                                >
                                                                                                    +
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="border-t border-slate-100 dark:border-gray-700" />

                                                                                        {/* Toggles */}
                                                                                        <div className="space-y-2.5 text-xs">
                                                                                            {/* Toggle: Прийом */}
                                                                                            <div
                                                                                                onClick={() =>
                                                                                                    handleToggleIntake(
                                                                                                        room.id,
                                                                                                    )
                                                                                                }
                                                                                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-gray-700/50 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer select-none"
                                                                                            >
                                                                                                <span className="font-semibold text-gray-700 dark:text-gray-200">
                                                                                                    {Boolean(
                                                                                                        room.intake_closed,
                                                                                                    )
                                                                                                        ? "🔒 Прийом закритий"
                                                                                                        : "🔓 Прийом відкритий"}
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
                                                                                                onClick={() =>
                                                                                                    handleToggleVisibility(
                                                                                                        room.id,
                                                                                                    )
                                                                                                }
                                                                                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-gray-700/50 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer select-none"
                                                                                            >
                                                                                                <span className="font-semibold text-gray-700 dark:text-gray-200">
                                                                                                    {Boolean(
                                                                                                        room.hide_from_frontend,
                                                                                                    )
                                                                                                        ? "🙈 Прихована з сайту"
                                                                                                        : "👁️ Видима на сайті"}
                                                                                                </span>
                                                                                                <div
                                                                                                    className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-300 flex items-center ${Boolean(room.hide_from_frontend) ? "bg-amber-500" : "bg-emerald-500"}`}
                                                                                                >
                                                                                                    <span
                                                                                                        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${Boolean(room.hide_from_frontend) ? "translate-x-0" : "translate-x-4"}`}
                                                                                                    />
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Кнопка Ремонту */}
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setSettingsRoomId(
                                                                                                        null,
                                                                                                    );
                                                                                                    if (
                                                                                                        room.status ===
                                                                                                        "closed"
                                                                                                    ) {
                                                                                                        handleToggleStatus(
                                                                                                            room.id,
                                                                                                        );
                                                                                                    } else if (
                                                                                                        handleOpenCloseRoomModal
                                                                                                    ) {
                                                                                                        handleOpenCloseRoomModal(
                                                                                                            room,
                                                                                                        );
                                                                                                    } else {
                                                                                                        handleToggleStatus(
                                                                                                            room.id,
                                                                                                        );
                                                                                                    }
                                                                                                }}
                                                                                                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-colors duration-150 border border-red-200 dark:border-red-800"
                                                                                            >
                                                                                                <span>
                                                                                                    🔧
                                                                                                </span>
                                                                                                <span>
                                                                                                    {room.status ===
                                                                                                    "closed"
                                                                                                        ? "Відкрити з ремонту"
                                                                                                        : "Закрити на ремонт"}
                                                                                                </span>
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
        </div>
    );
}
