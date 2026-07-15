import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Dashboard({
    auth,
    pendingBookings = [],
    buildings = [],
    users = [],
    tickets = [],
    auditLogs = []
}) {
    // Форма для Конструктора комнат (Групповое создание)
    const bulkForm = useForm({
        building_id: buildings[0]?.id || '',
        floor: 1,
        count: 5,
        max_capacity: 4,
    });

    // Форма для ручного заселения
    const manualForm = useForm({
        user_id: '', // Инициализируем пустой строкой, чтобы сработал первый placeholder-вариант
        room_id: '',
    });

    // Окремі форми/стани для дій із заявками, щоб контролювати завантаження кнопок
    const [actionProcessingId, setActionProcessingId] = useState(null);
    const [deleteProcessingId, setDeleteProcessingId] = useState(null);

    const [selectedRoomForManual, setSelectedRoomForManual] = useState(null);

    // Нові стани для вкладок, пошуку та фільтрації
    const [activeTab, setActiveTab] = useState('bookings');
    const [inboxSearch, setInboxSearch] = useState('');
    const [mapSearch, setMapSearch] = useState('');
    const [selectedBuildingFilter, setSelectedBuildingFilter] = useState('');
    const [ticketProcessingId, setTicketProcessingId] = useState(null);

    const handleResolveTicket = (ticketId) => {
        setTicketProcessingId(ticketId);
        router.post(route('admin.tickets.resolve', ticketId), {}, {
            onSuccess: () => {
                alert('Заявку успішно виконано!');
                setTicketProcessingId(null);
            },
            onError: () => {
                alert('Помилка при виконанні заявки.');
                setTicketProcessingId(null);
            }
        });
    };

    const filteredPendingBookings = pendingBookings.filter(b => 
        b.user?.name?.toLowerCase().includes(inboxSearch.toLowerCase()) ||
        b.user?.email?.toLowerCase().includes(inboxSearch.toLowerCase())
    );

    // Состояния для переселения админом
    const [reallocateBookingData, setReallocateBookingData] = useState(null);
    const [reallocateCurrentRoom, setReallocateCurrentRoom] = useState(null);
    const [selectedReallocateRoomId, setSelectedReallocateRoomId] = useState('');

    const openReallocateModal = (booking, currentRoom) => {
        setReallocateBookingData(booking);
        setReallocateCurrentRoom(currentRoom);
        setSelectedReallocateRoomId('');
    };

    const handleReallocateSubmit = (e) => {
        e.preventDefault();
        if (!selectedReallocateRoomId) return;

        router.post(route('admin.bookings.reallocate', reallocateBookingData.id), {
            room_id: selectedReallocateRoomId
        }, {
            onSuccess: () => {
                alert('Користувача успішно переселено!');
                setReallocateBookingData(null);
                setReallocateCurrentRoom(null);
                setSelectedReallocateRoomId('');
            },
            onError: (err) => {
                alert(err.error || 'Помилка при переселенні.');
            }
        });
    };

    // Получить список всех комнат со свободными местами для переселения
    const getAvailableRoomsForReallocation = (currentRoomId) => {
        const list = [];
        buildings.forEach(building => {
            building.rooms?.forEach(room => {
                const approvedCount = room.bookings?.filter(b => b.status === 'approved' || (b.status === 'pending' && b.new_room_id !== null)).length || 0;
                const freeSpots = room.max_capacity - approvedCount;
                if (room.id !== currentRoomId && freeSpots > 0) {
                    list.push({
                        id: room.id,
                        room_number: room.room_number,
                        floor: room.floor,
                        building_name: building.name,
                        free_spots: freeSpots,
                        max_capacity: room.max_capacity
                    });
                }
            });
        });
        return list;
    };

    // Форма для створення нового корпусу
    const buildingForm = useForm({
        name: '',
    });

    const handleCreateBuilding = (e) => {
        e.preventDefault();
        buildingForm.post(route('admin.buildings.store'), {
            onSuccess: () => {
                alert('Корпус успішно створено!');
                buildingForm.reset();
            },
            onError: (err) => alert(err.name || 'Помилка при створенні корпусу.')
        });
    };

    // Автоматично вибираємо перший корпус, якщо список корпусів оновився або змінився
    useEffect(() => {
        if (buildings.length > 0 && !bulkForm.data.building_id) {
            bulkForm.setData('building_id', buildings[0].id);
        }
    }, [buildings, bulkForm.data.building_id]);

    // 1. Создание комнат через конструктор
    const handleBulkCreate = (e) => {
        e.preventDefault();
        
        if (!bulkForm.data.building_id) {
            alert('Спершу оберіть корпус або створіть його!');
            return;
        }

        bulkForm.post(route('admin.rooms.bulk'), {
            onSuccess: () => {
                alert('Кімнати успішно згенеровані!');
                bulkForm.reset('floor', 'count', 'max_capacity');
            },
            onError: () => alert('Помилка при створенні кімнат.')
        });
    };

    // 2. Подтверждение заявки
    const handleApprove = (bookingId) => {
        setActionProcessingId(bookingId);
        // Викликаємо один універсальний метод для всіх 'pending' заявок
        router.post(route('admin.bookings.approve', bookingId), {}, {
            onSuccess: () => {
                alert('Заявку успішно затверджено!');
                setActionProcessingId(null);
            },
            onError: (err) => {
                alert(err.error || 'Помилка при затвердженні.');
                setActionProcessingId(null);
            }
        });
    };

    // 3. Отклонение заявки
    const handleReject = (bookingId) => {
        setActionProcessingId(bookingId);
        router.post(route('admin.bookings.reject', bookingId), {}, {
            onSuccess: () => {
                alert('Заявку відхилено!');
                setActionProcessingId(null);
            },
            className: () => setActionProcessingId(null)
        });
    };

    // 4. Выселение жильца
    const handleDeleteBooking = (bookingId) => {
        console.log("Попытка удаления брони с ID:", bookingId);

        if (!bookingId) {
            alert('Помилка: Не вдалося визначити ID бронювання.');
            return;
        }

        if (confirm('Ви впевнені, що хочете виселити цього жильця?')) {
            setDeleteProcessingId(bookingId);
            router.post(`/admin/bookings/${bookingId}/delete`, {}, {
                onSuccess: () => {
                    alert('Жильця успішно виселено!');
                    setDeleteProcessingId(null);
                },
                onError: (err) => {
                    console.error("Помилка:", err);
                    alert('Помилка при виселенні.');
                    setDeleteProcessingId(null);
                }
            });
        }
    };

    // 5. Открытие модалки ручного заселения
    const openManualBooking = (room) => {
        setSelectedRoomForManual(room);
        manualForm.setData('room_id', room.id);
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        manualForm.post(route('admin.bookings.manual'), {
            onSuccess: () => {
                alert('Користувача успешно заселено!');
                setSelectedRoomForManual(null);
                manualForm.reset();
            },
            onError: (err) => alert(err.error || 'Помилка при заселенні.')
        });
    };

    return (
        <AuthenticatedLayout
            user={auth?.user}
            header={
                <div className="flex flex-col gap-1">
                    <h2 className="font-bold text-2xl text-gray-900 tracking-tight">
                        Панель адміністратора
                    </h2>
                    <p className="text-sm text-gray-500">
                        Управління заявками, конструктором кімнат та жильцями
                    </p>
                </div>
            }
        >
            <Head title="Адмін-панель" />

            <div className="py-8 min-h-[calc(100vh-73px)] bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    {/* Hero-баннер */}
                    <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md border border-emerald-700/30 relative overflow-hidden">
                        <div className="relative z-10 space-y-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-700/60 border border-emerald-500/30 uppercase tracking-wider">
                                Панель адміністратора
                            </span>
                            <h1 className="text-xl md:text-2xl font-black tracking-tight">
                                Миколаївський національний аграрний університет
                            </h1>
                            <p className="text-emerald-100 text-xs max-w-xl leading-relaxed">
                                Керування заявками на розселення, ручним розподілом жильців та генерацією номерного фонду гуртожитків МНАУ.
                            </p>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
                            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                                <path d="M22 9L12 3v12l10-5.45z" opacity=".15" />
                                <path d="M4.2 12.06L12 16.3l7.8-4.24V14.3l-7.8 4.25-7.8-4.25v-2.24z" />
                            </svg>
                        </div>
                    </div>

                    {/* Вкладки керування */}
                    <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
                        <button
                            onClick={() => setActiveTab('bookings')}
                            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'bookings'
                                    ? 'border-emerald-600 text-emerald-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-950'
                            }`}
                        >
                            Заявки та конструктор
                        </button>
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'map'
                                    ? 'border-emerald-600 text-emerald-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-950'
                            }`}
                        >
                            Карта гуртожитків
                        </button>
                        <button
                            onClick={() => setActiveTab('tickets')}
                            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'tickets'
                                    ? 'border-emerald-600 text-emerald-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-950'
                            }`}
                        >
                            Заявки на ремонт ({tickets.filter(t => t.status === 'pending').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'logs'
                                    ? 'border-emerald-600 text-emerald-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-950'
                            }`}
                        >
                            Журнал аудиту
                        </button>
                    </div>

                    {activeTab === 'bookings' && (
                        <>
                            {/* ================= 1. ПАНЕЛЬ ЗАЯВОК (INBOX) ================= */}
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                                    <div>
                                        <h3 className="font-bold text-gray-900 tracking-tight">Вхідні заявки на розгляд</h3>
                                        <p className="text-xs text-gray-400">Схвалення або відхилення запитів від студентів</p>
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <input
                                            type="text"
                                            placeholder="Пошук за ім'ям / email..."
                                            value={inboxSearch}
                                            onChange={e => setInboxSearch(e.target.value)}
                                            className="text-xs rounded-lg border border-gray-200 px-3 py-1.5 focus:border-emerald-600 focus:ring-0 bg-white w-full sm:w-48"
                                        />
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/50 shrink-0">
                                            {filteredPendingBookings.length} очікують
                                        </span>
                                    </div>
                                </div>

                                {filteredPendingBookings.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-gray-500">
                                        Немає нових заявок на бронювання.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    <th className="p-4">Користувач</th>
                                                    <th className="p-4">Об'єкт / Корпус</th>
                                                    <th className="p-4">Поверх / Кімната</th>
                                                    <th className="p-4 text-right">Дії</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                                {filteredPendingBookings.map((booking) => (
                                                    <tr key={booking.id} className="hover:bg-gray-50/30 transition-colors">
                                                        <td className="p-4 font-medium text-gray-900">
                                                            <div>{booking.user?.name}</div>
                                                            <div className="text-xs text-gray-400 font-normal">{booking.user?.email}</div>
                                                        </td>
                                                        <td className="p-4 text-gray-600">
                                                            {booking.new_room_id ? (
                                                                <>
                                                                    <span className="line-through text-gray-400">{booking.room?.building?.name}</span> →
                                                                    <span className="font-bold text-amber-600"> {booking.new_room?.building?.name}</span>
                                                                    <span className="block text-xs text-amber-600 font-bold">Запит на переїзд</span>
                                                                </>
                                                            ) : (
                                                                <>{booking.room?.building?.name}</>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-gray-600">
                                                            {booking.new_room_id ? (
                                                                <>
                                                                    <span className="line-through text-gray-400">№{booking.room?.room_number}</span> →
                                                                    <span className="font-bold text-amber-600"> №{booking.new_room?.room_number}</span>
                                                                </>
                                                            ) : (
                                                                <>Поверх {booking.room?.floor}, Кімната №{booking.room?.room_number}</>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                                            {/* Отображаем кнопки только если статус 'pending' */}
                                                                    <button
                                                                        onClick={() => handleApprove(booking.id)}
                                                                        disabled={actionProcessingId !== null}
                                                                        className="inline-flex items-center text-emerald-600 font-bold hover:text-emerald-800 disabled:opacity-50"
                                                                    >
                                                                        {actionProcessingId === booking.id ? '...' : 'Затвердити'}
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleReject(booking.id)}
                                                                        disabled={actionProcessingId !== null}
                                                                        className="inline-flex items-center text-red-600 font-bold hover:text-red-800 disabled:opacity-50"
                                                                    >
                                                                        {actionProcessingId === booking.id ? '...' : 'Відхилити'}
                                                                    </button>

                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>


                            {/* ================= 1.1 СТВОРЕННЯ КОРПУСУ ================= */}
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
                                <div className="border-b border-gray-100 pb-3">
                                    <h3 className="font-bold text-gray-900 tracking-tight">Додати новий корпус</h3>
                                    <p className="text-xs text-gray-400">Створення нового об'єкта/корпусу в системі</p>
                                </div>

                                <form onSubmit={handleCreateBuilding} className="flex flex-col sm:flex-row gap-4 items-end">
                                    <div className="flex-1 space-y-1 w-full">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Назва корпусу</label>
                                        <input
                                            type="text"
                                            placeholder="Наприклад: Корпус №5"
                                            value={buildingForm.data.name}
                                            onChange={e => buildingForm.setData('name', e.target.value)}
                                            className="w-full text-sm rounded-lg border border-gray-200 p-2.5 focus:border-gray-900 focus:ring-0 bg-white"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={buildingForm.processing}
                                        className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50 w-full sm:w-auto whitespace-nowrap"
                                    >
                                        {buildingForm.processing ? 'Збереження...' : 'Додати корпус'}
                                    </button>
                                </form>
                            </div>

                            {/* ================= 2. ІНТЕРФЕЙС КОНСТРУКТОРА КІМНАТ ================= */}
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
                                <div className="border-b border-gray-100 pb-3">
                                    <h3 className="font-bold text-gray-900 tracking-tight">Конструктор кімнат</h3>
                                    <p className="text-xs text-gray-400">Швидке групове створення номерного фонду для об'єктів</p>
                                </div>

                                <form onSubmit={handleBulkCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Оберіть корпус</label>
                                        <select
                                            value={bulkForm.data.building_id}
                                            onChange={e => bulkForm.setData('building_id', e.target.value)}
                                            className="w-full text-sm rounded-lg border border-gray-200 p-2.5 focus:border-gray-900 focus:ring-0 bg-white"
                                        >
                                            {buildings.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Поверх</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={bulkForm.data.floor}
                                            onChange={e => bulkForm.setData('floor', e.target.value)}
                                            className="w-full text-sm rounded-lg border border-gray-200 p-2.5 focus:border-gray-900 focus:ring-0 bg-white"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Кількість кімнат</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={bulkForm.data.count}
                                            onChange={e => bulkForm.setData('count', e.target.value)}
                                            className="w-full text-sm rounded-lg border border-gray-200 p-2.5 focus:border-gray-900 focus:ring-0 bg-white"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Місткість кімнати</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={bulkForm.data.max_capacity}
                                            onChange={e => bulkForm.setData('max_capacity', e.target.value)}
                                            className="w-full text-sm rounded-lg border border-gray-200 p-2.5 focus:border-gray-900 focus:ring-0 bg-white"
                                        />
                                    </div>

                                    <div className="sm:col-span-2 lg:col-span-4 text-right pt-2">
                                        <button
                                            type="submit"
                                            disabled={bulkForm.processing}
                                            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50"
                                        >
                                            {bulkForm.processing ? 'Генерація...' : 'Згенерувати кімнати'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}


                    {/* ================= 3. КАРТА КОРПУСІВ ТА УПРАВЛЕНИЕ ЖИЛЬЦАМИ ================= */}
                    {activeTab === 'map' && (
                        <div className="space-y-6">
                            {/* Пошук та фільтр для мапи */}
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 tracking-tight">Карта корпусів МНАУ</h3>
                                    <p className="text-xs text-gray-400">Інтерактивна схема кімнат та розселення</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    <select
                                        value={selectedBuildingFilter}
                                        onChange={e => setSelectedBuildingFilter(e.target.value)}
                                        className="text-xs rounded-lg border border-gray-200 p-2.5 focus:border-emerald-600 focus:ring-0 bg-white w-full sm:w-48"
                                    >
                                        <option value="">Усі корпуси</option>
                                        {buildings.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>

                                    <input
                                        type="text"
                                        placeholder="Пошук жильця або кімнати..."
                                        value={mapSearch}
                                        onChange={e => setMapSearch(e.target.value)}
                                        className="text-xs rounded-lg border border-gray-200 p-2.5 focus:border-emerald-600 focus:ring-0 bg-white w-full sm:w-48"
                                    />
                                </div>
                            </div>

                            {/* Відображення корпусів */}
                            {buildings
                                .filter(b => !selectedBuildingFilter || b.id === Number(selectedBuildingFilter))
                                .map(building => {
                                    // Group rooms by floor
                                    const floorsMap = {};
                                    building.rooms?.forEach(room => {
                                        floorsMap[room.floor] = floorsMap[room.floor] || [];
                                        floorsMap[room.floor].push(room);
                                    });

                                    // Sort rooms inside floors by number
                                    Object.keys(floorsMap).forEach(fl => {
                                        floorsMap[fl].sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, {numeric: true}));
                                    });

                                    const floorsList = Object.keys(floorsMap).sort((a, b) => Number(a) - Number(b));

                                    return (
                                        <div key={building.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
                                            <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Об'єкт</span>
                                                    <h4 className="font-bold text-gray-900 text-md">{building.name}</h4>
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    Кімнат: {building.rooms?.length || 0}
                                                </span>
                                            </div>

                                            {building.rooms?.length === 0 ? (
                                                <p className="text-xs text-gray-400 py-2">У цьому корпусі ще немає кімнат. Скористайтеся конструктором вище.</p>
                                            ) : (
                                                <div className="space-y-8">
                                                    {floorsList.map(floor => {
                                                        const floorRooms = floorsMap[floor].filter(room => {
                                                            const approvedBookings = room.bookings?.filter(b => b.status === 'approved' || (b.status === 'pending' && b.new_room_id !== null)) || [];
                                                            return !mapSearch || 
                                                                room.room_number.toLowerCase().includes(mapSearch.toLowerCase()) ||
                                                                approvedBookings.some(b => b.user?.name?.toLowerCase().includes(mapSearch.toLowerCase()) || b.user?.email?.toLowerCase().includes(mapSearch.toLowerCase()));
                                                        });

                                                        if (floorRooms.length === 0) return null;

                                                        return (
                                                            <div key={floor} className="space-y-3">
                                                                <h5 className="text-xs font-bold text-gray-500 flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                                                    Поверх {floor}
                                                                </h5>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                                    {floorRooms.map(room => {
                                                                        const approvedBookings = room.bookings?.filter(b => b.status === 'approved' || (b.status === 'pending' && b.new_room_id !== null)) || [];
                                                                        const isFull = approvedBookings.length >= room.max_capacity;

                                                                        return (
                                                                            <div
                                                                                key={room.id}
                                                                                className={`p-4 rounded-xl border flex flex-col justify-between min-h-[180px] transition-all relative ${
                                                                                    isFull 
                                                                                        ? 'bg-red-50/20 border-red-200/50 shadow-2xs' 
                                                                                        : 'bg-emerald-50/10 border-emerald-100 shadow-2xs'
                                                                                }`}
                                                                            >
                                                                                <div>
                                                                                    <div className="flex justify-between items-center mb-1.5">
                                                                                        <span className="font-bold text-gray-900 text-sm">Кімната №{room.room_number}</span>
                                                                                        <span className="text-[10px] font-bold text-gray-400">Місткість: {room.max_capacity}</span>
                                                                                    </div>

                                                                                    {/* Слот-візуалізатор (Occupancy dots) */}
                                                                                    <div className="flex gap-1.5 my-2">
                                                                                        {Array.from({ length: room.max_capacity }).map((_, slotIdx) => (
                                                                                            <span
                                                                                                key={slotIdx}
                                                                                                className={`w-4 h-1.5 rounded-xs transition-all border ${
                                                                                                    slotIdx < approvedBookings.length
                                                                                                        ? 'bg-emerald-500 border-emerald-600/20'
                                                                                                        : 'bg-gray-100 border-gray-200'
                                                                                                }`}
                                                                                                title={slotIdx < approvedBookings.length ? approvedBookings[slotIdx]?.user?.name : 'Вільне місце'}
                                                                                            />
                                                                                        ))}
                                                                                    </div>

                                                                                    {/* Список жильцов */}
                                                                                    <div className="space-y-1 my-3">
                                                                                        {approvedBookings.map(b => (
                                                                                            <div key={b.id} className="flex justify-between items-center text-xs bg-white border border-gray-100 p-1.5 rounded-lg shadow-3xs gap-1">
                                                                                                <div className="flex flex-col truncate max-w-[125px]">
                                                                                                    <span className="font-medium text-gray-700 truncate flex items-center gap-1.5">
                                                                                                        {b.user?.name}
                                                                                                        {b.user?.telegram && (
                                                                                                            <a
                                                                                                                href={`https://t.me/${b.user.telegram.replace('@', '')}`}
                                                                                                                target="_blank"
                                                                                                                rel="noopener noreferrer"
                                                                                                                className="text-[10px] text-emerald-600 font-bold shrink-0 hover:underline"
                                                                                                                title={`Telegram: ${b.user.telegram}`}
                                                                                                            >
                                                                                                                (tg)
                                                                                                            </a>
                                                                                                        )}
                                                                                                    </span>
                                                                                                    {b.new_room_id && (
                                                                                                        <span className="text-[9px] text-indigo-600 font-semibold leading-none truncate mt-0.5">
                                                                                                            Переїзд в №{b.new_room?.room_number || '?'}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                                <div className="flex items-center gap-1 shrink-0">
                                                                                                    <button
                                                                                                        onClick={() => openReallocateModal(b, room)}
                                                                                                        className="text-gray-400 hover:text-indigo-600 font-semibold transition-colors"
                                                                                                        title="Переселити жильця"
                                                                                                    >
                                                                                                        ⇄
                                                                                                    </button>
                                                                                                    <button
                                                                                                        onClick={() => handleDeleteBooking(b.id)}
                                                                                                        disabled={deleteProcessingId === b.id}
                                                                                                        className="text-gray-400 hover:text-red-600 font-bold px-1 transition-colors text-sm leading-none disabled:opacity-50"
                                                                                                        title="Виселити жильця"
                                                                                                    >
                                                                                                        {deleteProcessingId === b.id ? '...' : '×'}
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>

                                                                                {!isFull && (
                                                                                    <button
                                                                                        onClick={() => openManualBooking(room)}
                                                                                        className="w-full text-center bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs py-2 font-medium rounded-lg transition-all shadow-3xs active:scale-[0.98] mt-2"
                                                                                    >
                                                                                        + Заселити вручну
                                                                                    </button>
                                                                                )}
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
                    )}

                    {activeTab === 'tickets' && (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 tracking-tight">Заявки на ремонт та обслуговування</h3>
                                <p className="text-xs text-gray-400">Звернення від студентів щодо технічних неполадок у кімнатах</p>
                            </div>

                            {tickets.length === 0 ? (
                                <div className="p-8 text-center text-sm text-gray-500">
                                    Немає заяв на ремонт.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                <th className="p-4">Студент</th>
                                                <th className="p-4">Кімната / Корпус</th>
                                                <th className="p-4">Опис поломки</th>
                                                <th className="p-4">Статус</th>
                                                <th className="p-4 text-right">Дія</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                            {tickets.map(t => (
                                                <tr key={t.id} className="hover:bg-gray-50/30 transition-colors">
                                                    <td className="p-4 font-medium text-gray-900">
                                                        <div>{t.user?.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-normal">{t.user?.email}</div>
                                                    </td>
                                                    <td className="p-4 text-gray-600">
                                                        Кімната №{t.room?.room_number} ({t.room?.building?.name})
                                                    </td>
                                                    <td className="p-4 text-gray-700 max-w-xs truncate" title={t.description}>
                                                        {t.description}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                            t.status === 'resolved' 
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                                                                : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                                                        }`}>
                                                            {t.status === 'resolved' ? 'Вирішено' : 'Активна'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {t.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleResolveTicket(t.id)}
                                                                disabled={ticketProcessingId === t.id}
                                                                className="text-xs text-emerald-600 font-bold hover:underline disabled:opacity-50"
                                                            >
                                                                {ticketProcessingId === t.id ? 'Вирішується...' : 'Вирішити'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 tracking-tight">Журнал аудиту дій</h3>
                                <p className="text-xs text-gray-400">Лог адміністративних дій та статусів заселення</p>
                            </div>

                            {auditLogs.length === 0 ? (
                                <div className="p-8 text-center text-sm text-gray-500">
                                    Журнал порожній.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                <th className="p-4">Студент</th>
                                                <th className="p-4">Дія</th>
                                                <th className="p-4">Подробиці</th>
                                                <th className="p-4">Дата / Час</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                            {auditLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                                                    <td className="p-4 font-semibold text-gray-900">
                                                        {log.user ? (
                                                            <div>
                                                                <div>{log.user.name}</div>
                                                                <div className="text-[10px] text-gray-400 font-normal">{log.user.email}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 italic">Система / Адмін</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 font-mono">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            log.action.includes('approved') 
                                                                ? 'bg-emerald-50 text-emerald-800' 
                                                                : log.action.includes('rejected') || log.action.includes('evicted')
                                                                ? 'bg-red-50 text-red-800'
                                                                : log.action.includes('relocation')
                                                                ? 'bg-indigo-50 text-indigo-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-gray-600">
                                                        {log.details}
                                                    </td>
                                                    <td className="p-4 text-gray-400">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}


                    {/* ================= МОДАЛЬНОЕ ОКНО ДЛЯ РУЧНОГО ЗАСЕЛЕНИЯ ================= */}
                    {selectedRoomForManual && (
                        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
                                <div className="border-b border-gray-100 pb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Пряме призначення</span>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Заселення в кімнату №{selectedRoomForManual.room_number}
                                    </h3>
                                </div>

                                <form onSubmit={handleManualSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Оберіть користувача</label>
                                        <select
                                            value={manualForm.data.user_id}
                                            onChange={e => manualForm.setData('user_id', e.target.value)}
                                            className="w-full text-sm rounded-lg border border-gray-200 p-2.5 focus:border-gray-900 focus:ring-0 bg-white"
                                            required
                                        >
                                            <option value="" disabled>-- Оберіть студента --</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRoomForManual(null)}
                                            className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-colors"
                                        >
                                            Скасувати
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={manualForm.processing}
                                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50"
                                        >
                                            {manualForm.processing ? 'Заселення...' : 'Заселити'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* ================= МОДАЛЬНОЕ ОКНО ДЛЯ ПЕРЕСЕЛЕНИЯ (АДМИН) ================= */}
                    {reallocateBookingData && reallocateCurrentRoom && (
                        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
                                <div className="border-b border-gray-100 pb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Переселення жильця</span>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Переселити: {reallocateBookingData.user?.name}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Поточна кімната: №{reallocateCurrentRoom.room_number} (Поверх {reallocateCurrentRoom.floor})
                                    </p>
                                </div>

                                <form onSubmit={handleReallocateSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Оберіть нову кімнату</label>
                                        <select
                                            value={selectedReallocateRoomId}
                                            onChange={e => setSelectedReallocateRoomId(e.target.value)}
                                            className="w-full text-sm rounded-lg border border-gray-200 p-2.5 focus:border-gray-900 focus:ring-0 bg-white"
                                            required
                                        >
                                            <option value="" disabled>-- Оберіть кімнату --</option>
                                            {getAvailableRoomsForReallocation(reallocateCurrentRoom.id).map(r => (
                                                <option key={r.id} value={r.id}>
                                                    Кімн. №{r.room_number} ({r.building_name}, Пов. {r.floor}, Вільно {r.free_spots}/{r.max_capacity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReallocateBookingData(null);
                                                setReallocateCurrentRoom(null);
                                                setSelectedReallocateRoomId('');
                                            }}
                                            className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-colors"
                                        >
                                            Скасувати
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-sm"
                                        >
                                            Переселити
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
