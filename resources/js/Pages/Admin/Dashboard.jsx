import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

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
    pendingBookings = [],
    buildings = [],
    users = [],
    tickets = [],
    auditLogs = [],
    allUsers = [],
    generatedUsers = null,
    stats = null
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
    const [genderFilter, setGenderFilter] = useState('');
    const [ticketProcessingId, setTicketProcessingId] = useState(null);

    // Стан модалки причини відхилення
    const [rejectModalBookingId, setRejectModalBookingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    // Форма для генератора користувачів
    const genForm = useForm({
        count: 5,
        gender: '',
    });

    
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

    const handleGenerateUsers = (e) => {
        e.preventDefault();
        genForm.post(route('admin.users.generate'), {
            onSuccess: () => {
                alert('Користувачів успішно згенеровано!');
                genForm.reset();
            },
            onError: (err) => alert(err.count || 'Помилка при генерації.')
        });
    };

    const handleClearLogs = () => {
        if (confirm('Ви впевнені, що хочете очистити весь журнал аудиту?')) {
            router.post(route('admin.audit-logs.clear'), {}, {
                onSuccess: () => alert('Журнал аудиту очищено!'),
                onError: () => alert('Помилка при очищенні журналу.')
            });
        }
    };

    const handleExportPDF = () => {
        if (!generatedUsers || generatedUsers.length === 0) return;

        const generate = (jsPDFClass) => {
            const doc = new jsPDFClass();
            
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Mykolaiv National Agrarian University (MNAU)", 14, 20);
            doc.setFontSize(12);
            doc.setFont("Helvetica", "normal");
            doc.text("Hostels System - Generated Student Accounts", 14, 27);
            doc.line(14, 32, 196, 32);

            let y = 42;
            generatedUsers.forEach((user, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.setFont("Helvetica", "bold");
                doc.text(`${index + 1}. ${user.name}`, 14, y);
                doc.setFont("Helvetica", "normal");
                doc.text(`Email: ${user.email}`, 20, y + 6);
                doc.text(`Password: ${user.password}`, 20, y + 12);
                doc.line(14, y + 16, 196, y + 16);
                y += 24;
            });

            doc.save("mnau_students_credentials.pdf");
        };

        if (window.jspdf && window.jspdf.jsPDF) {
            generate(window.jspdf.jsPDF);
        } else {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            script.onload = () => {
                const jsPDFClass = window.jspdf?.jsPDF || window.jspdf_umd?.jsPDF;
                if (jsPDFClass) {
                    generate(jsPDFClass);
                } else {
                    alert("Помилка завантаження бібліотеки PDF.");
                }
            };
            document.body.appendChild(script);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Скопійовано в буфер обміну!');
    };

    const copyAllCredentials = () => {
        if (!generatedUsers || generatedUsers.length === 0) return;
        const text = generatedUsers.map((u, i) => `${i + 1}. Ім'я: ${u.name}\n   Email: ${u.email}\n   Пароль: ${u.password}`).join('\n\n');
        copyToClipboard(text);
    };

    const { academic_options } = usePage().props;
    const specialties = academic_options?.specialties || [];
    const courses = academic_options?.courses || [];
    const groups = academic_options?.groups || [];

    const specialtyForm = useForm({ name: '' });
    const courseForm = useForm({ number: '' });
    const groupForm = useForm({ name: '' });

    const [userSearch, setUserSearch] = useState('');
    const [userSpecialtyFilter, setUserSpecialtyFilter] = useState('');
    const [userCourseFilter, setUserCourseFilter] = useState('');
    const [userGroupFilter, setUserGroupFilter] = useState('');
    const [userSortField, setUserSortField] = useState('name');
    const [userSortDirection, setUserSortDirection] = useState('asc');
    const [userGenderFilter, setUserGenderFilter] = useState('');

    const uniqueSpecialties = [...new Set(allUsers.map(u => u.specialty).filter(Boolean))].sort();
    const uniqueCourses = [...new Set(allUsers.map(u => u.course).filter(Boolean))].sort((a, b) => a - b);
    const uniqueGroups = [...new Set(allUsers.map(u => u.group).filter(Boolean))].sort();
    const filteredAllUsers = allUsers.filter(u => {
        const matchesSearch = !userSearch || 
            u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(userSearch.toLowerCase());
            
        const matchesSpecialty = !userSpecialtyFilter || u.specialty === userSpecialtyFilter;
        const matchesCourse = !userCourseFilter || Number(u.course) === Number(userCourseFilter);
        const matchesGroup = !userGroupFilter || u.group === userGroupFilter;
        const matchesGender = !userGenderFilter || u.gender === userGenderFilter;
        
        return matchesSearch && matchesSpecialty && matchesCourse && matchesGroup && matchesGender;
    });

    const sortedAllUsers = [...filteredAllUsers].sort((a, b) => {
        let valA = a[userSortField];
        let valB = b[userSortField];

        if (userSortField === 'course') {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
            return userSortDirection === 'asc' ? valA - valB : valB - valA;
        }

        if (userSortField === 'must_change_password') {
            valA = valA ? 1 : 0;
            valB = valB ? 1 : 0;
            return userSortDirection === 'asc' ? valA - valB : valB - valA;
        }

        if (userSortField === 'created_at') {
            valA = new Date(valA || 0).getTime();
            valB = new Date(valB || 0).getTime();
            return userSortDirection === 'asc' ? valA - valB : valB - valA;
        }

        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();

        if (valA < valB) return userSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return userSortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (field) => {
        if (userSortField === field) {
            setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setUserSortField(field);
            setUserSortDirection('asc');
        }
    };

    const renderSortArrow = (field) => {
        if (userSortField !== field) {
            return <span className="text-gray-300 dark:text-gray-600 ml-1 select-none">↕</span>;
        }
        return userSortDirection === 'asc' 
            ? <span className="text-emerald-600 dark:text-emerald-400 ml-1 select-none">▲</span> 
            : <span className="text-emerald-600 dark:text-emerald-400 ml-1 select-none">▼</span>;
    };

    const renderGenderBadge = (gender) => {
        if (gender === 'male') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/40">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Чоловік
                </span>
            );
        }
        if (gender === 'female') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300 border border-pink-100 dark:border-pink-800/40">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Жінка
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-gray-900/30 text-gray-500 border border-slate-100 dark:border-gray-700">
                —
            </span>
        );
    };

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

    // 3. Відхилення заявки — відкриваємо модальне вікно
    const handleReject = (bookingId) => {
        setRejectModalBookingId(bookingId);
        setRejectReason('');
    };

    const submitReject = () => {
        setActionProcessingId(rejectModalBookingId);
        router.post(route('admin.bookings.reject', rejectModalBookingId), {
            rejection_reason: rejectReason || null,
        }, {
            onSuccess: () => {
                alert('Заявку відхилено!');
                setActionProcessingId(null);
                setRejectModalBookingId(null);
                setRejectReason('');
            },
            onError: () => setActionProcessingId(null)
        });
    };

    // Перемкнути статус кімнати (active ↔ closed)
    const handleToggleRoomStatus = (roomId) => {
        router.post(route('admin.rooms.toggle-status', roomId), {}, {
            preserveScroll: true,
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
                    <h2 className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">
                        Панель адміністратора
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Управління заявками, конструктором кімнат та жильцями
                    </p>
                </div>
            }
        >
            <Head title="Адмін-панель" />

            <div className="py-8 min-h-[calc(100vh-73px)] bg-slate-50/50 dark:bg-gray-900">
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

                    {/* ===== АНАЛІТИКА ===== */}
                    {stats && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Загальна місткість</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.total_capacity}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{stats.total_rooms} кімнат</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Заселено</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.occupied}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{stats.total_capacity > 0 ? Math.round(stats.occupied / stats.total_capacity * 100) : 0}% завантаженість</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Вільних місць</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.total_capacity - stats.occupied}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Очікують</p>
                                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">заявок на розгляді</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Відкриті тікети</p>
                                <p className="text-2xl font-black text-red-600 dark:text-red-400">{stats.open_tickets}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">ремонт / обслуговування</p>
                            </div>
                        </div>
                    )}

                    {/* Прогрес-бари по корпусах */}
                    {stats?.buildings?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl p-5 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Завантаженість по корпусах</h3>
                            {stats.buildings.map(b => (
                                <div key={b.id} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{b.name}</span>
                                        <span className="text-gray-400 dark:text-gray-500">{b.occupied}/{b.capacity} ({b.capacity > 0 ? Math.round(b.occupied / b.capacity * 100) : 0}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                b.capacity > 0 && b.occupied / b.capacity >= 0.9 ? 'bg-red-500' :
                                                b.capacity > 0 && b.occupied / b.capacity >= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${b.capacity > 0 ? Math.min(100, Math.round(b.occupied / b.capacity * 100)) : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Вкладки керування */}
                    <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-px">
                        <button
                            onClick={() => setActiveTab('bookings')}
                            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'bookings'
                                    ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-950'
                            }`}
                        >
                            Заявки та конструктор
                        </button>
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'map'
                                    ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-950'
                            }`}
                        >
                            Карта гуртожитків
                        </button>
                        <button
                            onClick={() => setActiveTab('tickets')}
                            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'tickets'
                                    ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-950'
                            }`}
                        >
                            Заявки на ремонт ({tickets.filter(t => t.status === 'pending').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'logs'
                                    ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-950'
                            }`}
                        >
                            Журнал аудиту
                        </button>
                        <button
                            onClick={() => setActiveTab('users_gen')}
                            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'users_gen'
                                    ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-950'
                            }`}
                        >
                            Генератор користувачів
                        </button>
                        <button
                            onClick={() => setActiveTab('academic_settings')}
                            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'academic_settings'
                                    ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-950'
                            }`}
                        >
                            Академічні налаштування
                        </button>
                    </div>

                    {activeTab === 'bookings' && (
                        <>
                            {/* ================= 1. ПАНЕЛЬ ЗАЯВОК (INBOX) ================= */}
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-100/80 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50/50 dark:bg-gray-800/50">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">Вхідні заявки на розгляд</h3>
                                        <p className="text-xs text-gray-400">Схвалення або відхилення запитів від студентів</p>
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <input
                                            type="text"
                                            placeholder="Пошук за ім'ям / email..."
                                            value={inboxSearch}
                                            onChange={e => setInboxSearch(e.target.value)}
                                            className="text-xs rounded-lg border border-slate-100 dark:border-gray-600 px-3 py-1.5 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-48"
                                        />
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30 shrink-0">
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
                                                <tr className="border-b border-slate-100/80 dark:border-gray-700 bg-slate-50/50/50 dark:bg-gray-800/50 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                                    <th className="p-4">Користувач</th>
                                                    <th className="p-4">Об'єкт / Корпус</th>
                                                    <th className="p-4">Поверх / Кімната</th>
                                                    <th className="p-4 text-right">Дії</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm text-gray-700">
                                                {filteredPendingBookings.map((booking) => (
                                                    <tr key={booking.id} className="hover:bg-slate-50/50/30 dark:hover:bg-gray-700/20 transition-colors">
                                                        <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                            <div>{booking.user?.name}</div>
                                                            <div className="text-xs text-gray-400 dark:text-gray-500 font-normal">{booking.user?.email}</div>
                                                        </td>
                                                        <td className="p-4 text-gray-600 dark:text-gray-300">
                                                            {booking.new_room_id ? (
                                                                <>
                                                                    <span className="line-through text-gray-400 dark:text-gray-550">{booking.room?.building?.name}</span> →
                                                                    <span className="font-bold text-amber-600 dark:text-amber-400"> {booking.new_room?.building?.name}</span>
                                                                    <span className="block text-xs text-amber-600 dark:text-amber-400 font-bold">Запит на переїзд</span>
                                                                </>
                                                            ) : (
                                                                <>{booking.room?.building?.name}</>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-gray-600 dark:text-gray-300">
                                                            {booking.new_room_id ? (
                                                                <>
                                                                    <span className="line-through text-gray-400 dark:text-gray-550">№{booking.room?.room_number}</span> →
                                                                    <span className="font-bold text-amber-600 dark:text-amber-400"> №{booking.new_room?.room_number}</span>
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
                                                                        className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-800 dark:hover:text-emerald-350 disabled:opacity-50"
                                                                    >
                                                                        {actionProcessingId === booking.id ? '...' : 'Затвердити'}
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleReject(booking.id)}
                                                                        disabled={actionProcessingId !== null}
                                                                        className="inline-flex items-center text-red-600 dark:text-red-400 font-bold hover:text-red-800 dark:hover:text-red-350 disabled:opacity-50"
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
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm p-6 space-y-4">
                                <div className="border-b border-slate-100/80 dark:border-gray-700 pb-3">
                                    <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">Додати новий корпус</h3>
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
                                            className="w-full text-sm rounded-lg border border-slate-100 dark:border-gray-600 p-2.5 focus:border-emerald-500 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={buildingForm.processing}
                                        className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-900 dark:bg-emerald-600 text-white hover:bg-gray-800 dark:hover:bg-emerald-500 transition-all shadow-sm disabled:opacity-50 w-full sm:w-auto whitespace-nowrap"
                                    >
                                        {buildingForm.processing ? 'Збереження...' : 'Додати корпус'}
                                    </button>
                                </form>
                            </div>

                            {/* ================= 2. ІНТЕРФЕЙС КОНСТРУКТОРА КІМНАТ ================= */}
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm p-6 space-y-4">
                                <div className="border-b border-slate-100/80 dark:border-gray-700 pb-3">
                                    <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">Конструктор кімнат</h3>
                                    <p className="text-xs text-gray-400">Швидке групове створення номерного фонду для об'єктів</p>
                                </div>

                                <form onSubmit={handleBulkCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Оберіть корпус</label>
                                        <select
                                            value={bulkForm.data.building_id}
                                            onChange={e => bulkForm.setData('building_id', e.target.value)}
                                            className="w-full text-sm rounded-lg border border-slate-100 dark:border-gray-600 p-2.5 focus:border-emerald-500 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                                            className="w-full text-sm rounded-lg border border-slate-100 dark:border-gray-600 p-2.5 focus:border-emerald-500 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Кількість кімнат</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={bulkForm.data.count}
                                            onChange={e => bulkForm.setData('count', e.target.value)}
                                            className="w-full text-sm rounded-lg border border-slate-100 dark:border-gray-600 p-2.5 focus:border-emerald-500 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Місткість кімнати</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={bulkForm.data.max_capacity}
                                            onChange={e => bulkForm.setData('max_capacity', e.target.value)}
                                            className="w-full text-sm rounded-lg border border-slate-100 dark:border-gray-600 p-2.5 focus:border-emerald-500 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    <div className="sm:col-span-2 lg:col-span-4 text-right pt-2">
                                        <button
                                            type="submit"
                                            disabled={bulkForm.processing}
                                            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-900 dark:bg-emerald-600 text-white hover:bg-gray-800 dark:hover:bg-emerald-500 transition-all shadow-sm disabled:opacity-50"
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
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">Карта корпусів МНАУ</h3>
                                    <p className="text-xs text-gray-400">Інтерактивна схема кімнат та розселення</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    <select
                                        value={selectedBuildingFilter}
                                        onChange={e => setSelectedBuildingFilter(e.target.value)}
                                        className="text-xs rounded-lg border border-slate-100 dark:border-gray-600 p-2.5 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-48"
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
                                        className="text-xs rounded-lg border border-slate-100 dark:border-gray-600 p-2.5 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-48"
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
                                        <div key={building.id} className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm p-6 space-y-6">
                                            <div className="border-b border-slate-100/80 pb-3 flex justify-between items-center">
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
                                                                    {floorRooms
                                                        .filter(room => {
                                                            if (!genderFilter) return true;
                                                            const rg = getRoomGender(room);
                                                            if (genderFilter === 'empty') return rg.type === 'empty';
                                                            return rg.type === genderFilter;
                                                        })
                                                        .map(room => {
                                                                        const approvedBookings = room.bookings?.filter(b => b.status === 'approved' || (b.status === 'pending' && b.new_room_id !== null)) || [];
                                                                        const isFull = approvedBookings.length >= room.max_capacity;

                                                                        return (
                                                                            <div
                                                                                key={room.id}
                                                                                className={`p-4 rounded-xl border flex flex-col justify-between min-h-[180px] transition-all relative ${
                                                                                    isFull 
                                                                                        ? 'bg-red-50/20 dark:bg-red-950/10 border-red-200/50 dark:border-red-800/40 shadow-2xs' 
                                                                                        : 'bg-emerald-50/10 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-800/40 shadow-2xs'
                                                                                }`}
                                                                            >
                                                                                <div>
                                                                                    <div className="flex justify-between items-center mb-1.5">
                                                                                        <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                                                                            <span>Кімната №{room.room_number}</span>
                                                                                            {room.status !== 'closed' && (
                                                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getRoomGender(room).badgeBg}`}>
                                                                                                    {getRoomGender(room).label}
                                                                                                </span>
                                                                                            )}
                                                                                        </span>
                                                                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Місткість: {room.max_capacity}</span>
                                                                                    </div>

                                                                                    {/* Слот-візуалізатор (Occupancy beds) */}
                                                                                    <div className="flex gap-1.5 my-2 flex-wrap">
                                                                                        {Array.from({ length: room.max_capacity }).map((_, slotIdx) => {
                                                                                            const isOccupied = slotIdx < approvedBookings.length;
                                                                                            const occupantGender = isOccupied ? approvedBookings[slotIdx]?.user?.gender : null;
                                                                                            const occupantName = isOccupied ? approvedBookings[slotIdx]?.user?.name : 'Вільне ліжко';
                                                                                            return (
                                                                                                <BedIcon
                                                                                                    key={slotIdx}
                                                                                                    gender={occupantGender}
                                                                                                    isOccupied={isOccupied}
                                                                                                    name={occupantName}
                                                                                                />
                                                                                            );
                                                                                        })}
                                                                                    </div>

                                                                                    {/* Список жильцов */}
                                                                                    <div className="space-y-1 my-3">
                                                                                        {approvedBookings.map(b => (
                                                                                            <div key={b.id} className="flex justify-between items-center text-xs bg-white dark:bg-gray-900/40 border border-slate-100/80 dark:border-gray-700 p-1.5 rounded-lg shadow-3xs gap-1">
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
                                                                                                        className="text-gray-400 dark:text-gray-500 hover:text-indigo-650 dark:hover:text-indigo-400 font-semibold transition-colors"
                                                                                                        title="Переселити жильця"
                                                                                                    >
                                                                                                        ⇄
                                                                                                    </button>
                                                                                                    <button
                                                                                                        onClick={() => handleDeleteBooking(b.id)}
                                                                                                        disabled={deleteProcessingId === b.id}
                                                                                                        className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 font-bold px-1 transition-colors text-sm leading-none disabled:opacity-50"
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
                                                                                        className="w-full text-center bg-white dark:bg-gray-700 border border-slate-100 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 text-xs py-2 font-medium rounded-lg transition-all shadow-3xs active:scale-[0.98] mt-2"
                                                                                    >
                                                                                        + Заселити вручну
                                                                                    </button>
                                                                                )}
                                                                                {/* Кнопка блокування кімнати */}
                                                                                <button
                                                                                    onClick={() => handleToggleRoomStatus(room.id)}
                                                                                    className={`w-full text-center text-xs py-1.5 font-medium rounded-lg transition-all shadow-3xs active:scale-[0.98] mt-1 ${
                                                                                        room.status === 'closed'
                                                                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                                                                                            : 'bg-slate-50/50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-500 dark:text-gray-400'
                                                                                    }`}
                                                                                >
                                                                                    {room.status === 'closed' ? '🔓 Відкрити кімнату' : '🔒 Закрити на ремонт'}
                                                                                </button>
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
                        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100/80">
                                <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">Заявки на ремонт та обслуговування</h3>
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
                                            <tr className="border-b border-slate-100/80 dark:border-gray-700 bg-slate-50/50/50 dark:bg-gray-800/50 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                                <th className="p-4">Студент</th>
                                                <th className="p-4">Кімната / Корпус</th>
                                                <th className="p-4">Опис поломки</th>
                                                <th className="p-4">Статус</th>
                                                <th className="p-4 text-right">Дія</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm text-gray-700">
                                            {tickets.map(t => (
                                                <tr key={t.id} className="hover:bg-slate-50/50/30 dark:hover:bg-gray-700/20 transition-colors">
                                                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                        <div>{t.user?.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-normal">{t.user?.email}</div>
                                                    </td>
                                                    <td className="p-4 text-gray-600 dark:text-gray-300">
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
                        <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100/80 dark:border-gray-700 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">Журнал аудиту дій</h3>
                                    <p className="text-xs text-gray-400">Лог адміністративних дій та статусів заселення</p>
                                </div>
                                {auditLogs.length > 0 && (
                                    <button
                                        onClick={handleClearLogs}
                                        className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/45 text-red-700 dark:text-red-300 text-xs font-bold rounded-lg transition-colors border border-red-200/50 dark:border-red-800/40"
                                    >
                                        Очистити журнал
                                    </button>
                                )}
                            </div>

                            {auditLogs.length === 0 ? (
                                <div className="p-8 text-center text-sm text-gray-500">
                                    Журнал порожній.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-100/80 dark:border-gray-700 bg-slate-50/50/50 dark:bg-gray-800/50 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                                <th className="p-4">Студент</th>
                                                <th className="p-4">Дія</th>
                                                <th className="p-4">Подробиці</th>
                                                <th className="p-4">Дата / Час</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-[13px] text-gray-700">
                                            {auditLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-slate-50/50/30 dark:hover:bg-gray-700/20 transition-colors">
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
                                                            log.action.includes('approved') ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300' : log.action.includes('rejected') || log.action.includes('evicted') ? 'bg-red-50 dark:bg-red-950/20 text-red-855 dark:text-red-300' : log.action.includes('relocation') ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                                        }`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                                        {log.details}
                                                    </td>
                                                    <td className="p-4 text-gray-400">
                                                        {new Date(log.created_at).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'academic_settings' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Напрями */}
                                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm p-6 space-y-4">
                                    <div className="border-b border-slate-100/80 dark:border-gray-700 pb-3">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Напрями навчання</h3>
                                        <p className="text-[11px] text-gray-400">Спеціальності або напрями підготовки студентів</p>
                                    </div>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        specialtyForm.post(route('admin.specialties.store'), {
                                            onSuccess: () => specialtyForm.reset()
                                        });
                                    }} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Напр. КН"
                                            value={specialtyForm.data.name}
                                            onChange={e => specialtyForm.setData('name', e.target.value.toUpperCase())}
                                            className="text-xs rounded-lg border border-slate-100 dark:border-gray-600 p-2 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={specialtyForm.processing}
                                            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                                        >
                                            Додати
                                        </button>
                                    </form>
                                    <div className="divide-y divide-slate-100 dark:divide-gray-700 border border-slate-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                                        {specialties.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-gray-400">Напрями відсутні</div>
                                        ) : (
                                            specialties.map(spec => (
                                                <div key={spec.id} className="p-3 flex justify-between items-center text-xs text-gray-800 dark:text-gray-200 bg-slate-50/20">
                                                    <span className="font-bold">{spec.name}</span>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Ви впевнені, що хочете видалити напрям ${spec.name}?`)) {
                                                                router.post(route('admin.specialties.destroy', spec.id));
                                                            }
                                                        }}
                                                        className="text-red-500 font-bold hover:underline"
                                                    >
                                                        Видалити
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Курси */}
                                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm p-6 space-y-4">
                                    <div className="border-b border-slate-100/80 pb-3">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Курси</h3>
                                        <p className="text-[11px] text-gray-400">Роки навчання або номери курсів</p>
                                    </div>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        courseForm.post(route('admin.courses.store'), {
                                            onSuccess: () => courseForm.reset()
                                        });
                                    }} className="flex gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            placeholder="Напр. 1"
                                            value={courseForm.data.number}
                                            onChange={e => courseForm.setData('number', e.target.value)}
                                            className="text-xs rounded-lg border border-slate-100 dark:border-gray-600 p-2 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={courseForm.processing}
                                            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                                        >
                                            Додати
                                        </button>
                                    </form>
                                    <div className="divide-y divide-slate-100 dark:divide-gray-700 border border-slate-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                                        {courses.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-gray-400">Курси відсутні</div>
                                        ) : (
                                            courses.map(c => (
                                                <div key={c.id} className="p-3 flex justify-between items-center text-xs text-gray-800 dark:text-gray-200 bg-slate-50/20">
                                                    <span className="font-bold">{c.number} курс</span>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Ви впевнені, що хочете видалити курс ${c.number}?`)) {
                                                                router.post(route('admin.courses.destroy', c.id));
                                                            }
                                                        }}
                                                        className="text-red-500 font-bold hover:underline"
                                                    >
                                                        Видалити
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Групи */}
                                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm p-6 space-y-4">
                                    <div className="border-b border-slate-100/80 pb-3">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Академічні групи</h3>
                                        <p className="text-[11px] text-gray-400">Номери або ідентифікатори академічних груп</p>
                                    </div>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        groupForm.post(route('admin.groups.store'), {
                                            onSuccess: () => groupForm.reset()
                                        });
                                    }} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Напр. 11"
                                            value={groupForm.data.name}
                                            onChange={e => groupForm.setData('name', e.target.value)}
                                            className="text-xs rounded-lg border border-slate-100 dark:border-gray-600 p-2 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex-1"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={groupForm.processing}
                                            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                                        >
                                            Додати
                                        </button>
                                    </form>
                                    <div className="divide-y divide-slate-100 dark:divide-gray-700 border border-slate-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                                        {groups.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-gray-400">Групи відсутні</div>
                                        ) : (
                                            groups.map(g => (
                                                <div key={g.id} className="p-3 flex justify-between items-center text-xs text-gray-800 dark:text-gray-200 bg-slate-50/20">
                                                    <span className="font-bold">Група {g.name}</span>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Ви впевнені, що хочете видалити групу ${g.name}?`)) {
                                                                router.post(route('admin.groups.destroy', g.id));
                                                            }
                                                        }}
                                                        className="text-red-500 font-bold hover:underline"
                                                    >
                                                        Видалити
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users_gen' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Генератор аккаунтов */}
                                <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm p-6 space-y-4 h-fit">
                                    <div className="border-b border-slate-100/80 dark:border-gray-700 pb-3">
                                        <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">Генератор акаунтів</h3>
                                        <p className="text-xs text-gray-400">Створення тимчасових облікових записів для студентів</p>
                                    </div>
                                     <form onSubmit={handleGenerateUsers} className="space-y-4">
                                         <div className="space-y-1">
                                             <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Кількість акаунтів для створення</label>
                                             <input
                                                 type="number"
                                                 min="1"
                                                 max="50"
                                                 value={genForm.data.count}
                                                 onChange={e => genForm.setData('count', e.target.value)}
                                                 className="w-full text-sm rounded-lg border border-slate-100 dark:border-gray-600 p-2.5 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                 required
                                             />
                                         </div>
                                         <div className="space-y-1">
                                             <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Стать для акаунтів</label>
                                             <select
                                                 value={genForm.data.gender}
                                                 onChange={e => genForm.setData('gender', e.target.value)}
                                                 className="w-full text-sm rounded-lg border border-slate-100 dark:border-gray-600 p-2.5 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                             >
                                                 <option value="">Не вказано (пустий)</option>
                                                 <option value="male">Чоловіча</option>
                                                 <option value="female">Жіноча</option>
                                             </select>
                                         </div>
                                         <button
                                             type="submit"
                                             disabled={genForm.processing}
                                             className="w-full justify-center inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
                                         >
                                             {genForm.processing ? 'Генерація...' : 'Згенерувати акаунти'}
                                         </button>
                                     </form>
                                 </div>
 
                                 {/* Список згенерованих аккаунтов */}
                                 <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm p-6 space-y-4">
                                     <div className="border-b border-slate-100/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                         <div>
                                             <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">Нові згенеровані акаунти</h3>
                                             <p className="text-xs text-gray-400">Тимчасові логіни та паролі поточної сесії</p>
                                         </div>
                                         {generatedUsers && generatedUsers.length > 0 && (
                                             <div className="flex gap-2">
                                                 <button
                                                     onClick={copyAllCredentials}
                                                     className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-100 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-slate-50/50 dark:hover:bg-gray-600 transition-colors"
                                                 >
                                                     Скопіювати всі
                                                 </button>
                                                 <button
                                                     onClick={handleExportPDF}
                                                     className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm"
                                                 >
                                                     Експорт в PDF
                                                 </button>
                                             </div>
                                         )}
                                     </div>
 
                                     {!generatedUsers || generatedUsers.length === 0 ? (
                                         <div className="p-8 text-center text-xs text-gray-400 dark:text-gray-500 bg-slate-50/50/50 dark:bg-gray-900/30 rounded-xl border border-dashed border-slate-100 dark:border-gray-700">
                                             Тут відобразяться згенеровані акаунти після запуску генератора.
                                         </div>
                                     ) : (
                                         <div className="overflow-x-auto border border-slate-100/80 rounded-xl">
                                             <table className="w-full text-left border-collapse text-xs">
                                                 <thead>
                                                     <tr className="border-b border-slate-100/80 dark:border-gray-700 bg-slate-50/50/50 dark:bg-gray-800/50 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                                         <th className="p-3">Тимчасове ім'я</th>
                                                         <th className="p-3">Стать</th>
                                                         <th className="p-3">Email</th>
                                                         <th className="p-3">Пароль</th>
                                                         <th className="p-3 text-right">Дії</th>
                                                     </tr>
                                                 </thead>
                                                 <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-[13px] text-gray-600">
                                                     {generatedUsers.map((user, idx) => (
                                                         <tr key={idx} className="hover:bg-slate-50/50/30">
                                                             <td className="p-3 font-semibold text-gray-900 dark:text-white">{user.name}</td>
                                                             <td className="p-3">{renderGenderBadge(user.gender)}</td>
                                                             <td className="p-3 font-mono">{user.email}</td>
                                                             <td className="p-3 font-mono text-emerald-700 font-bold">{user.password}</td>
                                                             <td className="p-3 text-right">
                                                                 <button
                                                                     onClick={() => copyToClipboard(`Email: ${user.email} | Пароль: ${user.password}`)}
                                                                     className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                                                                 >
                                                                     Скопіювати
                                                                 </button>
                                                             </td>
                                                         </tr>
                                                     ))}
                                                 </tbody>
                                             </table>
                                         </div>
                                     )}
                                </div>
                            </div>

                            {/* Список всіх студентів */}
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm p-6 space-y-4">
                                <div className="border-b border-slate-100/80 pb-3 flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">Список всіх студентів</h3>
                                        <p className="text-xs text-gray-400">Управління та фільтрація студентського складу</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Спеціальність:</span>
                                            <select
                                                value={userSpecialtyFilter}
                                                onChange={e => setUserSpecialtyFilter(e.target.value)}
                                                className="text-[11px] rounded-lg border border-slate-100 dark:border-gray-600 p-1.5 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                <option value="">Всі</option>
                                                {uniqueSpecialties.map(spec => (
                                                    <option key={spec} value={spec}>{spec}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Курс:</span>
                                            <select
                                                value={userCourseFilter}
                                                onChange={e => setUserCourseFilter(e.target.value)}
                                                className="text-[11px] rounded-lg border border-slate-100 dark:border-gray-600 p-1.5 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                <option value="">Всі</option>
                                                {uniqueCourses.map(c => (
                                                    <option key={c} value={c}>{c} курс</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Група:</span>
                                            <select
                                                value={userGroupFilter}
                                                onChange={e => setUserGroupFilter(e.target.value)}
                                                className="text-[11px] rounded-lg border border-slate-100 dark:border-gray-600 p-1.5 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                <option value="">Всі групи</option>
                                                {uniqueGroups.map(grp => (
                                                    <option key={grp} value={grp}>{grp}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Стать:</span>
                                            <select
                                                value={userGenderFilter}
                                                onChange={e => setUserGenderFilter(e.target.value)}
                                                className="text-[11px] rounded-lg border border-slate-100 dark:border-gray-600 p-1.5 focus:border-emerald-600 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                <option value="">Всі статі</option>
                                                <option value="male">Чоловіки</option>
                                                <option value="female">Жінки</option>
                                            </select>
                                        </div>

                                        {(userSpecialtyFilter || userCourseFilter || userGroupFilter || userGenderFilter) && (
                                            <button
                                                onClick={() => {
                                                    setUserSpecialtyFilter('');
                                                    setUserCourseFilter('');
                                                    setUserGroupFilter('');
                                                    setUserGenderFilter('');
                                                }}
                                                className="text-[10px] font-bold text-red-500 dark:text-red-400 hover:underline uppercase tracking-wider"
                                            >
                                                Скинути фільтри
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {filteredAllUsers.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-gray-500">
                                        Студентів не знайдено.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-100/80 dark:border-gray-700 bg-slate-50/50/50 dark:bg-gray-800/50 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                                    <th className="p-3 cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" onClick={() => handleSort('name')}>
                                                        Ім'я {renderSortArrow('name')}
                                                    </th>
                                                    <th className="p-3 cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" onClick={() => handleSort('gender')}>
                                                        Стать {renderSortArrow('gender')}
                                                    </th>
                                                    <th className="p-3 cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" onClick={() => handleSort('email')}>
                                                        Email {renderSortArrow('email')}
                                                    </th>
                                                    <th className="p-3 cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" onClick={() => handleSort('telegram')}>
                                                        Telegram {renderSortArrow('telegram')}
                                                    </th>
                                                    <th className="p-3 cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" onClick={() => handleSort('phone')}>
                                                        Телефон {renderSortArrow('phone')}
                                                    </th>
                                                    <th className="p-3 cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" onClick={() => handleSort('must_change_password')}>
                                                        Статус профілю {renderSortArrow('must_change_password')}
                                                     </th>
                                                    <th className="p-3 cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" onClick={() => handleSort('created_at')}>
                                                        Дата реєстрації {renderSortArrow('created_at')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-[13px] text-gray-700">
                                                {sortedAllUsers.map(u => (
                                                    <tr key={u.id} className="hover:bg-slate-50/50/30 dark:hover:bg-gray-700/20 transition-colors">
                                                        <td className="p-3 font-semibold text-gray-900 dark:text-white">{u.name}</td>
                                                        <td className="p-3">{renderGenderBadge(u.gender)}</td>
                                                        <td className="p-3 font-mono">{u.email}</td>
                                                        <td className="p-3 text-emerald-600">
                                                            {u.telegram ? (
                                                                <a href={`https://t.me/${u.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium">
                                                                    {u.telegram}
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-300 italic">немає</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-gray-600">{u.phone || <span className="text-gray-300 italic">немає</span>}</td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                                                u.must_change_password ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40'
                                                            }`}>
                                                                {u.must_change_password ? 'Очікує налаштування' : 'Готово'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-gray-400">
                                                            {new Date(u.created_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    {/* ================= МОДАЛЬНОЕ ОКНО ДЛЯ РУЧНОГО ЗАСЕЛЕНИЯ ================= */}
                    {selectedRoomForManual && (
                        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
                                <div className="border-b border-slate-100/80 dark:border-gray-700 pb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Пряме призначення</span>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Заселення в кімнату №{selectedRoomForManual.room_number}
                                    </h3>
                                </div>

                                <form onSubmit={handleManualSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Оберіть користувача</label>
                                        <select
                                            value={manualForm.data.user_id}
                                            onChange={e => manualForm.setData('user_id', e.target.value)}
                                            className="w-full text-sm rounded-lg border border-slate-100 dark:border-gray-600 p-2.5 focus:border-emerald-500 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            required
                                                                        >
                                            <option value="" disabled>-- Оберіть студента --</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} ({u.email}){u.gender ? ` — ${u.gender === 'male' ? 'Чоловік' : 'Жінка'}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRoomForManual(null)}
                                            className="px-4 py-2 border border-slate-100 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-slate-50/50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Скасувати
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={manualForm.processing}
                                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-900 dark:bg-emerald-600 text-white hover:bg-gray-800 dark:hover:bg-emerald-500 transition-all shadow-sm disabled:opacity-50"
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
                            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
                                <div className="border-b border-slate-100/80 dark:border-gray-700 pb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Переселення жильця</span>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Переселити: {reallocateBookingData.user?.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Поточна кімната: №{reallocateCurrentRoom.room_number} (Поверх {reallocateCurrentRoom.floor})
                                    </p>
                                </div>

                                <form onSubmit={handleReallocateSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Оберіть нову кімнату</label>
                                        <select
                                            value={selectedReallocateRoomId}
                                            onChange={e => setSelectedReallocateRoomId(e.target.value)}
                                            className="w-full text-sm rounded-lg border border-slate-100 dark:border-gray-600 p-2.5 focus:border-emerald-500 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                                            className="px-4 py-2 border border-slate-100 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-slate-50/50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Скасувати
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-900 dark:bg-emerald-600 text-white hover:bg-gray-800 dark:hover:bg-emerald-500 transition-all shadow-sm"
                                        >
                                            Переселити
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* ===== МОДАЛКА ПРИЧИНИ ВІДХИЛЕННЯ ===== */}
                    {rejectModalBookingId && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setRejectModalBookingId(null)}>
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-100 dark:border-gray-700 w-full max-w-md p-6 space-y-4 mx-4" onClick={e => e.stopPropagation()}>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">Відхилити заявку</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Вкажіть причину відхилення (необов'язково). Студент побачить це пояснення.</p>
                                </div>

                                <textarea
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    placeholder="Наприклад: Перевищено ліміт мешканців у кімнаті, оберіть іншу..."
                                    className="w-full text-sm rounded-xl border border-slate-100 dark:border-gray-700 p-3 focus:border-red-400 focus:ring-0 bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none h-24"
                                    maxLength={500}
                                />
                                <p className="text-[10px] text-gray-400 text-right">{rejectReason.length}/500</p>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setRejectModalBookingId(null)}
                                        className="px-4 py-2 border border-slate-100 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-slate-50/50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Скасувати
                                    </button>
                                    <button
                                        type="button"
                                        onClick={submitReject}
                                        disabled={actionProcessingId !== null}
                                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
                                    >
                                        {actionProcessingId ? '...' : 'Підтвердити відхилення'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
