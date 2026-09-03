import React, { useState, useEffect, useRef } from "react";
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
import AnnouncementsTab from "@/Pages/Admin/Tabs/AnnouncementsTab";
import AccessLogsTab from "@/Pages/Admin/Tabs/AccessLogsTab";

import EditUserModal from "@/Pages/Admin/Modals/EditUserModal";
import ReallocateBookingModal from "@/Pages/Admin/Modals/ReallocateBookingModal";
import RejectBookingModal from "@/Pages/Admin/Modals/RejectBookingModal";
import ManualBookingModal from "@/Pages/Admin/Modals/ManualBookingModal";
import CloseRoomModal from "@/Pages/Admin/Modals/CloseRoomModal";
import VerifyOrderModal from "@/Components/VerifyOrderModal";
import { getEcho } from "@/echo";

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
    announcements = [],
    accessLogs = [],
    accessStats = {
        entries_today: 0,
        exits_today: 0,
        denied_today: 0,
        total_scans_today: 0,
    },
}) {
    const isSuperAdmin = auth?.user?.role === "admin";

    const [activeTab, setActiveTab] = useState("bookings");
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [manualBookingRoom, setManualBookingRoom] = useState(null);
    const [roomToCloseForRepair, setRoomToCloseForRepair] = useState(null);
    const [liveHighlightedRoomIds, setLiveHighlightedRoomIds] = useState([]);

    const isReloadingRef = useRef(false);

    // Фонова Real-time синхронізація для адмінки (безпечно та без перевантаження сесії)
    useEffect(() => {
        const safeReload = () => {
            if (document.visibilityState !== "visible" || isReloadingRef.current) return;
            isReloadingRef.current = true;
            router.reload({
                only: ["buildings", "pendingBookings", "stats", "allUsers", "tickets", "auditLogs", "announcements"],
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    isReloadingRef.current = false;
                },
            });
        };

        const interval = setInterval(safeReload, 20000);

        window.addEventListener("focus", safeReload);
        document.addEventListener("visibilitychange", safeReload);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", safeReload);
            document.removeEventListener("visibilitychange", safeReload);
        };
    }, []);

    // Слухаємо оновлення кімнат, заявок, звернень та оголошень через WebSockets у реальному часі
    useEffect(() => {
        const echo = getEcho();
        if (!echo) return;

        const roomsChannel = echo.channel("rooms");
        roomsChannel.listen(".RoomOccupancyUpdated", (e) => {
            if (e.roomId) {
                setLiveHighlightedRoomIds((prev) => [...prev, Number(e.roomId)]);
                setTimeout(() => {
                    setLiveHighlightedRoomIds((prev) => prev.filter((id) => id !== Number(e.roomId)));
                }, 4000);
            }

            // Фонова синхронізація адмінських даних без F5
            router.reload({
                only: ["buildings", "pendingBookings", "stats", "allUsers", "tickets", "auditLogs", "announcements"],
                preserveScroll: true,
                preserveState: true,
            });
        });

        const ticketsChannel = echo.channel("tickets");
        ticketsChannel.listen(".TicketUpdated", (e) => {
            if (e.action === "created") {
                window.dispatchEvent(
                    new CustomEvent("show-toast", {
                        detail: { message: e.message || "Нове звернення від студента!", duration: 4500 }
                    })
                );
            }
            router.reload({
                only: ["tickets", "stats", "auditLogs"],
                preserveScroll: true,
                preserveState: true,
            });
        });

        const announcementsChannel = echo.channel("announcements");
        announcementsChannel.listen(".AnnouncementUpdated", () => {
            router.reload({
                only: ["announcements", "auditLogs"],
                preserveScroll: true,
                preserveState: true,
            });
        });

        return () => {
            echo.leaveChannel("rooms");
            echo.leaveChannel("tickets");
            echo.leaveChannel("announcements");
        };
    }, []);

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

    const handleToggleAccessibility = (roomId) => {
        router.post(
            route("admin.rooms.toggle-accessibility", roomId),
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

    // Форма пакетної генерації студентів
    const userGenForm = useForm({
        count: 5,
        gender: "",
    });

    const handleGenerateUsers = (e) => {
        e.preventDefault();
        userGenForm.post(route("admin.users.generate"), {
            preserveScroll: true,
        });
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
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">Жіноча</span>;
        }
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Чоловіча</span>;
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

    const handleImpersonate = (userId, userName, role = "user") => {
        const roleLabel = role === "commandant" ? "комендантом" : "студентом";
        if (confirm(`Ви дійсно бажаєте увійти як ${roleLabel} "${userName}"?`)) {
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
                            <svg className="w-4 h-4 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
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
                {/* Компактні Адаптивні Вкладки Навігації з мобільним свайпом */}
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-gray-800/90 rounded-2xl border border-slate-200/70 dark:border-gray-700 shadow-2xs overflow-x-auto scrollbar-none no-scrollbar flex-nowrap snap-x">
                    <button
                        type="button"
                        onClick={() => setActiveTab("bookings")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 snap-start whitespace-nowrap ${
                            activeTab === "bookings"
                                ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-gray-700/50"
                        }`}
                    >
                        <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Заявки</span>
                        {pendingBookings.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                                {pendingBookings.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("map")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 snap-start whitespace-nowrap ${
                            activeTab === "map"
                                ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-gray-700/50"
                        }`}
                    >
                        <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span>Шахматка</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("users_gen")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 snap-start whitespace-nowrap ${
                            activeTab === "users_gen"
                                ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-gray-700/50"
                        }`}
                    >
                        <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Студенти</span>
                        <span className="text-[10px] text-slate-400">({allUsers.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("tickets")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 snap-start whitespace-nowrap ${
                            activeTab === "tickets"
                                ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-gray-700/50"
                        }`}
                    >
                        <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Ремонти</span>
                        {tickets.length > 0 && (
                            <span className="text-[10px] text-slate-400">({tickets.length})</span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("announcements")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 snap-start whitespace-nowrap ${
                            activeTab === "announcements"
                                ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-gray-700/50"
                        }`}
                    >
                        <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                        <span>Оголошення</span>
                        {announcements.length > 0 && (
                            <span className="text-[10px] text-slate-400">({announcements.length})</span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("access_logs")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 snap-start whitespace-nowrap ${
                            activeTab === "access_logs"
                                ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-gray-700/50"
                        }`}
                    >
                        <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <span>КПП / Відвідування</span>
                        {accessStats.total_scans_today > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-extrabold">
                                {accessStats.total_scans_today}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("logs")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 snap-start whitespace-nowrap ${
                            activeTab === "logs"
                                ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-gray-700/50"
                        }`}
                    >
                        <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Аудит</span>
                    </button>

                    {isSuperAdmin && (
                        <>
                            <button
                                type="button"
                                onClick={() => setActiveTab("commandants")}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 snap-start whitespace-nowrap ${
                                    activeTab === "commandants"
                                        ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                        : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-gray-700/50"
                                }`}
                            >
                                <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>Коменданти</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("academic_settings")}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 snap-start whitespace-nowrap ${
                                    activeTab === "academic_settings"
                                        ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                        : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-gray-700/50"
                                }`}
                            >
                                <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>Довідники</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("settings")}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 snap-start whitespace-nowrap ${
                                    activeTab === "settings"
                                        ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                                        : "text-slate-600 dark:text-gray-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-gray-700/50"
                                }`}
                            >
                                <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Налаштування</span>
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
                        handleToggleAccessibility={handleToggleAccessibility}
                        handleOpenManualBooking={handleOpenManualBooking}
                        handleOpenCloseRoomModal={handleOpenCloseRoomModal}
                        handleEvictStudent={handleEvictStudent}
                        handleOpenEditUserModal={handleOpenEditUserModal}
                        handleRequestReallocate={handleRequestReallocate}
                        BedIcon={BedIcon}
                        isSuperAdmin={isSuperAdmin}
                        liveHighlightedRoomIds={liveHighlightedRoomIds}
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
                        generatedUsers={generatedUsers}
                        userGenForm={userGenForm}
                        handleGenerateUsers={handleGenerateUsers}
                    />
                )}

                {activeTab === "tickets" && (
                    <TicketsTab
                        tickets={tickets}
                        handleResolveTicket={handleResolveTicket}
                        ticketProcessingId={ticketProcessingId}
                    />
                )}

                {activeTab === "announcements" && (
                    <AnnouncementsTab
                        announcements={announcements}
                        buildings={buildings}
                        isSuperAdmin={isSuperAdmin}
                        currentUser={auth.user}
                    />
                )}

                {activeTab === "access_logs" && (
                    <AccessLogsTab
                        accessLogs={accessLogs}
                        accessStats={accessStats}
                        buildings={buildings}
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
                        handleImpersonate={handleImpersonate}
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
                    availableRooms={buildings.flatMap((b) => b.rooms || []).map((r) => {
                        const genderObj = getRoomGender(r);
                        return {
                            id: r.id,
                            room_number: r.room_number,
                            floor: r.floor,
                            building_name: buildings.find((b) => b.rooms?.some((rm) => rm.id === r.id))?.name || "Корпус",
                            free_spots: r.max_capacity - (r.bookings?.filter((bk) => bk.status === "approved").length || 0),
                            max_capacity: r.max_capacity,
                            genderType: genderObj.type,
                            status: r.status,
                        };
                    })}
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
