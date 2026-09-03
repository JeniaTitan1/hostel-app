import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import { generateOrderPdf } from "@/Utils/OrderPdfGenerator";
import VerifyOrderModal from "@/Components/VerifyOrderModal";
import DigitalPassModal from "@/Components/DigitalPassModal";
import { getEcho } from "@/echo";

const BedIcon = ({ gender, isOccupied, name }) => {
    if (!isOccupied) {
        return (
            <svg className="w-5 h-5 text-slate-200 dark:text-gray-700 hover:text-slate-350 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} title="Вільне ліжко">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 4v16M2 8h20M22 4v16M2 18h20M6 8v5a3 3 0 003 3h6a3 3 0 003-3V8" />
            </svg>
        );
    }
    const colorClass = gender === 'female' 
        ? 'text-pink-500 dark:text-pink-400 drop-shadow-[0_2px_4px_rgba(244,63,94,0.15)]'
        : 'text-blue-500 dark:text-blue-400 drop-shadow-[0_2px_4px_rgba(59,130,246,0.15)]';
    return (
        <svg className={`w-5 h-5 ${colorClass} hover:scale-110 transition-all cursor-pointer`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} title={name}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 4v16M2 8h20M22 4v16M2 18h20M6 8v5a3 3 0 003 3h6a3 3 0 003-3V8" />
            <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <path d="M12 12h5a1 1 0 011 1v3h-7v-3a1 1 0 011-1z" fill="currentColor" stroke="none" />
        </svg>
    );
};

export default function Dashboard({
    auth,
    buildings = [],
    floors = [],
    rooms = [],
    selectedBuildingId,
    selectedFloor,
    userBooking,
    tickets = [],
    roommates = [],
    announcements = [],
}) {
    // Використовуємо локальний стан для керування завантаженням (processing)
    const [processing, setProcessing] = useState(false);
    const [announcementFilter, setAnnouncementFilter] = useState("all");
    const [liveRooms, setLiveRooms] = useState(rooms);
    const [liveTickets, setLiveTickets] = useState(tickets);
    const [highlightedRoomIds, setHighlightedRoomIds] = useState([]);

    useEffect(() => {
        setLiveTickets(tickets);
    }, [tickets]);

    useEffect(() => {
        setLiveRooms(rooms);
        if (selectedRoom) {
            const updated = rooms.find((r) => Number(r.id) === Number(selectedRoom.id));
            if (updated) {
                setSelectedRoom(updated);
            }
        }
    }, [rooms]);

    const isReloadingRef = useRef(false);

    // Фонова Real-time синхронізація (безпечно та без перевантаження сесії)
    useEffect(() => {
        const safeReload = () => {
            if (document.visibilityState !== "visible" || isReloadingRef.current) return;
            isReloadingRef.current = true;
            router.reload({
                only: ["rooms", "floors", "userBooking", "roommates", "tickets", "announcements"],
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
    }, [selectedBuildingId, selectedFloor]);

    // Підписка на WebSockets канали для оновлення карти в реальному часі (якщо доступно)
    useEffect(() => {
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.channel("rooms");
        channel.listen(".RoomOccupancyUpdated", (e) => {
            if (e.roomId) {
                setHighlightedRoomIds((prev) => [...prev, Number(e.roomId)]);
                setTimeout(() => {
                    setHighlightedRoomIds((prev) => prev.filter((id) => id !== Number(e.roomId)));
                }, 4000);
            }

            // Оптимістично оновлюємо кімнату в списку, якщо вона належить поточному поверху
            if (e.room && Number(e.room.building_id) === Number(selectedBuildingId) && Number(e.room.floor) === Number(selectedFloor)) {
                setLiveRooms((prev) => {
                    const idx = prev.findIndex((r) => Number(r.id) === Number(e.roomId));
                    if (idx >= 0) {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], ...e.room };
                        return copy;
                    }
                    return prev;
                });
            }

            // Оновлюємо вибрану кімнату, якщо вона зараз відкрита
            setSelectedRoom((current) => {
                if (current && Number(current.id) === Number(e.roomId) && e.room) {
                    return { ...current, ...e.room };
                }
                return current;
            });

            // Фонова синхронізація через Inertia partial reload
            router.reload({
                only: ["rooms", "floors", "userBooking", "roommates", "auth"],
                preserveScroll: true,
                preserveState: true,
            });
        });

        // Слухаємо оновлення звернень у реальному часі (якщо кран підтікає і статус вирішено)
        const ticketsChannel = echo.channel("tickets");
        ticketsChannel.listen(".TicketUpdated", (e) => {
            if (e.userId && auth.user && Number(e.userId) === Number(auth.user.id)) {
                setLiveTickets((prev) => {
                    const idx = prev.findIndex((t) => Number(t.id) === Number(e.ticketId));
                    if (idx >= 0) {
                        const copy = [...prev];
                        copy[idx] = {
                            ...copy[idx],
                            status: e.action === "resolved" ? "resolved" : copy[idx].status,
                            ...(e.ticket || {}),
                        };
                        return copy;
                    } else if (e.ticket && e.action === "created") {
                        return [e.ticket, ...prev];
                    }
                    return prev;
                });

                if (e.action === "resolved") {
                    window.dispatchEvent(
                        new CustomEvent("show-toast", {
                            detail: {
                                message: e.message || "Вашу заявку на обслуговування успішно виконано!",
                                duration: 4500,
                            },
                        })
                    );
                }

                router.reload({
                    only: ["tickets", "auth"],
                    preserveScroll: true,
                    preserveState: true,
                });
            }
        });

        // Персональний канал для прямих оновлень
        let userChannel = null;
        if (auth.user?.id) {
            userChannel = echo.channel(`user.${auth.user.id}`);
            userChannel.listen(".TicketUpdated", (e) => {
                setLiveTickets((prev) => {
                    const idx = prev.findIndex((t) => Number(t.id) === Number(e.ticketId));
                    if (idx >= 0) {
                        const copy = [...prev];
                        copy[idx] = {
                            ...copy[idx],
                            status: e.action === "resolved" ? "resolved" : copy[idx].status,
                            ...(e.ticket || {}),
                        };
                        return copy;
                    }
                    return prev;
                });

                router.reload({
                    only: ["tickets", "auth"],
                    preserveScroll: true,
                    preserveState: true,
                });
            });
        }

        // Синхронізація оголошень
        const announcementsChannel = echo.channel("announcements");
        announcementsChannel.listen(".AnnouncementUpdated", () => {
            router.reload({
                only: ["announcements"],
                preserveScroll: true,
                preserveState: true,
            });
        });

        return () => {
            echo.leaveChannel("rooms");
            echo.leaveChannel("tickets");
            echo.leaveChannel("announcements");
            if (auth.user?.id) {
                echo.leaveChannel(`user.${auth.user.id}`);
            }
        };
    }, [selectedBuildingId, selectedFloor, auth.user?.id]);

    // Сповіщення про нові події (відхилення, схвалення, переселення тощо)
    const seenNotificationIdsRef = useRef(new Set((auth.notifications || []).map((n) => n.id)));
    useEffect(() => {
        const currentNotifications = auth.notifications || [];
        for (const n of currentNotifications) {
            if (!seenNotificationIdsRef.current.has(n.id)) {
                seenNotificationIdsRef.current.add(n.id);
                window.dispatchEvent(
                    new CustomEvent("show-toast", {
                        detail: {
                            message: `${n.title}: ${n.message}`,
                            duration: 7000,
                        },
                    })
                );
            }
        }
    }, [auth.notifications]);

    useEffect(() => {
        if (auth.user?.reallocated_notification) {
            const msg = `Увага! Адміністратор перевів вас із ${auth.user.reallocated_from} до ${auth.user.reallocated_to}. Причина: ${auth.user.reallocated_reason}`;
            window.dispatchEvent(new CustomEvent('show-toast', { 
                detail: { 
                    message: msg, 
                    duration: 30000 
                } 
            }));
            
            // Dismiss notification in the database immediately
            router.post(route('profile.dismiss-reallocation'), {}, {
                preserveScroll: true
            });
        }
    }, [auth.user]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [genderFilter, setGenderFilter] = useState("");
    const [hideOppositeGender, setHideOppositeGender] = useState(false);

    // Форма для створення заявки на обслуговування
    const ticketForm = useForm({
        description: "",
    });

    const handleCreateTicket = (e) => {
        e.preventDefault();
        ticketForm.post(route("tickets.store"), {
            onSuccess: () => {
                ticketForm.reset();
            },
        });
    };

    // Функція вибору корпусу
    const handleSelectBuilding = (buildingId) => {
        setSelectedRoom(null);
        router.visit(route("dashboard", { building_id: buildingId, floor: 1 }), {
            preserveState: true,
            replace: true,
        });
    };

    // Функція вибору поверху
    const handleSelectFloor = (floorNum) => {
        setSelectedRoom(null);
        router.visit(
            route("dashboard", {
                building_id: selectedBuildingId,
                floor: floorNum,
            }),
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Функція відправки заявки на первинне бронювання та переселення
    const handleRequestRoom = (roomId) => {
        const isReallocation = userBooking && userBooking.status === "approved";
        setProcessing(true);

        // Завжди шлемо на один екшен. Бекенд сам розбереться.
        router.post(
            route("bookings.store"),
            {
                room_id: roomId,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedRoom(null);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showDigitalPass, setShowDigitalPass] = useState(false);
    const [showBuildingCatalog, setShowBuildingCatalog] = useState(false);

    // Генерація PDF-ордера на заселення
    const handleDownloadSlip = () => {
        if (!userBooking) return;
        generateOrderPdf({ user: auth?.user, booking: userBooking });
    };

    // Динамічне привітання за часом доби
    const getGreeting = (fullName) => {
        const hour = new Date().getHours();
        let greetingWord = "Доброго дня";
        if (hour >= 5 && hour < 12) greetingWord = "Доброго ранку";
        else if (hour >= 12 && hour < 17) greetingWord = "Доброго дня";
        else if (hour >= 17 && hour < 23) greetingWord = "Доброго вечора";
        else greetingWord = "Доброї ночі";

        const parts = (fullName || "").trim().split(/\s+/);
        const name = parts.length > 1 ? parts[1] : parts[0] || "студенте";
        return `${greetingWord}, ${name}!`;
    };

    // Живий годинник у Миколаєві
    const [mykolaivClock, setMykolaivClock] = useState(() => {
        const now = new Date();
        return {
            time: now.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }),
            date: now.toLocaleDateString("uk-UA", { weekday: "short", day: "numeric", month: "short" }),
            hour: now.getHours(),
        };
    });

    // Реальна жива погода в Миколаєві (Open-Meteo API з кешуванням)
    const [realWeather, setRealWeather] = useState(() => {
        if (typeof window !== "undefined") {
            const cached = sessionStorage.getItem("mykolaiv_real_weather");
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Date.now() - parsed.timestamp < 15 * 60 * 1000) {
                        return parsed.data;
                    }
                } catch (e) {}
            }
        }
        const hour = new Date().getHours();
        const isDay = hour >= 6 && hour < 20;
        return {
            temp: isDay ? "+23°C" : "+15°C",
            condition: isDay ? "Ясно, сонячно" : "Ясна ніч, зоряно",
            isDay,
            iconType: isDay ? "sun" : "moon",
            isLive: false,
        };
    });

    useEffect(() => {
        const clockTimer = setInterval(() => {
            const now = new Date();
            setMykolaivClock({
                time: now.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }),
                date: now.toLocaleDateString("uk-UA", { weekday: "short", day: "numeric", month: "short" }),
                hour: now.getHours(),
            });
        }, 1000);

        // Отримання справжніх метеоданих Миколаєва
        let isMounted = true;
        const fetchRealWeather = async () => {
            try {
                const res = await fetch(
                    "https://api.open-meteo.com/v1/forecast?latitude=46.975&longitude=31.9946&current=temperature_2m,relative_humidity_2m,weather_code,is_day&timezone=Europe%2FKyiv"
                );
                if (!res.ok) return;
                const json = await res.json();
                if (json?.current && isMounted) {
                    const tempNum = Math.round(json.current.temperature_2m);
                    const formattedTemp = (tempNum > 0 ? `+${tempNum}` : `${tempNum}`) + "°C";
                    const isDay = Boolean(json.current.is_day);
                    const code = Number(json.current.weather_code);

                    let condition = isDay ? "Ясно" : "Ясна ніч";
                    let iconType = isDay ? "sun" : "moon";

                    if (code === 0) {
                        condition = isDay ? "Ясно, безхмарно" : "Ясна ніч";
                        iconType = isDay ? "sun" : "moon";
                    } else if (code === 1 || code === 2) {
                        condition = "Малохмарно";
                        iconType = isDay ? "sun" : "moon";
                    } else if (code === 3) {
                        condition = "Хмарно";
                        iconType = "cloud";
                    } else if (code === 45 || code === 48) {
                        condition = "Туман";
                        iconType = "fog";
                    } else if (code >= 51 && code <= 67) {
                        condition = code >= 65 ? "Сильний дощ" : "Дощ";
                        iconType = "rain";
                    } else if (code >= 71 && code <= 77) {
                        condition = "Снігопад";
                        iconType = "snow";
                    } else if (code >= 80 && code <= 82) {
                        condition = "Злива";
                        iconType = "rain";
                    } else if (code >= 95) {
                        condition = "Гроза";
                        iconType = "thunder";
                    }

                    const weatherData = {
                        temp: formattedTemp,
                        condition,
                        isDay,
                        iconType,
                        isLive: true,
                    };

                    setRealWeather(weatherData);
                    sessionStorage.setItem(
                        "mykolaiv_real_weather",
                        JSON.stringify({ timestamp: Date.now(), data: weatherData })
                    );
                }
            } catch (e) {
                // тихо ігноруємо помилки
            }
        };

        fetchRealWeather();

        return () => {
            clearInterval(clockTimer);
            isMounted = false;
        };
    }, []);

    const getCurfewStatus = (hour) => {
        if (hour >= 0 && hour < 5) {
            return {
                badge: "діє (до 05:00)",
                color: "text-amber-300",
                dotColor: "bg-amber-400 animate-pulse",
            };
        }
        const hoursUntil = hour >= 5 ? 24 - hour : 0;
        return {
            badge: `00:00–05:00 (${hoursUntil} год)`,
            color: "text-emerald-200",
            dotColor: "bg-emerald-400",
        };
    };

    // Визначення кольору кімнати залежно від її заповненості
    
    // Визначення гендерного типу кімнати на основі її мешканців
    const getRoomGender = (room) => {
        const bookings = room.bookings || [];
        const approvedBookings = bookings.filter(
            (b) => b.status === "approved" || (b.status === "pending" && b.new_room_id !== null)
        );

        if (approvedBookings.length === 0) {
            return {
                type: "empty",
                label: "Вільна",
                icon: "",
                badgeBg: "bg-slate-50 dark:bg-gray-900/30 text-gray-500 border-slate-100 dark:border-gray-700"
            };
        }

        const genders = [...new Set(approvedBookings.map((b) => b.user?.gender).filter(Boolean))];

        if (genders.length === 1) {
            if (genders[0] === "male") {
                return {
                    type: "male",
                    label: "Чоловіча",
                    icon: "",
                    badgeBg: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800/40"
                };
            } else if (genders[0] === "female") {
                return {
                    type: "female",
                    label: "Жіноча",
                    icon: "",
                    badgeBg: "bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300 border-pink-100 dark:border-pink-800/40"
                };
            }
        }

        return {
            type: "mixed",
            label: "Змішана",
            icon: "",
            badgeBg: "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800/40"
        };
    };

    const getRoomStatusColor = (room) => {
        if (room.intake_closed) {
            return {
                bg: "bg-slate-150/50 dark:bg-gray-850/40 border-slate-200 dark:border-gray-700/60 shadow-3xs opacity-75",
                badge: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800/30",
                text: "Набір припинено",
                indicator: "bg-amber-500",
            };
        }

        const booked = room.approved_bookings_count || 0;
        const capacity = room.max_capacity;
        const freeSpots = capacity - booked;

        if (freeSpots === 0) {
            return {
                bg: "bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700",
                badge: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border-red-200/50 dark:border-red-800/30",
                text: "Усі місця зайняті",
                indicator: "bg-red-500",
            };
        } else if (freeSpots / capacity <= 0.5) {
            return {
                bg: "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700",
                badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200/50 dark:border-amber-800/30",
                text: `Мало місць (${freeSpots} вільне)`,
                indicator: "bg-amber-500",
            };
        } else {
            return {
                bg: "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700",
                badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-emerald-200/50 dark:border-emerald-800/30",
                text: `Вільно (${freeSpots} з ${capacity})`,
                indicator: "bg-emerald-500",
            };
        }
    };

    const currentBuilding = buildings.find((b) => Number(b.id) === Number(selectedBuildingId));
    const hasApprovedBooking = userBooking && userBooking.status === "approved";
    const hasPendingBooking = userBooking && userBooking.status === "pending";
    const hasRejectedBooking = userBooking && userBooking.status === "rejected";
    const hasPendingReallocation =
        userBooking && userBooking.new_room_id !== null;
    const isCurrentUsersRoom =
        userBooking &&
        selectedRoom &&
        Number(userBooking.room_id) === Number(selectedRoom.id) &&
        userBooking.status === "approved";
    
    const userGender = auth?.user?.gender;
    const oppositeGender =
        userGender === "male"
            ? "female"
            : userGender === "female"
            ? "male"
            : null;
    const rGenderObj = selectedRoom ? getRoomGender(selectedRoom) : null;
    const isGenderMismatch = userGender && rGenderObj && rGenderObj.type !== 'empty' && rGenderObj.type !== 'mixed' && rGenderObj.type !== userGender;

    const isTargetReallocationRoom =
        userBooking &&
        selectedRoom &&
        userBooking.new_room_id !== null &&
        Number(userBooking.new_room_id) === Number(selectedRoom.id);

    // Відображення дошки оголошень гуртожитку
    const renderAnnouncementsBoard = () => {
        if (!announcements || announcements.length === 0) return null;

        const filteredAnnouncements = announcements.filter(
            (a) => announcementFilter === "all" || a.priority === announcementFilter
        );

        return (
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-gray-700/80 pb-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/60">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                </svg>
                            </div>
                            <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white tracking-tight">
                                Дошка оголошень гуртожитку
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                {announcements.length}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Важливі новини, розклад санітарних днів та студентські події МНАУ
                        </p>
                    </div>

                    {/* Quick Filter Pills */}
                    <div className="flex items-center bg-slate-100 dark:bg-gray-900 p-1 rounded-xl gap-1 border border-slate-200/60 dark:border-gray-700/80 overflow-x-auto no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setAnnouncementFilter("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                                announcementFilter === "all"
                                    ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-transparent dark:border-gray-700"
                                    : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            Всі
                        </button>
                        <button
                            type="button"
                            onClick={() => setAnnouncementFilter("important")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                                announcementFilter === "important"
                                    ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-xs border border-transparent dark:border-gray-700"
                                    : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>Важливо</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setAnnouncementFilter("info")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                                announcementFilter === "info"
                                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs border border-transparent dark:border-gray-700"
                                    : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>Інформація</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setAnnouncementFilter("event")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                                announcementFilter === "event"
                                    ? "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-xs border border-transparent dark:border-gray-700"
                                    : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span>Заходи</span>
                        </button>
                    </div>
                </div>

                {/* Grid of Announcements */}
                {filteredAnnouncements.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center italic">
                        Немає оголошень у цій категорії
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredAnnouncements.map((a) => {
                            const isImportant = a.priority === "important";
                            const isEvent = a.priority === "event";

                            return (
                                <div
                                    key={a.id}
                                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                                        isImportant
                                            ? "bg-red-50/40 dark:bg-gray-800/90 border-red-200 dark:border-red-900/60 shadow-xs border-l-4 border-l-red-500"
                                            : isEvent
                                            ? "bg-purple-50/40 dark:bg-gray-800/90 border-purple-200 dark:border-purple-900/60 shadow-xs border-l-4 border-l-purple-500"
                                            : "bg-slate-50/60 dark:bg-gray-800/90 border-slate-200/80 dark:border-gray-700/90 shadow-xs border-l-4 border-l-blue-500"
                                    }`}
                                >
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {a.is_pinned && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                        </svg>
                                                        <span>Закріплено</span>
                                                    </span>
                                                )}
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                        isImportant
                                                            ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200/80 dark:border-red-800/60"
                                                            : isEvent
                                                            ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60"
                                                            : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60"
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isImportant ? "bg-red-500 animate-pulse" : isEvent ? "bg-purple-500" : "bg-blue-500"}`} />
                                                    <span>{isImportant ? "Важливо" : isEvent ? "Захід" : "Інформація"}</span>
                                                </span>
                                            </div>

                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-300 bg-white/80 dark:bg-gray-900/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-gray-700">
                                                <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                <span>{a.building_name}</span>
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-snug">
                                            {a.title}
                                        </h4>

                                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                            {a.content}
                                        </p>
                                    </div>

                                    <div className="pt-2.5 border-t border-slate-200/60 dark:border-gray-700/80 flex items-center justify-between text-[11px] text-gray-400">
                                        <span className="font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                                            <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold inline-flex items-center justify-center">
                                                {a.author_name?.charAt(0) || "М"}
                                            </span>
                                            <span>{a.author_role}: {a.author_name}</span>
                                        </span>
                                        <span>{a.created_at}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    // Відображення карток гуртожитків
    const renderBuildingCards = (title = null, subtitle = null) => {
        if (buildings.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 max-w-md mx-auto shadow-sm">
                    <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">Корпуси відсутні</h3>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {title && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 self-start sm:self-auto">
                            {buildings.length} {buildings.length === 1 ? "корпус" : "корпуси"} доступно
                        </span>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {buildings.map((building, idx) => (
                        <button
                            key={building.id}
                            onClick={() => handleSelectBuilding(building.id)}
                            title={building.name}
                            className="group flex flex-col justify-between items-start p-6 text-left w-full h-44 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 ease-out animate-card-fade-in"
                            style={{ animationDelay: `${idx * 60}ms` }}
                        >
                            <div className="w-full flex justify-between items-start">
                                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 border border-emerald-100 dark:border-emerald-900/60">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    Перейти →
                                </span>
                            </div>
                            <div className="w-full mt-4">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                    Гуртожиток
                                </span>
                                <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {building.name}
                                </h3>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth?.user}
            header={
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
                    <div className="flex flex-col gap-1">
                        <h2 className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">
                            {selectedBuildingId
                                ? currentBuilding?.name
                                : hasApprovedBooking
                                  ? "Особистий кабінет"
                                  : "Вибір гуртожитку"}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedBuildingId
                                ? "Виберіть поверх та кімнату для проживання"
                                : hasApprovedBooking
                                  ? `${userBooking.room?.building?.name || "Гуртожиток МНАУ"} • Поверх ${userBooking.room?.floor || 1} • Кімната №${userBooking.room?.room_number}`
                                  : "Оберіть корпус для перегляду вільних кімнат та онлайн-поселення"}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start md:self-center">
                        {!hasApprovedBooking && !hasPendingBooking && (
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 shadow-3xs animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                <span className="text-xs font-bold text-amber-800 leading-tight">
                                    На даний момент ви ніде не проживаєте. Будь
                                    ласка, оберіть кімнату та подайте заявку.
                                </span>
                            </div>
                        )}

                        {hasRejectedBooking && (
                            <div className="flex flex-col gap-1 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                    <span className="text-xs font-bold text-red-800">
                                        Заявку відхилено
                                    </span>
                                </div>
                                {userBooking.rejection_reason && (
                                    <p className="text-[11px] text-red-700 leading-tight max-w-xs">
                                        Причина: {userBooking.rejection_reason}
                                    </p>
                                )}
                                <p className="text-[10px] text-red-600 font-medium">
                                    Оберіть іншу кімнату та подайте нову заявку.
                                </p>
                            </div>
                        )}

                        {hasApprovedBooking && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowDigitalPass(true)}
                                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer"
                                    title="Відкрити цифрову перепустку"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                        />
                                    </svg>
                                    <span>Цифрова перепустка (QR)</span>
                                </button>

                                <button
                                    onClick={handleDownloadSlip}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                                    title="Завантажити ордер у форматі PDF"
                                >
                                    <svg
                                        className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <span>Ордер (PDF)</span>
                                </button>
                            </div>
                        )}

                        {userBooking && (
                            <div className="flex flex-col gap-1 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`w-2 h-2 rounded-full animate-pulse ${
                                            hasPendingReallocation
                                                ? "bg-indigo-500"
                                                : userBooking.status ===
                                                    "approved"
                                                  ? "bg-emerald-500"
                                                  : userBooking.status ===
                                                      "pending"
                                                    ? "bg-amber-500"
                                                    : "bg-red-500"
                                        }`}
                                    />
                                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                                        {hasPendingReallocation
                                            ? "Очікується переселення"
                                            : userBooking.status === "approved"
                                              ? "Затверджено"
                                              : userBooking.status === "pending"
                                                ? "Заявка на розгляді"
                                                : "Відхилено"}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">
                                    {userBooking.room?.building?.name} • Пв.{" "}
                                    {userBooking.room?.floor} • Км. №
                                    {userBooking.room?.room_number}
                                    {hasPendingReallocation && (
                                        <span className="text-indigo-600 font-semibold block mt-0.5">
                                            → Очікує переїзду в кімн. №
                                            {userBooking.new_room
                                                ?.room_number || "?"}
                                        </span>
                                    )}
                                </span>
                            </div>
                        )}

                        {selectedBuildingId && (
                            <button
                                onClick={() => router.visit(route("dashboard"))}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-100 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-slate-50/50 hover:text-gray-900 transition-colors h-fit"
                            >
                                <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                                Назад до корпусів
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Вибір кімнати" />

            <div className="py-8 min-h-[calc(100vh-73px)] bg-slate-50/80 dark:bg-[#070d19] relative transition-colors duration-300">
                {/* Текстурна сітка точок на всій сторінці для виразної глибини */}
                <div className="absolute inset-0 pointer-events-none bg-dot-pattern opacity-65 dark:opacity-35 z-0" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
                    {!selectedBuildingId && (
                        <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-950 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-emerald-950/20 border border-emerald-500/40 relative overflow-hidden">
                            {/* Глибокий живий фон «Aurora Gradient Mesh» */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                                <div className="absolute inset-0 bg-dot-pattern opacity-45" />
                                <div className="absolute -top-20 -left-16 w-[420px] h-[420px] bg-gradient-to-br from-emerald-400/40 via-teal-400/30 to-transparent rounded-full blur-[80px] animate-aurora-1" />
                                <div className="absolute -top-10 -right-20 w-[440px] h-[440px] bg-gradient-to-bl from-cyan-400/40 via-emerald-400/30 to-transparent rounded-full blur-[80px] animate-aurora-2" />
                                <div className="absolute -bottom-24 left-1/4 w-[480px] h-[480px] bg-gradient-to-tr from-teal-400/35 via-emerald-500/25 to-transparent rounded-full blur-[90px] animate-aurora-1" />
                            </div>

                            <div className="relative z-10 space-y-4">
                                {/* Верхній рядок: Бейдж сервісу + Скляний віджет погоди та часу */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-400/30 uppercase tracking-wider text-emerald-300 shadow-xs">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            Офіційний сервіс
                                        </span>
                                    </div>

                                    {/* Преміальний скляний віджет: погода + час у Миколаєві */}
                                    <div className="inline-flex items-center gap-3 bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/15 rounded-2xl px-3.5 py-2 shadow-lg shadow-black/10">
                                        {/* Справжня погода */}
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                                                {realWeather.iconType === "sun" && (
                                                    <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                                                    </svg>
                                                )}
                                                {realWeather.iconType === "moon" && (
                                                    <svg className="w-4 h-4 text-indigo-200" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                                    </svg>
                                                )}
                                                {realWeather.iconType === "cloud" && (
                                                    <svg className="w-4 h-4 text-sky-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
                                                    </svg>
                                                )}
                                                {realWeather.iconType === "rain" && (
                                                    <svg className="w-4 h-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15zM8 21l2-4m4 4l2-4" />
                                                    </svg>
                                                )}
                                                {realWeather.iconType === "thunder" && (
                                                    <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                )}
                                                {realWeather.iconType === "snow" && (
                                                    <svg className="w-4 h-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v18m9-9H3m15.364-6.364l-12.728 12.728m0-12.728l12.728 12.728" />
                                                    </svg>
                                                )}
                                                {realWeather.iconType === "fog" && (
                                                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="leading-tight">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-base font-black text-white tracking-tight">
                                                        {realWeather.temp}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider flex items-center gap-1">
                                                        Миколаїв
                                                        {realWeather.isLive && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Прямі дані метеостанції" />
                                                        )}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-emerald-100/80 font-medium block">
                                                    {realWeather.condition}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Розділювач */}
                                        <div className="w-px h-7 bg-white/20" />

                                        {/* Живий час + комендантська година */}
                                        <div className="leading-tight">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-base font-mono font-black text-white tracking-tight">
                                                    {mykolaivClock.time}
                                                </span>
                                                <span className="text-[10px] text-emerald-200/90 font-medium capitalize">
                                                    • {mykolaivClock.date}
                                                </span>
                                            </div>
                                            {(() => {
                                                const curfew = getCurfewStatus(mykolaivClock.hour);
                                                return (
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${curfew.dotColor}`} />
                                                        <span className={`text-[10px] font-semibold ${curfew.color}`}>
                                                            Коменд. {curfew.badge}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight max-w-2xl bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-teal-200">
                                        {getGreeting(auth?.user?.name)}
                                    </h1>
                                    <p className="text-xs font-semibold text-emerald-300/90 uppercase tracking-wider mt-1">
                                        Миколаївський національний аграрний університет
                                    </p>
                                </div>

                                <p className="text-emerald-100/90 text-sm max-w-xl leading-relaxed">
                                    {hasApprovedBooking
                                        ? `Ваше активне поселення: ${userBooking.room?.building?.name}, поверх ${userBooking.room?.floor}, кімната №${userBooking.room?.room_number}.`
                                        : "Система онлайн-бронювання місць та поселення студентів у гуртожитки МНАУ. Оберіть корпус нижче, щоб переглянути вільні кімнати та подати заявку."}
                                </p>


                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
                                <svg
                                    className="w-64 h-64"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                                    <path
                                        d="M22 9L12 3v12l10-5.45z"
                                        opacity=".15"
                                    />
                                    <path d="M4.2 12.06L12 16.3l7.8-4.24V14.3l-7.8 4.25-7.8-4.25v-2.24z" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {!selectedBuildingId && (
                        <>
                            {/* Сценарій 1: Студент ВЖЕ ПОСЕЛЕНИЙ (Осередок студента) */}
                            {hasApprovedBooking ? (
                                <div className="space-y-8">
                                    {/* Головна сітка: 2/3 (Кімната, сусіди, оголошення) та 1/3 (Перепустка, підтримка) */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                        {/* Ліва частина (2/3): Моя кімната + Дошка оголошень */}
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Картка кімнати та сусідів */}
                                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 space-y-5">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-gray-700/80 pb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
                                                                Кімната №{userBooking.room?.room_number}
                                                            </h3>
                                                            {Boolean(userBooking.room?.is_accessible) && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                                    Інклюзивна
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            {userBooking.room?.building?.name} • Поверх {userBooking.room?.floor}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                                            {roommates.length + 1} з {userBooking.room?.max_capacity || 4} місць зайнято
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowBuildingCatalog(!showBuildingCatalog)}
                                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <span>{showBuildingCatalog ? "Згорнути вибір кімнати" : "Змінити кімнату"}</span>
                                                            <svg className={`w-3.5 h-3.5 transform transition-transform duration-200 ${showBuildingCatalog ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Сусіди по кімнаті */}
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                                                        Мешканці кімнати
                                                    </h4>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                                        {/* Картка користувача */}
                                                        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                                                                {auth?.user?.name?.charAt(0)?.toUpperCase() || "Я"}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                                                        {auth?.user?.name}
                                                                    </span>
                                                                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded-md">
                                                                        Ви
                                                                    </span>
                                                                </div>
                                                                <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate block">
                                                                    {auth?.user?.email}
                                                                </span>
                                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                                                                    Ордер №{userBooking.order_number || userBooking.id}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Картки сусідів */}
                                                        {roommates.map((r, index) => (
                                                            <div
                                                                key={index}
                                                                className="p-3.5 rounded-xl border border-slate-100 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/50 flex items-start gap-3"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm flex items-center justify-center shrink-0">
                                                                    {r.name?.charAt(0)?.toUpperCase() || "С"}
                                                                </div>
                                                                <div className="min-w-0 flex-1 space-y-1">
                                                                    <h5 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                                                        {r.name}
                                                                    </h5>
                                                                    <p className="text-[11px] text-gray-400 truncate">
                                                                        {r.email}
                                                                    </p>
                                                                    <div className="flex items-center gap-3 pt-1">
                                                                        {r.telegram && (
                                                                            <a
                                                                                href={`https://t.me/${r.telegram.replace("@", "")}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                                                                            >
                                                                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                                                                                </svg>
                                                                                <span>Telegram</span>
                                                                            </a>
                                                                        )}
                                                                        {r.phone && (
                                                                            <a
                                                                                href={`tel:${r.phone}`}
                                                                                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                                                            >
                                                                                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                                </svg>
                                                                                <span>{r.phone}</span>
                                                                            </a>
                                                                        )}
                                                                        {!r.telegram && !r.phone && (
                                                                            <span className="text-[11px] text-gray-400 italic">Контакти не вказані</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Вільні місця в кімнаті */}
                                                        {Array.from({ length: Math.max(0, (userBooking.room?.max_capacity || 4) - (roommates.length + 1)) }).map((_, idx) => (
                                                            <div
                                                                key={`free-${idx}`}
                                                                className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-gray-700 bg-slate-50/40 dark:bg-gray-800/20 flex items-center gap-3"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl border border-dashed border-slate-300 dark:border-gray-600 flex items-center justify-center text-gray-400 font-bold shrink-0">
                                                                    +
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 block">
                                                                        Вільне ліжко-місце
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400 block">
                                                                        Очікує поселення студента
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Дошка оголошень гуртожитку (прямо під кімнатою) */}
                                            {renderAnnouncementsBoard()}
                                        </div>

                                        {/* Права частина (1/3): Техпідтримка та пам'ятка студента */}
                                        <div className="space-y-6">
                                            {/* Технічна підтримка / Ремонт */}
                                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-5 space-y-4">
                                                <div className="border-b border-slate-100 dark:border-gray-700 pb-3">
                                                    <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">Технічна підтримка</h3>
                                                    <p className="text-xs text-gray-400">Повідомити про несправність або поломку</p>
                                                </div>

                                                <form onSubmit={handleCreateTicket} className="space-y-3">
                                                    <textarea
                                                        rows="2"
                                                        placeholder="Опишіть проблему (напр. протікає кран, зламався замок)..."
                                                        value={ticketForm.data.description}
                                                        onChange={(e) => ticketForm.setData("description", e.target.value)}
                                                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-700 p-2.5 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                                        required
                                                        disabled={ticketForm.processing}
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={ticketForm.processing}
                                                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                                                    >
                                                        {ticketForm.processing ? "Надсилання..." : "Надіслати заявку"}
                                                    </button>
                                                </form>

                                                {/* Список заявок */}
                                                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-gray-700 max-h-48 overflow-y-auto">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                                        Мої заявки ({liveTickets.length})
                                                    </h4>
                                                    {liveTickets.length === 0 ? (
                                                        <p className="text-[10px] text-gray-400 italic">Немає поданих заявок</p>
                                                    ) : (
                                                        liveTickets.map((t) => (
                                                            <div
                                                                key={t.id}
                                                                className="p-2.5 rounded-xl border border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/30 flex items-start justify-between gap-2 text-xs"
                                                            >
                                                                <div className="space-y-1">
                                                                    <p className="text-gray-700 dark:text-gray-300 leading-tight text-[11px] line-clamp-2">
                                                                        {t.description}
                                                                    </p>
                                                                    <span className="text-[9px] text-gray-400 block">
                                                                        {new Date(t.created_at).toLocaleDateString("uk-UA")}
                                                                    </span>
                                                                </div>
                                                                <span
                                                                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                                                                        t.status === "resolved"
                                                                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30"
                                                                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30"
                                                                    }`}
                                                                >
                                                                    {t.status === "resolved" ? "Виконано" : "В процесі"}
                                                                </span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Пам'ятка мешканця гуртожитку */}
                                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm p-5 space-y-3">
                                                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                                    Корисна інформація
                                                </h4>
                                                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-gray-700/60">
                                                        <span className="text-gray-500">Комендантська година:</span>
                                                        <span className="font-semibold text-gray-900 dark:text-white font-mono">00:00 – 05:00</span>
                                                    </div>
                                                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-gray-700/60">
                                                        <span className="text-gray-500">Адміністрація (комендант):</span>
                                                        <span className="font-semibold text-gray-900 dark:text-white">08:30 – 17:00</span>
                                                    </div>
                                                    <div className="flex items-center justify-between py-1">
                                                        <span className="text-gray-500">Черговий (вахта):</span>
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Цілодобово</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Розділ зміни кімнати / Каталог гуртожитків (з'являється лише якщо студент натиснув "Змінити кімнату") */}
                                    {showBuildingCatalog && (
                                        <div id="building-catalog-section" className="bg-white dark:bg-gray-800 border border-emerald-500/30 rounded-2xl shadow-sm p-6 space-y-4 animate-in fade-in duration-200">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-gray-700 pb-4">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-base tracking-tight flex items-center gap-2">
                                                        <span>Оберіть гуртожиток для переселення</span>
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                            {buildings.length} корпуси
                                                        </span>
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        Оберіть корпус, щоб переглянути вільні поверхи, кімнати та подати заявку на переїзд.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowBuildingCatalog(false)}
                                                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                                                >
                                                    <span>Згорнути</span>
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="pt-2">
                                                {renderBuildingCards(null, null)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Сценарій 2: Новий студент або ще не поселений */
                                <div className="space-y-8">
                                    {/* 1. Вибір гуртожитку на першому плані */}
                                    {renderBuildingCards(
                                        "Оберіть гуртожиток для проживання",
                                        "Доступні корпуси студентського містечка МНАУ. Оберіть корпус, щоб переглянути вільні кімнати та подати заявку."
                                    )}

                                    {/* 2. Дошка оголошень для нових студентів */}
                                    {renderAnnouncementsBoard()}
                                </div>
                            )}
                        </>
                    )}

                    {selectedBuildingId && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 p-4 rounded-xl shadow-sm space-y-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                    Поверх
                                </span>
                                {floors.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        У цьому корпусі поки що немає створених
                                        поверхів.
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {floors.map((floor) => (
                                            <button
                                                key={floor}
                                                onClick={() =>
                                                    handleSelectFloor(floor)
                                                }
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-150 ${
                                                    Number(selectedFloor) === Number(floor)
                                                        ? "bg-gray-900 dark:bg-emerald-600 border-gray-900 dark:border-emerald-600 text-white shadow-sm"
                                                        : "bg-white dark:bg-gray-700 border-slate-100 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-slate-50/50 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white"
                                                }`}
                                            >
                                                Поверх {floor}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {userGender && (userGender === 'male' || userGender === 'female') && (
                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-gray-700/50 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={hideOppositeGender}
                                                onChange={(e) => setHideOppositeGender(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 dark:bg-gray-700"
                                            />
                                            <span className="text-xs text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors select-none">
                                                Приховати кімнати для протилежної статі ({userGender === 'male' ? 'жіночі' : 'чоловічі'})
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            {selectedFloor &&
                                (rooms.length === 0 ? (
                                    <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 p-12 text-center rounded-xl shadow-sm">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Немає кімнат на цьому поверсі.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {liveRooms
                                                .filter((room) => {
                                                    if (genderFilter) {
                                                        const rg = getRoomGender(room);
                                                        if (genderFilter === 'empty' && rg.type !== 'empty') return false;
                                                        if (genderFilter !== 'empty' && rg.type !== genderFilter) return false;
                                                    }
                                                    if (hideOppositeGender && oppositeGender) {
                                                        const rg = getRoomGender(room);
                                                        if (rg.type === oppositeGender) return false;
                                                    }
                                                    return true;
                                                })
                                                .map((room) => {
                                                const isClosed =
                                                    room.status === "closed";
                                                const isHighlighted = highlightedRoomIds.includes(Number(room.id));
                                                const styles = isClosed
                                                    ? {
                                                          bg: "bg-gray-100/80 border-slate-100 cursor-not-allowed opacity-60",
                                                          badge: "bg-gray-200 text-gray-500 border-slate-100",
                                                          text: "Зачинена на обслуговування",
                                                          indicator:
                                                              "bg-gray-400",
                                                      }
                                                    : getRoomStatusColor(room);

                                                const isSelected =
                                                    selectedRoom &&
                                                    Number(selectedRoom.id) ===
                                                    Number(room.id);

                                                // Перевірка: чи це кімната поточного юзера (статус броні approved)
                                                const isMyRoom =
                                                    userBooking?.status ===
                                                        "approved" &&
                                                    Number(userBooking?.room_id) ===
                                                        Number(room.id);

                                                return (
                                                    <button
                                                        key={room.id}
                                                        onClick={() => {
                                                            if (!isClosed) {
                                                                setSelectedRoom(room);
                                                                setMixedRoomConfirm(null);
                                                            }
                                                        }}
                                                        disabled={isClosed}
                                                        className={`group relative p-5 text-left border rounded-xl shadow-sm flex flex-col justify-between h-36 transition-all duration-200 ${styles.bg} ${
                                                            isSelected &&
                                                            !isClosed
                                                                ? "ring-2 ring-gray-900 ring-offset-2"
                                                                : ""
                                                        } ${isMyRoom ? "ring-2 ring-indigo-500 ring-offset-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30" : ""} ${
                                                            isHighlighted ? "ring-4 ring-emerald-400 dark:ring-emerald-500 scale-[1.02] shadow-lg shadow-emerald-500/25 transition-all duration-300 animate-pulse" : ""
                                                        }`}
                                                    >
                                                        {/* --- БЕЙДЖИК "Оновлено live" --- */}
                                                        {isHighlighted && (
                                                            <span className="absolute -top-2.5 -left-2 bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md border border-white z-20 animate-bounce flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                                                Оновлено live
                                                            </span>
                                                        )}

                                                        {/* --- БЕЙДЖИК "Моя кімната" --- */}
                                                        {isMyRoom && (
                                                            <span className="absolute -top-2.5 -right-2.5 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border-2 border-white z-10">
                                                                Моя кімната
                                                            </span>
                                                        )}

                                                        <div className="w-full flex justify-between items-start">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`w-2 h-2 rounded-full ${styles.indicator}`} />
                                                                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                                                                        Кімната №{room.room_number}
                                                                    </span>
                                                                </div>
                                                                {isClosed && (
                                                                     <div className="mt-1 text-xs">
                                                                         <p className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                                                                             <span className="flex items-center gap-1.5">
                                                                                 <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                 </svg>
                                                                                 {room.closure_reason || "Технічне обслуговування"}
                                                                             </span>
                                                                         </p>
                                                                         {room.closure_duration && (
                                                                             <p className="text-[10px] text-gray-400 font-mono">
                                                                                 Термін: {room.closure_duration}
                                                                             </p>
                                                                         )}
                                                                     </div>
                                                                 )}
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <div className="flex items-center gap-1 flex-wrap justify-end">
                                                                    {isClosed ? (
                                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200">
                                                                            На ремонті
                                                                        </span>
                                                                    ) : (
                                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles.badge}`}>
                                                                            {`${room.max_capacity} місна`}
                                                                        </span>
                                                                    )}
                                                                    {Boolean(room.intake_closed) && !isClosed && (
                                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200">
                                                                            Закрита
                                                                        </span>
                                                                    )}
                                                                    {Boolean(room.is_accessible) && (
                                                                        <span
                                                                            className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                                                                            title="Кімната обладнана для осіб з інвалідністю / обмеженими фізичними можливостями"
                                                                        >
                                                                            <svg className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth={2} />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5l3 3m-7-2a4 4 0 108 0" />
                                                                            </svg>
                                                                            <span>Інклюзивна</span>
                                                                        </span>
                                                                    )}
                                                                    {!isClosed && (
                                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getRoomGender(room).badgeBg}`}>
                                                                            {getRoomGender(room).label}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Слот-візуалізатор ліжок */}
                                                        {!isClosed && (
                                                            <div className="flex gap-1.5 mt-3 flex-wrap">
                                                                {Array.from({ length: room.max_capacity }).map((_, idx) => {
                                                                    const rBookings = room.bookings || [];
                                                                    const appBookings = rBookings.filter(b => b.status === 'approved' || (b.status === 'pending' && b.new_room_id !== null));
                                                                    const isOccupied = idx < appBookings.length;
                                                                    const uGender = isOccupied ? appBookings[idx]?.user?.gender : null;
                                                                    return (
                                                                        <BedIcon
                                                                            key={idx}
                                                                            gender={uGender}
                                                                            isOccupied={isOccupied}
                                                                            name={isOccupied ? appBookings[idx]?.user?.name : 'Вільне ліжко'}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        <div className="w-full flex justify-between items-end mt-2">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                                    Статус
                                                                    заповненості
                                                                </span>
                                                                <span className="text-xs font-semibold text-gray-600">
                                                                    {
                                                                        styles.text
                                                                    }
                                                                </span>
                                                            </div>
                                                            <span className="text-xs font-bold text-gray-400 group-hover:text-gray-900 transition-colors">
                                                                Переглянути →
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Десктопний сайдбар обраної кімнати */}
                                        <div className="hidden md:block bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 p-6 rounded-xl shadow-sm sticky top-24 space-y-6">
                                            {selectedRoom ? (
                                                <>
                                                    <div className="border-b border-slate-100/80 dark:border-gray-700 pb-4 space-y-1.5">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                                                    Обраний об'єкт
                                                                </span>
                                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                                    Кімната №{selectedRoom.room_number}
                                                                </h3>
                                                            </div>
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1 ${getRoomGender(selectedRoom).badgeBg}`}>
                                                                {getRoomGender(selectedRoom).label}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Поверх {selectedRoom.floor} • Корпус {currentBuilding?.name}
                                                        </p>

                                                        {Boolean(selectedRoom.is_accessible) && (
                                                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 mt-2">
                                                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth={2} />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5l3 3m-7-2a4 4 0 108 0" />
                                                                </svg>
                                                                <div className="text-xs leading-tight">
                                                                    <span className="font-bold block">Інклюзивна кімната</span>
                                                                    <span className="text-[10px] text-blue-700/80 dark:text-blue-300/80 block">
                                                                        Обладнана для осіб з обмеженими фізичними можливостями
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center text-sm border-b border-slate-100/80 pb-2">
                                                            <span className="text-gray-500">
                                                                Загальна
                                                                місткість:
                                                            </span>
                                                            <span className="font-bold text-gray-900 dark:text-white">
                                                                {
                                                                    selectedRoom.max_capacity
                                                                }{" "}
                                                                місць
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm border-b border-slate-100/80 pb-2">
                                                            <span className="text-gray-500">
                                                                Вже заселено:
                                                            </span>
                                                            <span className="font-bold text-gray-900 dark:text-white">
                                                                {selectedRoom.approved_bookings_count ||
                                                                    0}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-500">
                                                                Вільних місць:
                                                            </span>
                                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                                {selectedRoom.max_capacity -
                                                                    (selectedRoom.approved_bookings_count ||
                                                                        0)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {isCurrentUsersRoom ? (
                                                        <div className="space-y-3">
                                                            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-center">
                                                                <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                                                                    Ви вже
                                                                    проживаєте в
                                                                    цій кімнаті.
                                                                    Переселення
                                                                    сюди
                                                                    неможливе.
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => setShowDigitalPass(true)}
                                                                className="w-full flex items-center justify-center gap-2 text-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm active:scale-95"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                                </svg>
                                                                <span>Електронна перепустка (QR)</span>
                                                            </button>
                                                        </div>
                                                    ) : isTargetReallocationRoom ? (
                                                        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 text-center">
                                                            <p className="text-xs text-indigo-800 dark:text-indigo-200 font-medium">
                                                                Ви вже подали
                                                                запит на
                                                                переселення
                                                                сюди. Очікуйте
                                                                рішення
                                                                адміністратора.
                                                            </p>
                                                        </div>
                                                    ) : hasPendingReallocation ? (
                                                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-center">
                                                            <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                                                                Ви не можете
                                                                подати нову
                                                                заявку, поки ваш
                                                                попередній запит
                                                                на переселення
                                                                розглядається.
                                                            </p>
                                                        </div>
                                                    ) : hasPendingBooking ? (
                                                        <div className="bg-slate-50/50 dark:bg-gray-800/40 border border-slate-100 dark:border-gray-700 rounded-lg p-3 text-center">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Ви не можете
                                                                подати заявку,
                                                                поки ваша перша
                                                                заявка
                                                                знаходиться на
                                                                розгляді.
                                                            </p>
                                                        </div>
                                                     ) : selectedRoom.intake_closed ? (
                                                         <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-center">
                                                             <p className="text-xs text-amber-600 dark:text-amber-300 font-medium">
                                                                 Заселення неможливе. Прийом нових мешканців у цю кімнату призупинено адміністратором.
                                                             </p>
                                                         </div>
                                                     ) : selectedRoom.max_capacity -
                                                          (selectedRoom.approved_bookings_count ||
                                                              0) ===
                                                      0 ? (
                                                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                                                            <p className="text-xs text-red-600 dark:text-red-300 font-medium">
                                                                Заселення
                                                                неможливе. У
                                                                кімнаті немає
                                                                вільних місць.
                                                            </p>
                                                        </div>
                                                    ) : isGenderMismatch ? (
                                                         <div className="space-y-2">
                                                             <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                                                 <div className="flex items-start gap-2">
                                                                      <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                      </svg>
                                                                     <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                                                                         Кімната призначена для {rGenderObj.type === 'male' ? 'чоловіків' : 'жінок'}. Подання заявки створить запит на змішану кімнату.
                                                                     </p>
                                                                 </div>
                                                             </div>

                                                             <button
                                                                 onClick={() =>
                                                                     handleRequestRoom(
                                                                         selectedRoom.id,
                                                                     )
                                                                 }
                                                                 disabled={
                                                                     processing
                                                                 }
                                                                 className="w-full text-center bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                             >
                                                                 {processing
                                                                     ? "Надсилання..."
                                                                     : hasApprovedBooking
                                                                       ? "Подати заявку на переселення"
                                                                       : "Подати заявку на проживання"}
                                                             </button>
                                                         </div>
                                                     ) : (
                                                        <button
                                                            onClick={() =>
                                                                handleRequestRoom(
                                                                    selectedRoom.id,
                                                                )
                                                            }
                                                            disabled={
                                                                processing
                                                            }
                                                            className="w-full text-center bg-gray-900 dark:bg-emerald-600 hover:bg-gray-800 dark:hover:bg-emerald-500 disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-offset-gray-850"
                                                        >
                                                            {processing
                                                                ? "Надсилання..."
                                                                : hasApprovedBooking
                                                                  ? "Подати заявку на переселення"
                                                                  : "Подати заявку на проживання"}
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <svg
                                                        className="w-8 h-8 text-gray-300 mx-auto mb-2"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.5}
                                                            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                                                        />
                                                    </svg>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Виберіть кімнату з сітки
                                                        ліворуч, щоб переглянути
                                                        деталі та подати заявку.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Мобільний Bottom Sheet Обраної Кімнати */}
                                        {selectedRoom && (
                                            <div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-gray-700 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] rounded-t-3xl p-5 space-y-3 animate-fade-in max-h-[85vh] overflow-y-auto">
                                                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-1" />
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                                                            №
                                                        </div>
                                                        <div>
                                                            <h3 className="font-extrabold text-base text-gray-950 dark:text-white">
                                                                Кімната №{selectedRoom.room_number}
                                                            </h3>
                                                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                                Пв. {selectedRoom.floor} • {currentBuilding?.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getRoomGender(selectedRoom).badgeBg}`}>
                                                            {getRoomGender(selectedRoom).label}
                                                        </span>
                                                        <button
                                                            onClick={() => setSelectedRoom(null)}
                                                            className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                                                            aria-label="Закрити"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-gray-800 p-2.5 rounded-2xl border border-slate-100 dark:border-gray-700 text-center">
                                                    <div>
                                                        <span className="text-[9px] text-gray-400 uppercase font-bold block">Місць</span>
                                                        <span className="text-xs font-bold text-gray-800 dark:text-white">{selectedRoom.max_capacity}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] text-gray-400 uppercase font-bold block">Заселено</span>
                                                        <span className="text-xs font-bold text-gray-800 dark:text-white">{selectedRoom.approved_bookings_count || 0}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] text-gray-400 uppercase font-bold block">Вільно</span>
                                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                            {selectedRoom.max_capacity - (selectedRoom.approved_bookings_count || 0)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {isCurrentUsersRoom ? (
                                                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
                                                        <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                                                            Ви вже проживаєте в цій кімнаті.
                                                        </p>
                                                    </div>
                                                ) : isTargetReallocationRoom ? (
                                                    <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 text-center">
                                                        <p className="text-xs text-indigo-800 dark:text-indigo-200 font-medium">
                                                            Запит на переселення сюди очікує розгляду.
                                                        </p>
                                                    </div>
                                                ) : hasPendingReallocation ? (
                                                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center">
                                                        <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                                                            Ваш попередній запит на переселення ще розглядається.
                                                        </p>
                                                    </div>
                                                ) : hasPendingBooking ? (
                                                    <div className="bg-slate-50 dark:bg-gray-800/40 border border-slate-200 dark:border-gray-700 rounded-xl p-3 text-center">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Ваша перша заявка знаходиться на розгляді.
                                                        </p>
                                                    </div>
                                                ) : selectedRoom.intake_closed ? (
                                                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center">
                                                        <p className="text-xs text-amber-600 dark:text-amber-300 font-medium">
                                                            Прийом нових мешканців у цю кімнату призупинено.
                                                        </p>
                                                    </div>
                                                ) : selectedRoom.max_capacity - (selectedRoom.approved_bookings_count || 0) === 0 ? (
                                                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-center">
                                                        <p className="text-xs text-red-600 dark:text-red-300 font-medium">
                                                            У кімнаті немає вільних місць.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRequestRoom(selectedRoom.id)}
                                                        disabled={processing}
                                                        className="w-full text-center bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition-all shadow-md active:scale-95"
                                                    >
                                                        {processing
                                                            ? "Надсилання..."
                                                            : hasApprovedBooking
                                                              ? "Подати заявку на переселення"
                                                              : "Подати заявку на проживання"}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            <DigitalPassModal
                show={showDigitalPass}
                onClose={() => setShowDigitalPass(false)}
                booking={userBooking}
                user={auth?.user}
            />
        </AuthenticatedLayout>
    );
}
