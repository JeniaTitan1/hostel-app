import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { generateOrderPdf } from "@/Utils/OrderPdfGenerator";
import VerifyOrderModal from "@/Components/VerifyOrderModal";

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
}) {
    // Використовуємо локальний стан для керування завантаженням (processing)
    const [processing, setProcessing] = useState(false);

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
        router.visit(route("dashboard", { building_id: buildingId }), {
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

    // Генерація PDF-ордера на заселення
    const handleDownloadSlip = () => {
        if (!userBooking) return;
        generateOrderPdf({ user: auth?.user, booking: userBooking });
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

    return (
        <AuthenticatedLayout
            user={auth?.user}
            header={
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
                    <div className="flex flex-col gap-1">
                        <h2 className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">
                            {!selectedBuildingId
                                ? "Вибір корпусу"
                                : `${currentBuilding?.name}`}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {!selectedBuildingId
                                ? "Оберіть об'єкт для роботи з системою"
                                : `Виберіть поверх та кімнату для проживання`}
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
                            <button
                                onClick={handleDownloadSlip}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-lg transition-colors"
                                title="Завантажити підтвердження заселення"
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
                                        strokeWidth={2}
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                Ордер на заселення
                            </button>
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

            <div className="py-8 min-h-[calc(100vh-73px)] bg-slate-50/50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {!selectedBuildingId && (
                        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 md:p-8 text-white shadow-md border border-emerald-700/30 relative overflow-hidden">
                            <div className="relative z-10 space-y-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-700/60 border border-emerald-500/30 uppercase tracking-wide">
                                    Офіційний сервіс
                                </span>
                                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight max-w-2xl">
                                    Миколаївський національний аграрний
                                    університет
                                </h1>
                                <p className="text-emerald-100 text-sm max-w-xl leading-relaxed">
                                    Система онлайн-бронювання місць та поселення
                                    студентів у гуртожитки МНАУ. Оберіть корпус
                                    нижче, щоб переглянути вільні кімнати та
                                    подати заявку.
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

                    {!selectedBuildingId &&
                        userBooking &&
                        userBooking.status === "approved" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Сусіди по кімнаті */}
                                <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm p-6 space-y-4">
                                    <div className="border-b border-slate-100/80 dark:border-gray-700 pb-3 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">Мої сусіди по кімнаті</h3>
                                            <p className="text-xs text-gray-400">
                                                Контакти студентів, що
                                                проживають з вами
                                            </p>
                                        </div>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/50">
                                            Кімната №
                                            {userBooking.room?.room_number}
                                        </span>
                                    </div>

                                    {roommates.length === 0 ? (
                                        <p className="text-xs text-gray-400 py-4 text-center">
                                            У вашій кімнаті більше ніхто не
                                            проживає.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {roommates.map((r, index) => (
                                                <div
                                                    key={index}
                                                    className="p-4 rounded-xl border border-slate-100/80 dark:border-gray-700 bg-slate-50/50/50 dark:bg-gray-800/30 flex flex-col justify-between space-y-2"
                                                >
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                                            {r.name}
                                                        </h4>
                                                        <p className="text-xs text-gray-400">
                                                            {r.email}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col gap-1 pt-1 border-t border-slate-100/80 text-[11px] text-gray-500">
                                                        {r.telegram && (
                                                            <span className="flex items-center gap-1.5">
                                                                <strong className="text-gray-400">
                                                                    Telegram:
                                                                </strong>
                                                                <a
                                                                    href={`https://t.me/${r.telegram.replace("@", "")}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-emerald-600 hover:underline"
                                                                >
                                                                    {r.telegram}
                                                                </a>
                                                            </span>
                                                        )}
                                                        {r.phone && (
                                                            <span className="flex items-center gap-1.5">
                                                                <strong className="text-gray-400">
                                                                    Тел:
                                                                </strong>
                                                                <a
                                                                    href={`tel:${r.phone}`}
                                                                    className="hover:underline"
                                                                >
                                                                    {r.phone}
                                                                </a>
                                                            </span>
                                                        )}
                                                        {!r.telegram &&
                                                            !r.phone && (
                                                                <span className="text-gray-400 italic">
                                                                    Контакти не
                                                                    вказані
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Технічна підтримка / Ремонт */}
                                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm p-6 space-y-4">
                                    <div className="border-b border-slate-100/80 dark:border-gray-700 pb-3">
                                        <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">Технічна підтримка</h3>
                                        <p className="text-xs text-gray-400">
                                            Повідомити про поломку в кімнаті
                                        </p>
                                    </div>

                                    <form
                                        onSubmit={handleCreateTicket}
                                        className="space-y-3"
                                    >
                                        <textarea
                                            rows="2"
                                            placeholder="Опишіть проблему (напр. протікає кран, зламався замок)..."
                                            value={ticketForm.data.description}
                                            onChange={(e) =>
                                                ticketForm.setData(
                                                    "description",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full text-xs rounded-lg border border-slate-100 dark:border-gray-700 p-2.5 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                            required
                                            disabled={ticketForm.processing}
                                        />
                                        <button
                                            type="submit"
                                            disabled={ticketForm.processing}
                                            className="w-full py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs disabled:opacity-50"
                                        >
                                            {ticketForm.processing
                                                ? "Надсилання..."
                                                : "Надіслати заявку"}
                                        </button>
                                    </form>

                                    {/* Список заявок */}
                                    <div className="space-y-2 pt-2 border-t border-slate-100/80 max-h-40 overflow-y-auto">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Мої заявки</h4>
                                        {tickets.length === 0 ? (
                                            <p className="text-[10px] text-gray-400 italic">
                                                Немає поданих заявок
                                            </p>
                                        ) : (
                                            tickets.map((t) => (
                                                <div
                                                    key={t.id}
                                                    className="p-2 rounded-lg border border-gray-105 dark:border-gray-700 bg-slate-50/50/50 dark:bg-gray-800/30 flex items-start justify-between gap-2 text-xs"
                                                >
                                                    <div className="space-y-1">
                                                        <p className="text-gray-700 dark:text-gray-300 leading-tight text-[11px] line-clamp-2">
                                                            {t.description}
                                                        </p>
                                                        <span className="text-[9px] text-gray-400 block">
                                                            {new Date(
                                                                t.created_at,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                            t.status ===
                                                            "resolved"
                                                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30"
                                                                : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30"
                                                        }`}
                                                    >
                                                        {t.status === "resolved"
                                                            ? "Виконано"
                                                            : "В процесі"}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    {!selectedBuildingId &&
                        (buildings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 max-w-md mx-auto shadow-sm">
                                <svg
                                    className="w-10 h-10 text-gray-400 mb-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                </svg>
                                <h3 className="text-base font-medium text-gray-900 dark:text-white">Корпуси відсутні</h3>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {buildings.map((building, idx) => (
                                    <button
                                        key={building.id}
                                        onClick={() =>
                                            handleSelectBuilding(building.id)
                                        }
                                        title={building.name}
                                        className="group flex flex-col justify-between items-start p-6 text-left w-full h-44 rounded-xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 hover:bg-slate-50/50/40 dark:hover:bg-gray-800/40 hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 transition-all duration-300 ease-out animate-card-fade-in"
                                        style={{ animationDelay: `${idx * 60}ms` }}
                                    >
                                        <div className="w-full flex justify-between items-start">
                                            <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-900 dark:group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                    />
                                                </svg>
                                            </div>
                                            <span className="h-1.5 w-1.5 rounded-full bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-400 dark:group-hover:bg-slate-50/500 transition-colors duration-200 mt-1" />
                                        </div>
                                        <div className="w-full mt-4 flex justify-between items-end">
                                            <div className="flex flex-col max-w-[85%] gap-0.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    Об'єкт
                                                </span>
                                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 leading-snug">
                                                    {building.name}
                                                </h3>
                                            </div>
                                            <div className="text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-emerald-400 transform translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 mb-0.5 shrink-0">
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2.5}
                                                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ))}

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
                                            {rooms
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
                                                        } ${isMyRoom ? "ring-2 ring-indigo-500 ring-offset-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30" : ""}`}
                                                    >
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
                                                                            <span>🛠️ {room.closure_reason || "Технічне обслуговування"}</span>
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
                                                                            🔧 На ремонті
                                                                        </span>
                                                                    ) : (
                                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles.badge}`}>
                                                                            {`${room.max_capacity} місна`}
                                                                        </span>
                                                                    )}
                                                                    {Boolean(room.intake_closed) && !isClosed && (
                                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200">
                                                                            🔒 Закрита
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

                                        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 p-6 rounded-xl shadow-sm sticky top-24 space-y-6">
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
                                                            Поверх{" "}
                                                            {selectedRoom.floor}{" "}
                                                            • Корпус{" "}
                                                            {
                                                                currentBuilding?.name
                                                            }
                                                        </p>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center text-sm border-b border-slate-100/80 pb-2">
                                                            <span className="text-gray-500">
                                                                Загальна
                                                                місткість:
                                                            </span>
                                                            <span className="font-bold text-gray-900">
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
                                                            <span className="font-bold text-gray-900">
                                                                {selectedRoom.approved_bookings_count ||
                                                                    0}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-500">
                                                                Вільних місць:
                                                            </span>
                                                            <span className="font-bold text-emerald-600">
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
                                                                onClick={
                                                                    handleDownloadSlip
                                                                }
                                                                className="w-full text-center bg-white dark:bg-gray-700 border border-slate-100 dark:border-gray-600 hover:bg-slate-50/50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150"
                                                            >
                                                                Завантажити
                                                                ордер (TXT)
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
                                                             {/* Попередження про змішану кімнату */}
                                                             <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                                                 <div className="flex items-start gap-2">
                                                                     <span className="text-amber-600 text-base leading-none mt-0.5">⚠️</span>
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
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
