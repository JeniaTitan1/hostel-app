import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";

import BedIcon from "@/Pages/Admin/Components/BedIcon";
import CommandPalette from "@/Pages/Admin/Components/CommandPalette";

import BookingsTab from "@/Pages/Admin/Tabs/BookingsTab";
import RoomMapTab from "@/Pages/Admin/Tabs/RoomMapTab";
import UsersTab from "@/Pages/Admin/Tabs/UsersTab";
import CommandantsTab from "@/Pages/Admin/Tabs/CommandantsTab";
import AuditLogsTab from "@/Pages/Admin/Tabs/AuditLogsTab";
import TicketsTab from "@/Pages/Admin/Tabs/TicketsTab";
import AcademicSettingsTab from "@/Pages/Admin/Tabs/AcademicSettingsTab";
import SystemSettingsTab from "@/Pages/Admin/Tabs/SystemSettingsTab";

import EditUserModal from "@/Pages/Admin/Modals/EditUserModal";
import ReallocateBookingModal from "@/Pages/Admin/Modals/ReallocateBookingModal";
import RejectBookingModal from "@/Pages/Admin/Modals/RejectBookingModal";
import ManualBookingModal from "@/Pages/Admin/Modals/ManualBookingModal";
import CloseRoomModal from "@/Pages/Admin/Modals/CloseRoomModal";
import VerifyOrderModal from "@/Components/VerifyOrderModal";

export default function Dashboard({
    auth,
    pendingBookings = [],
    buildings = [],
    users = [],
    tickets = [],
    auditLogs = [],
    allUsers = [],
    commandants = [],
    allBuildings = [],
    emailChangeRequests = [],
    generatedUsers = null,
    generatedCommandant = null,
    stats = null,
    specialties = [],
    courses = [],
    groups = [],
    systemSettings = {},
}) {
    const isSuperAdmin = auth?.user?.role === "admin";

    const [activeTab, setActiveTab] = useState("bookings");
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [manualBookingRoom, setManualBookingRoom] = useState(null);
    const [roomToCloseForRepair, setRoomToCloseForRepair] = useState(null);

    const handleOpenManualBooking = (room) => {
        setManualBookingRoom(room);
    };

    const handleOpenCloseRoomModal = (room) => {
        setRoomToCloseForRepair(room);
    };

    // States for search and filtering
    const [inboxSearch, setInboxSearch] = useState("");
    const [mapSearch, setMapSearch] = useState("");
    const [selectedBuildingFilter, setSelectedBuildingFilter] = useState("");
    const [genderFilter, setGenderFilter] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [userSpecialtyFilter, setUserSpecialtyFilter] = useState("");
    const [userCourseFilter, setUserCourseFilter] = useState("");
    const [userGroupFilter, setUserGroupFilter] = useState("");
    const [userGenderFilter, setUserGenderFilter] = useState("");
    const [userSortField, setUserSortField] = useState("name");
    const [userSortDirection, setUserSortDirection] = useState("asc");

    // Processing & Modals
    const [actionProcessingId, setActionProcessingId] = useState(null);
    const [ticketProcessingId, setTicketProcessingId] = useState(null);
    const [rejectingEmailReqId, setRejectingEmailReqId] = useState(null);
    const [emailRejectionReason, setEmailRejectionReason] = useState("");

    // Room management handlers
    const handleUpdateCapacity = (roomId, newCapacity) => {
        router.post(
            route("admin.rooms.update-capacity", roomId),
            { max_capacity: newCapacity },
            { preserveScroll: true }
        );
    };

    const handleToggleVisibility = (roomId) => {
        router.post(
            route("admin.rooms.toggle-visibility", roomId),
            {},
            { preserveScroll: true }
        );
    };

    const handleToggleIntake = (roomId) => {
        router.post(
            route("admin.rooms.toggle-intake", roomId),
            {},
            { preserveScroll: true }
        );
    };

    const handleToggleStatus = (roomId) => {
        router.post(
            route("admin.rooms.toggle-status", roomId),
            {},
            { preserveScroll: true }
        );
    };

    const handleEvictStudent = (booking) => {
        if (!booking) return;
        const studentName = booking.user?.name || "студента";
        if (confirm(`Ви дійсно бажаєте виселити ${studentName}?`)) {
            router.post(
                route("admin.bookings.delete", booking.id),
                {},
                { preserveScroll: true }
            );
        }
    };

    // Editing user modal
    const [editingUser, setEditingUser] = useState(null);
    const userEditForm = useForm({
        name: "",
        email: "",
        phone: "",
        telegram: "",
        gender: "male",
        specialty: "",
        course: 1,
        group: "",
        role: "user",
        building_id: "",
        password: "",
    });

    const handleOpenEditUserModal = (targetUser, roomInfo = null) => {
        if (!targetUser) return;
        const u = targetUser.user || targetUser;
        setEditingUser({
            ...u,
            roomNumber: roomInfo?.room_number || targetUser.room?.room_number || null,
            buildingName: roomInfo?.building_name || targetUser.room?.building?.name || null,
        });

        userEditForm.setData({
            name: u.name || "",
            email: u.email || "",
            phone: u.phone || "",
            telegram: u.telegram || "",
            gender: u.gender || "male",
            specialty: u.specialty || "",
            course: u.course || 1,
            group: u.group || "",
            role: u.role || "user",
            building_id: u.building_id || "",
            password: "",
        });
    };

    const handleUpdateUserSubmit = (e) => {
        e.preventDefault();
        if (!editingUser) return;
        userEditForm.post(route("admin.users.update", editingUser.id), {
            preserveScroll: true,
            onSuccess: () => setEditingUser(null),
        });
    };

    // Reallocate modal
    const [reallocateBookingData, setReallocateBookingData] = useState(null);
    const [reallocateCurrentRoom, setReallocateCurrentRoom] = useState(null);
    const [selectedReallocateRoomId, setSelectedReallocateRoomId] = useState("");
    const [reallocateReason, setReallocateReason] = useState("");
    const [allowMixedReallocate, setAllowMixedReallocate] = useState(false);

    const handleRequestReallocate = (booking, currentRoom) => {
        setReallocateBookingData(booking);
        setReallocateCurrentRoom(currentRoom);
        setSelectedReallocateRoomId("");
        setReallocateReason("");
        setAllowMixedReallocate(false);
    };

    const handleReallocateSubmit = (e) => {
        e.preventDefault();
        if (!reallocateBookingData || !selectedReallocateRoomId) return;

        router.post(
            route("admin.bookings.reallocate", reallocateBookingData.id),
            {
                new_room_id: selectedReallocateRoomId,
                reason: reallocateReason,
                force_mixed: allowMixedReallocate,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReallocateBookingData(null);
                    setReallocateCurrentRoom(null);
                },
            }
        );
    };

    // Reject booking modal
    const [rejectModalBookingId, setRejectModalBookingId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    const handleReject = (bookingId) => {
        setRejectModalBookingId(bookingId);
        setRejectReason("");
    };

    const submitReject = () => {
        if (!rejectModalBookingId) return;
        setActionProcessingId(rejectModalBookingId);
        router.post(
            route("admin.bookings.reject", rejectModalBookingId),
            { rejection_reason: rejectReason || null },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setActionProcessingId(null);
                    setRejectModalBookingId(null);
                },
                onError: () => setActionProcessingId(null),
            }
        );
    };

    const handleApprove = (bookingId) => {
        setActionProcessingId(bookingId);
        router.post(
            route("admin.bookings.approve", bookingId),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setActionProcessingId(null),
                onError: () => setActionProcessingId(null),
            }
        );
    };

    // Email change approval/rejection
    const handleApproveEmailChange = (id) => {
        router.post(route("admin.email-requests.approve", id), {}, { preserveScroll: true });
    };

    // Commandant management forms
    const commandantCreateForm = useForm({
        name: "",
        email: "",
        password: "",
        building_id: allBuildings[0]?.id || buildings[0]?.id || "",
    });

    const commandantGenForm = useForm({
        building_id: allBuildings[0]?.id || buildings[0]?.id || "",
    });

    const handleCreateCommandant = (e) => {
        e.preventDefault();
        commandantCreateForm.post(route("admin.commandants.store"), {
            preserveScroll: true,
            onSuccess: () => commandantCreateForm.reset("name", "email", "password"),
        });
    };

    const handleGenerateCommandant = (e) => {
        e.preventDefault();
        commandantGenForm.post(route("admin.commandants.generate"), { preserveScroll: true });
    };

    const handleDeleteCommandant = (id) => {
        if (confirm("Ви дійсно бажаєте видалити цього коменданта?")) {
            router.post(route("admin.commandants.delete", id), {}, { preserveScroll: true });
        }
    };

    // System settings form
    const systemSettingsForm = useForm({
        min_beds_per_room: systemSettings.min_beds_per_room || 1,
        max_beds_per_room: systemSettings.max_beds_per_room || 6,
        global_intake_closed: systemSettings.global_intake_closed || false,
    });

    const handleUpdateSystemSettings = (e) => {
        e.preventDefault();
        systemSettingsForm.post(route("admin.settings.update"), { preserveScroll: true });
    };

    // Sorting & badges
    const handleSort = (field) => {
        if (userSortField === field) {
            setUserSortDirection(userSortDirection === "asc" ? "desc" : "asc");
        } else {
            setUserSortField(field);
            setUserSortDirection("asc");
        }
    };

    const renderSortArrow = (field) => {
        if (userSortField !== field) return null;
        return userSortDirection === "asc" ? " ↑" : " ↓";
    };

    const renderGenderBadge = (gender) => {
        if (gender === "female") {
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">♀ Жіноча</span>;
        }
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">♂ Чоловіча</span>;
    };

    const getRoomGender = (room) => {
        const approved = room.bookings?.filter((b) => b.status === "approved") || [];
        if (approved.length === 0) return { type: "empty" };
        const genders = [...new Set(approved.map((b) => b.user?.gender).filter(Boolean))];
        if (genders.length > 1) return { type: "mixed" };
        return { type: genders[0] || "male" };
    };

    // Tickets
    const handleResolveTicket = (ticketId) => {
        setTicketProcessingId(ticketId);
        router.post(route("admin.tickets.resolve", ticketId), {}, {
            preserveScroll: true,
            onSuccess: () => setTicketProcessingId(null),
            onError: () => setTicketProcessingId(null),
        });
    };

    const handleClearLogs = () => {
        if (confirm("Ви дійсно бажаєте очистити журнал аудиту?")) {
            router.post(route("admin.audit-logs.clear"), {}, { preserveScroll: true });
        }
    };

    const handleImpersonate = (userId, userName) => {
        if (confirm(`Ви дійсно бажаєте увійти під акаунтом "${userName}"?`)) {
            router.post(route("admin.users.impersonate", userId));
        }
    };

    const [showVerifyModal, setShowVerifyModal] = useState(false);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">
                            Панель керування гуртожитком
                        </h2>
                        <p className="text-xs text-gray-400">
                            {isSuperAdmin ? "Головний Адміністратор" : "Комендант гуртожитку"}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setShowVerifyModal(true)}
                            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                            <span>🔍</span>
                            <span>Перевірити ордер</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCommandPaletteOpen(true)}
                            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-200 dark:border-gray-700 shadow-3xs"
                        >
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span>Швидкий пошук</span>
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-gray-900 rounded border border-slate-200 dark:border-gray-700">
                                Ctrl+K
                            </kbd>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Панель керування" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Компактні Адаптивні Вкладки Навігації */}
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-gray-800/90 rounded-2xl border border-slate-200/70 dark:border-gray-700 shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab("bookings")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === "bookings"
                                ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50"
                        }`}
                    >
                        <span>📬 Заявки</span>
                        {pendingBookings.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                                {pendingBookings.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("map")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === "map"
                                ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50"
                        }`}
                    >
                        <span>🗺️ Шахматка</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("users_gen")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === "users_gen"
                                ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50"
                        }`}
                    >
                        <span>👥 Студенти</span>
                        <span className="text-[10px] text-slate-400">({allUsers.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("tickets")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === "tickets"
                                ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50"
                        }`}
                    >
                        <span>🛠️ Ремонти</span>
                        {tickets.length > 0 && (
                            <span className="text-[10px] text-slate-400">({tickets.length})</span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("logs")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === "logs"
                                ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50"
                        }`}
                    >
                        <span>📜 Аудит</span>
                    </button>

                    {isSuperAdmin && (
                        <>
                            <button
                                type="button"
                                onClick={() => setActiveTab("commandants")}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    activeTab === "commandants"
                                        ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                        : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50"
                                }`}
                            >
                                <span>👮 Коменданти</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("academic_settings")}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    activeTab === "academic_settings"
                                        ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                        : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50"
                                }`}
                            >
                                <span>🎓 Довідники</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("settings")}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    activeTab === "settings"
                                        ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                        : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50"
                                }`}
                            >
                                <span>⚙️ Налаштування</span>
                            </button>
                        </>
                    )}
                </div>

                {/* Рендеринг Вкладок */}
                {activeTab === "bookings" && (
                    <BookingsTab
                        pendingBookings={pendingBookings}
                        inboxSearch={inboxSearch}
                        setInboxSearch={setInboxSearch}
                        handleApprove={handleApprove}
                        handleReject={handleReject}
                        actionProcessingId={actionProcessingId}
                        emailChangeRequests={emailChangeRequests}
                        handleApproveEmailChange={handleApproveEmailChange}
                        setRejectingEmailReqId={setRejectingEmailReqId}
                        setEmailRejectionReason={setEmailRejectionReason}
                        isSuperAdmin={isSuperAdmin}
                    />
                )}

                {activeTab === "map" && (
                    <RoomMapTab
                        buildings={buildings}
                        selectedBuildingFilter={selectedBuildingFilter}
                        setSelectedBuildingFilter={setSelectedBuildingFilter}
                        mapSearch={mapSearch}
                        setMapSearch={setMapSearch}
                        genderFilter={genderFilter}
                        setGenderFilter={setGenderFilter}
                        getRoomGender={getRoomGender}
                        handleUpdateCapacity={handleUpdateCapacity}
                        handleToggleStatus={handleToggleStatus}
                        handleToggleIntake={handleToggleIntake}
                        handleToggleVisibility={handleToggleVisibility}
                        handleOpenManualBooking={handleOpenManualBooking}
                        handleOpenCloseRoomModal={handleOpenCloseRoomModal}
                        handleEvictStudent={handleEvictStudent}
                        handleOpenEditUserModal={handleOpenEditUserModal}
                        handleRequestReallocate={handleRequestReallocate}
                        BedIcon={BedIcon}
                        isSuperAdmin={isSuperAdmin}
                    />
                )}

                {activeTab === "users_gen" && (
                    <UsersTab
                        allUsers={allUsers}
                        userSearch={userSearch}
                        setUserSearch={setUserSearch}
                        userSpecialtyFilter={userSpecialtyFilter}
                        setUserSpecialtyFilter={setUserSpecialtyFilter}
                        userCourseFilter={userCourseFilter}
                        setUserCourseFilter={setUserCourseFilter}
                        userGroupFilter={userGroupFilter}
                        setUserGroupFilter={setUserGroupFilter}
                        userGenderFilter={userGenderFilter}
                        setUserGenderFilter={setUserGenderFilter}
                        handleSort={handleSort}
                        renderSortArrow={renderSortArrow}
                        renderGenderBadge={renderGenderBadge}
                        handleOpenEditUserModal={handleOpenEditUserModal}
                        handleImpersonate={handleImpersonate}
                        isSuperAdmin={isSuperAdmin}
                    />
                )}

                {activeTab === "tickets" && (
                    <TicketsTab
                        tickets={tickets}
                        handleResolveTicket={handleResolveTicket}
                        ticketProcessingId={ticketProcessingId}
                    />
                )}

                {activeTab === "logs" && (
                    <AuditLogsTab
                        auditLogs={auditLogs}
                        handleClearLogs={handleClearLogs}
                    />
                )}

                {isSuperAdmin && activeTab === "commandants" && (
                    <CommandantsTab
                        commandants={commandants}
                        generatedCommandant={generatedCommandant}
                        commandantCreateForm={commandantCreateForm}
                        handleCreateCommandant={handleCreateCommandant}
                        commandantGenForm={commandantGenForm}
                        handleGenerateCommandant={handleGenerateCommandant}
                        handleDeleteCommandant={handleDeleteCommandant}
                        allBuildings={allBuildings}
                        buildings={buildings}
                        handleOpenEditUserModal={handleOpenEditUserModal}
                    />
                )}

                {isSuperAdmin && activeTab === "academic_settings" && (
                    <AcademicSettingsTab
                        specialties={specialties}
                        courses={courses}
                        groups={groups}
                    />
                )}

                {isSuperAdmin && activeTab === "settings" && (
                    <SystemSettingsTab
                        systemSettingsForm={systemSettingsForm}
                        handleUpdateSystemSettings={handleUpdateSystemSettings}
                    />
                )}

                {/* Modals */}
                <EditUserModal
                    editingUser={editingUser}
                    onClose={() => setEditingUser(null)}
                    userEditForm={userEditForm}
                    onSubmit={handleUpdateUserSubmit}
                />

                <ReallocateBookingModal
                    reallocateBookingData={reallocateBookingData}
                    reallocateCurrentRoom={reallocateCurrentRoom}
                    onClose={() => setReallocateBookingData(null)}
                    onSubmit={handleReallocateSubmit}
                    selectedReallocateRoomId={selectedReallocateRoomId}
                    setSelectedReallocateRoomId={setSelectedReallocateRoomId}
                    reallocateReason={reallocateReason}
                    setReallocateReason={setReallocateReason}
                    allowMixedReallocate={allowMixedReallocate}
                    setAllowMixedReallocate={setAllowMixedReallocate}
                    availableRooms={buildings.flatMap((b) => b.rooms || []).map((r) => ({
                        id: r.id,
                        room_number: r.room_number,
                        floor: r.floor,
                        building_name: buildings.find((b) => b.rooms?.some((rm) => rm.id === r.id))?.name || "Корпус",
                        free_spots: r.max_capacity - (r.bookings?.filter((bk) => bk.status === "approved").length || 0),
                        max_capacity: r.max_capacity,
                    }))}
                    getRoomGender={getRoomGender}
                    buildings={buildings}
                />

                <RejectBookingModal
                    rejectModalBookingId={rejectModalBookingId}
                    onClose={() => setRejectModalBookingId(null)}
                    rejectReason={rejectReason}
                    setRejectReason={setRejectReason}
                    onSubmit={submitReject}
                    isProcessing={actionProcessingId !== null}
                />

                <ManualBookingModal
                    room={manualBookingRoom}
                    onClose={() => setManualBookingRoom(null)}
                    users={users}
                    getRoomGender={getRoomGender}
                />

                <CloseRoomModal
                    room={roomToCloseForRepair}
                    onClose={() => setRoomToCloseForRepair(null)}
                />

                <CommandPalette
                    isOpen={isCommandPaletteOpen}
                    onClose={() => setIsCommandPaletteOpen(false)}
                    users={allUsers}
                    buildings={buildings}
                    onSelectUser={(u) => handleOpenEditUserModal(u)}
                    onSelectRoom={() => setActiveTab("map")}
                />

                <VerifyOrderModal
                    show={showVerifyModal}
                    onClose={() => setShowVerifyModal(false)}
                />
            </div>
        </AuthenticatedLayout>
    );
}
