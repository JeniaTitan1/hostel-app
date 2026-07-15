import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Dashboard({ auth, pendingBookings = [], buildings = [], users = [] }) {
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

                    {/* ================= 1. ПАНЕЛЬ ЗАЯВОК (INBOX) ================= */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 tracking-tight">Вхідні заявки на розгляд</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/50">
                                {pendingBookings.length} очікують
                            </span>
                        </div>

                        {pendingBookings.length === 0 ? (
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
                                        {pendingBookings.map((booking) => (
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


                    {/* ================= 3. КАРТА КОРПУСІВ ТА УПРАВЛЕНИЕ ЖИЛЬЦАМИ ================= */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-gray-900 tracking-tight">Карта корпусів та поточні жильці</h3>
                        </div>

                        {buildings.map(building => (
                            <div key={building.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
                                <div className="border-b border-gray-100 pb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Об'єкт</span>
                                    <h4 className="font-bold text-gray-900 text-md">{building.name}</h4>
                                </div>

                                {building.rooms?.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-2">У цьому корпусі ще немає кімнат. Скористайтеся конструктором вище.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {building.rooms?.map(room => {
                                            const approvedBookings = room.bookings?.filter(b => b.status === 'approved' || (b.status === 'pending' && b.new_room_id !== null)) || [];
                                            const isFull = approvedBookings.length >= room.max_capacity;

                                            return (
                                                <div
                                                    key={room.id}
                                                    className={`p-4 rounded-xl border flex flex-col justify-between min-h-[160px] transition-all ${
                                                        isFull ? 'bg-red-50/40 border-red-100' : 'bg-emerald-50/30 border-emerald-100'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className="font-bold text-gray-900 text-sm">Кімната №{room.room_number}</span>
                                                            <span className="text-[10px] font-bold text-gray-400">Поверх {room.floor}</span>
                                                        </div>
                                                        <div className="text-[11px] text-gray-500 mb-3">
                                                            Заселено: <span className="font-semibold text-gray-800">{approvedBookings.length} / {room.max_capacity}</span>
                                                        </div>

                                                        {/* Список жильцов в комнате */}
                                                        <div className="space-y-1 mb-4">
                                                            {approvedBookings.map(b => (
                                                                <div key={b.id} className="flex justify-between items-center text-xs bg-white/80 border border-gray-100 p-1.5 rounded-lg shadow-2xs gap-1">
                                                                    <div className="flex flex-col truncate max-w-[125px]" title={b.user?.name}>
                                                                        <span className="font-medium text-gray-700 truncate">{b.user?.name}</span>
                                                                        {b.new_room_id && (
                                                                            <span className="text-[9px] text-indigo-600 font-semibold leading-none truncate">
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
                                                            className="w-full text-center bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs py-2 font-medium rounded-lg transition-all shadow-2xs active:scale-[0.98]"
                                                        >
                                                            + Заселити вручну
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>


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
