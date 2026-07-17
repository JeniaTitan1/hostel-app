<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use App\Models\Ticket;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    /**
     * Главная страница админки (список заявок, комнат и свободных пользователей)
     */
    public function index()
    {
        $buildings = Building::with(['rooms.bookings.user', 'rooms.bookings.newRoom'])->get();

        // Получаем все заявки, которые требуют внимания админа (только со статусом pending)
        $pendingBookings = Booking::with(['user', 'room.building', 'room.bookings.user', 'newRoom.building', 'newRoom.bookings.user'])
            ->where('status', 'pending')
            ->get();

        $users = User::where('role', 'user')
            ->whereDoesntHave('bookings', function ($query) {
                $query->where('status', 'approved');
            })
            ->get(['id', 'name', 'email', 'gender']);

        $tickets = Ticket::with(['user', 'room.building'])->orderBy('created_at', 'desc')->get();
        $auditLogs = AuditLog::with('user')->orderBy('created_at', 'desc')->take(100)->get();

        $allUsers = User::where('role', 'user')
            ->orderBy('created_at', 'desc')
            ->get([
                'id', 'name', 'email', 'gender', 'telegram', 'phone', 
                'must_change_password', 'password_changed', 'created_at',
                'specialty', 'course', 'group'
            ]);

        // Аналітика по корпусах
        $stats = [
            'total_rooms'    => \App\Models\Room::count(),
            'total_capacity' => \App\Models\Room::sum('max_capacity'),
            'occupied'       => Booking::where('status', 'approved')->count(),
            'pending'        => Booking::where('status', 'pending')->count(),
            'open_tickets'   => \App\Models\Ticket::whereIn('status', ['open', 'in_progress'])->count(),
            'buildings'      => $buildings->map(function ($b) {
                $capacity = $b->rooms->sum('max_capacity');
                $occupied = $b->rooms->flatMap->bookings->where('status', 'approved')->count();
                return [
                    'id'       => $b->id,
                    'name'     => $b->name,
                    'capacity' => $capacity,
                    'occupied' => $occupied,
                    'free'     => max(0, $capacity - $occupied),
                ];
            })->values(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'pendingBookings' => $pendingBookings,
            'buildings'       => $buildings,
            'users'           => $users,
            'tickets'         => $tickets,
            'auditLogs'       => $auditLogs,
            'allUsers'        => $allUsers,
            'generatedUsers'  => session('generated_users'),
            'stats'           => $stats,
        ]);
    }
    public function requestReallocate(Request $request, Booking $booking)
    {
        // Перевіряємо, чи це дійсно бронювання цього користувача
        if ($booking->user_id !== $request->user()->id) {
            abort(403, 'Немає доступу.');
        }

        $request->validate([
            'room_id' => 'required|exists:rooms,id',
        ]);

        $targetRoom = Room::findOrFail($request->room_id);

        // Перевіряємо, чи є вільні місця в кімнаті, куди він хоче переїхати
        $activeBookingsCount = Booking::where('room_id', $targetRoom->id)
            ->where('status', 'approved')
            ->count();

        if ($activeBookingsCount >= $targetRoom->max_capacity) {
            return redirect()->back()->with('error', 'В обраній кімнаті немає місць!');
        }

        // Записуємо бажану кімнату в new_room_id. Саму кімнату (room_id) поки НЕ міняємо!
        $booking->update([
            'new_room_id' => $targetRoom->id,
        ]);

        AuditLog::log($booking->user_id, 'relocation_requested', "Надіслано запит на переселення з кімнати №" . ($booking->room->room_number ?? '?') . " до №{$targetRoom->room_number} ({$targetRoom->building->name})");

        return redirect()->back()->with('success', 'Заявку на переселення успішно надіслано на розгляд адміну!');
    }

    /**
     * Конструктор комнат (Групповое создание)
     */
    public function bulkCreateRooms(Request $request)
    {
        $request->validate([
            'building_id' => 'required|exists:buildings,id',
            'floor' => 'required|integer|min:1',
            'count' => 'required|integer|min:1|max:100',
            'max_capacity' => 'required|integer|min:1|max:20',
        ]);

        $buildingId = $request->building_id;
        $floor = $request->floor;
        $count = $request->count;
        $maxCapacity = $request->max_capacity;

        $lastRoom = Room::where('building_id', $buildingId)
            ->where('floor', $floor)
            ->orderBy('room_number', 'desc')
            ->first();

        $startNumber = $lastRoom ? ((int)$lastRoom->room_number + 1) : ($floor * 100 + 1);

        for ($i = 0; $i < $count; $i++) {
            Room::create([
                'building_id' => $buildingId,
                'floor' => $floor,
                'room_number' => (string)($startNumber + $i),
                'max_capacity' => $maxCapacity,
            ]);
        }

        $building = Building::find($buildingId);
        AuditLog::log(null, 'rooms_bulk_created', "Створено {$count} кімнат на {$floor} поверсі для корпусу \"{$building->name}\"");

        return redirect()->back()->with('success', "Успішно створено {$count} кімнат!");
    }

    /**
     * Подтверждение бронирования (Approve)
     */
    public function approveBooking(Booking $booking)
    {
        // 1. Перевіряємо місткість кімнати
        // Якщо це переїзд (є new_room_id), перевіряємо нову кімнату, інакше - поточну
        $targetRoomId = $booking->new_room_id ?? $booking->room_id;
        $targetRoom = Room::findOrFail($targetRoomId);

        $activeBookingsCount = Booking::where('room_id', $targetRoom->id)
            ->where(function ($query) {
                $query->where('status', 'approved')
                      ->orWhere(function ($q) {
                          $q->where('status', 'pending')
                            ->whereNotNull('new_room_id');
                      });
            })
            ->count();

        if ($activeBookingsCount >= $targetRoom->max_capacity) {
            return redirect()->back()->with('error', 'У цій кімнаті більше немає вільних місць!');
        }

        // 2. Оновлюємо дані
        $updateData = ['status' => 'approved'];
        $oldRoomNumber = $booking->room->room_number ?? '?';

        // Якщо це був запит на переїзд, переносимо жильця
        if ($booking->new_room_id) {
            $newRoom = Room::find($booking->new_room_id);
            $updateData['room_id'] = $booking->new_room_id;
            $updateData['new_room_id'] = null;
            
            $booking->update($updateData);
            AuditLog::log($booking->user_id, 'relocation_approved', "Ухвалено переїзд користувача {$booking->user->name} з кімнати №{$oldRoomNumber} до №{$newRoom->room_number}");
            
            \App\Models\Notification::create([
                'user_id' => $booking->user_id,
                'title' => 'Запит на переселення схвалено',
                'message' => "Ваш запит на переселення з кімнати №{$oldRoomNumber} до кімнати №{$newRoom->room_number} схвалено.",
            ]);
        } else {
            $booking->update($updateData);
            AuditLog::log($booking->user_id, 'booking_approved', "Ухвалено заселення користувача {$booking->user->name} до кімнати №{$booking->room->room_number}");
            
            \App\Models\Notification::create([
                'user_id' => $booking->user_id,
                'title' => 'Заявку на заселення схвалено',
                'message' => "Вашу заявку на заселення до кімнати №{$booking->room->room_number} схвалено.",
            ]);
        }

        return redirect()->back()->with('success', 'Заявку успішно оброблено!');
    }
    /**
     * Отклонение бронирования (Reject)
     */
    public function rejectBooking(Request $request, Booking $booking)
    {
        $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        if ($booking->new_room_id) {
            $targetRoom = Room::find($booking->new_room_id);
            $booking->update([
                'new_room_id' => null,
                'status'      => 'approved',
            ]);

            AuditLog::log($booking->user_id, 'relocation_rejected', "Відхилено переїзд користувача {$booking->user->name} до кімнати №{$targetRoom->room_number}");
            
            $reason = $request->input('rejection_reason');
            $reasonText = $reason ? " Причина: {$reason}." : "";
            \App\Models\Notification::create([
                'user_id' => $booking->user_id,
                'title' => 'Запит на переселення відхилено',
                'message' => "Ваш запит на переселення до кімнати №{$targetRoom->room_number} відхилено.{$reasonText}",
            ]);

            return redirect()->back()->with('success', 'Запит на переселення відхилено. Користувач залишається в поточній кімнаті.');
        }

        $booking->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->input('rejection_reason'),
        ]);
        AuditLog::log($booking->user_id, 'booking_rejected', "Відхилено заселення користувача {$booking->user->name} до кімнати №{$booking->room->room_number}");

        $reason = $request->input('rejection_reason');
        $reasonText = $reason ? " Причина: {$reason}." : " Без вказання причини.";
        \App\Models\Notification::create([
            'user_id' => $booking->user_id,
            'title' => 'Заявку на заселення відхилено',
            'message' => "Вашу заявку на заселення до кімнати №{$booking->room->room_number} відхилено.{$reasonText}",
        ]);

        return redirect()->back()->with('success', 'Бронювання відхилено.');
    }

    /**
     * Перемкнути статус кімнати (active ↔ closed)
     */
    public function toggleRoomStatus(Request $request, Room $room)
    {
        $newStatus = $room->status === 'closed' ? 'active' : 'closed';

        if ($newStatus === 'closed') {
            $activeBookingsCount = Booking::where('room_id', $room->id)
                ->where(function ($query) {
                    $query->where('status', 'approved')
                          ->orWhere(function ($q) {
                              $q->where('status', 'pending')
                                ->whereNotNull('new_room_id');
                          });
                })
                ->count();

            if ($activeBookingsCount > 0) {
                return redirect()->back()->withErrors([
                    'error' => 'Не вдається закрити кімнату: спершу переселіть усіх мешканців у інші кімнати!'
                ]);
            }

            $request->validate([
                'closure_reason' => 'required|string|max:255',
                'closure_duration' => 'required|string|max:255',
                'hide_from_frontend' => 'nullable|boolean',
            ]);

            $room->update([
                'status' => 'closed',
                'closure_reason' => $request->closure_reason,
                'closure_duration' => $request->closure_duration,
                'hide_from_frontend' => $request->boolean('hide_from_frontend'),
            ]);
        } else {
            $room->update([
                'status' => 'active',
                'closure_reason' => null,
                'closure_duration' => null,
                'hide_from_frontend' => false,
            ]);
        }

        $label = $newStatus === 'closed' ? 'закрита на обслуговування' : 'відкрита';
        AuditLog::log($request->user()->id, 'room_status_toggled', "Кімната №{$room->room_number} {$label}");

        return redirect()->back()->with('success', "Статус кімнати №{$room->room_number} змінено на «{$label}».");
    }

    /**
     * Перемкнути набір у кімнату
     */
    public function toggleIntake(Request $request, Room $room)
    {
        $room->update(['intake_closed' => !$room->intake_closed]);
        $status = $room->intake_closed ? 'закритий' : 'відкритий';
        AuditLog::log($request->user()->id, 'room_intake_toggled', "Набір у кімнату №{$room->room_number} тепер {$status}");
        return redirect()->back()->with('success', "Набір у кімнату №{$room->room_number} тепер {$status}.");
    }

    /**
     * Перемкнути видимість кімнати на фронтенді
     */
    public function toggleVisibility(Request $request, Room $room)
    {
        $room->update(['hide_from_frontend' => !$room->hide_from_frontend]);
        $status = $room->hide_from_frontend ? 'прихована' : 'відображається';
        AuditLog::log($request->user()->id, 'room_visibility_toggled', "Кімната №{$room->room_number} тепер {$status} на фронтенді");
        return redirect()->back()->with('success', "Кімната №{$room->room_number} тепер {$status} на фронтенді.");
    }

    /**
     * Оновити місткість кімнати (кількість ліжок)
     */
    public function updateCapacity(Request $request, Room $room)
    {
        $request->validate([
            'max_capacity' => 'required|integer|min:1|max:20',
        ]);

        $newCapacity = $request->max_capacity;

        // Перевіряємо що нова місткість не менша за кількість поточних мешканців
        $activeBookingsCount = Booking::where('room_id', $room->id)
            ->where(function ($query) {
                $query->where('status', 'approved')
                      ->orWhere(function ($q) {
                          $q->where('status', 'pending')
                            ->whereNotNull('new_room_id');
                      });
            })
            ->count();

        if ($newCapacity < $activeBookingsCount) {
            return redirect()->back()->withErrors([
                'error' => "Неможливо зменшити місткість до {$newCapacity}: у кімнаті вже {$activeBookingsCount} мешканців."
            ]);
        }

        $oldCapacity = $room->max_capacity;
        $room->update(['max_capacity' => $newCapacity]);

        AuditLog::log($request->user()->id, 'room_capacity_updated', "Місткість кімнати №{$room->room_number} змінено з {$oldCapacity} на {$newCapacity}");
        return redirect()->back()->with('success', "Місткість кімнати №{$room->room_number} змінено на {$newCapacity}.");
    }

    /**
     * Переселение жильца в другую комнату
     */
    public function reallocateBooking(Request $request, Booking $booking)
    {
        $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'reason' => 'nullable|string|max:255',
            'force_mixed' => 'nullable|boolean',
        ]);

        $targetRoom = Room::findOrFail($request->room_id);
        $activeBookingsCount = Booking::where('room_id', $targetRoom->id)
            ->where(function ($query) {
                $query->where('status', 'approved')
                      ->orWhere(function ($q) {
                          $q->where('status', 'pending')
                            ->whereNotNull('new_room_id');
                      });
            })
            ->count();

        if ($activeBookingsCount >= $targetRoom->max_capacity) {
            return redirect()->back()->withErrors(['error' => 'В обраній кімнаті немає місць!']);
        }

        $userGender = $booking->user->gender;
        if ($userGender && !$request->boolean('force_mixed')) {
            $occupantGenders = User::whereIn('id', function($q) use ($targetRoom) {
                $q->select('user_id')
                  ->from('bookings')
                  ->where('room_id', $targetRoom->id)
                  ->where(function ($query) {
                      $query->where('status', 'approved')
                            ->orWhere(function ($sq) {
                                $sq->where('status', 'pending')
                                  ->whereNotNull('new_room_id');
                            });
                  });
            })->pluck('gender')->filter()->unique();

            if ($occupantGenders->isNotEmpty() && !$occupantGenders->contains($userGender)) {
                $genderLabel = $userGender === 'male' ? 'жіночу' : 'чоловічу';
                $targetGenderLabel = $occupantGenders->first() === 'male' ? 'чоловічою' : 'жіночою';
                return redirect()->back()->withErrors([
                    'error' => "Цільова кімната наразі є {$targetGenderLabel}. Ви намагаєтесь переселити {$genderLabel}. Підтвердіть створення змішаної кімнати.",
                ]);
            }
        }

        $oldRoomNumber = $booking->room->room_number ?? '?';
        $booking->update([
            'room_id' => $targetRoom->id,
            'new_room_id' => null,
            'status' => 'approved',
        ]);

        // Оновлюємо дані сповіщення для переселеного користувача
        $booking->user->update([
            'reallocated_notification' => true,
            'reallocated_from' => "кімнати №{$oldRoomNumber}",
            'reallocated_to' => "кімнати №{$targetRoom->room_number} ({$targetRoom->building->name})",
            'reallocated_reason' => $request->input('reason') ?: 'Виробнича необхідність',
        ]);

        \App\Models\Notification::create([
            'user_id' => $booking->user_id,
            'title' => 'Переселення',
            'message' => "Адміністратор переселив вас з кімнати №{$oldRoomNumber} до кімнати №{$targetRoom->room_number} ({$targetRoom->building->name}). Причина: " . ($request->input('reason') ?: 'Виробнича необхідність') . ".",
        ]);

        AuditLog::log($booking->user_id, 'manual_relocation', "Адміністратор переселив користувача {$booking->user->name} з кімнати №{$oldRoomNumber} до №{$targetRoom->room_number} ({$targetRoom->building->name})");

        return redirect()->back()->with('success', 'Користувача успішно переселено.');
    }

    /**
     * Выселение (удаление бронирования)
     */
    public function deleteBooking($id)
    {
        $booking = Booking::with('user', 'room')->findOrFail($id);
        $userName = $booking->user->name ?? 'Невідомий';
        $roomNumber = $booking->room->room_number ?? '?';
        $userId = $booking->user_id;

        $booking->delete();

        \App\Models\Notification::create([
            'user_id' => $userId,
            'title' => 'Виселення',
            'message' => "Вас виселено з кімнати №{$roomNumber}.",
        ]);

        AuditLog::log($userId, 'evicted', "Виселено користувача {$userName} з кімнати №{$roomNumber}");

        return redirect()->back()->with('success', 'Жильця успішно виселено!');
    }

    /**
     * Ручное бронирование админом
     */
    public function manualBooking(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'room_id' => 'required|exists:rooms,id',
            'force_mixed' => 'nullable|boolean',
        ]);

        $room = Room::findOrFail($request->room_id);
        $activeBookingsCount = Booking::where('room_id', $room->id)
            ->where(function ($query) {
                $query->where('status', 'approved')
                      ->orWhere(function ($q) {
                          $q->where('status', 'pending')
                            ->whereNotNull('new_room_id');
                      });
            })
            ->count();

        if ($activeBookingsCount >= $room->max_capacity) {
            return redirect()->back()->with('error', 'В цій кімнаті немає місць!');
        }

        $user = User::findOrFail($request->user_id);
        $userGender = $user->gender;

        // Перевірка на змішування статей (пропускається, якщо force_mixed === true)
        if ($userGender && !$request->boolean('force_mixed')) {
            $occupantGenders = User::whereIn('id', function($q) use ($room) {
                $q->select('user_id')
                  ->from('bookings')
                  ->where('room_id', $room->id)
                  ->where(function ($query) {
                      $query->where('status', 'approved')
                            ->orWhere(function ($sq) {
                                $sq->where('status', 'pending')
                                  ->whereNotNull('new_room_id');
                            });
                  });
            })->pluck('gender')->filter()->unique();

            if ($occupantGenders->isNotEmpty() && !$occupantGenders->contains($userGender)) {
                $roomGenderLabel = $occupantGenders->first() === 'male' ? 'чоловічою' : 'жіночою';
                $userGenderLabel = $userGender === 'male' ? 'чоловіка' : 'жінку';
                return redirect()->back()->withErrors([
                    'gender_conflict' => "Кімната наразі є {$roomGenderLabel}. Ви намагаєтесь заселити {$userGenderLabel}. Підтвердіть створення змішаної кімнати.",
                ]);
            }
        }

        // Delete any existing bookings for this user to avoid duplicates!
        Booking::where('user_id', $request->user_id)->delete();

        $booking = Booking::create([
            'user_id' => $request->user_id,
            'room_id' => $request->room_id,
            'status' => 'approved',
        ]);

        $user = User::find($request->user_id);
        
        \App\Models\Notification::create([
            'user_id' => $user->id,
            'title' => 'Заселення',
            'message' => "Адміністратор заселив вас до кімнати №{$room->room_number} ({$room->building->name}).",
        ]);

        $mixedNote = $request->boolean('force_mixed') ? ' (змішана кімната)' : '';
        AuditLog::log($user->id, 'manual_checkin', "Адміністратор вручну заселив користувача {$user->name} до кімнати №{$room->room_number}{$mixedNote}");

        return redirect()->back()->with('success', 'Користувача успішно заселено вручную!');
    }

    /**
     * Создание корпуса
     */
    public function storeBuilding(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:buildings,name',
        ]);

        $building = Building::create([
            'name' => $request->name,
        ]);

        AuditLog::log(null, 'building_created', "Створено новий корпус \"{$building->name}\"");

        return redirect()->back()->with('success', 'Корпус успішно створено!');
    }

    /**
     * Генерация пользователей
     */
    public function generateUsers(Request $request)
    {
        $request->validate([
            'count' => ['required', 'integer', 'min:1', 'max:50'],
            'gender' => ['nullable', 'string', 'in:male,female'],
        ]);

        $count = (int)$request->input('count');
        $gender = $request->input('gender');
        $generated = [];

        $adjectives = ['Smart', 'Happy', 'Wise', 'Brave', 'Honest', 'Friendly', 'Active', 'Kind'];
        $nouns = ['Student', 'Scholar', 'Researcher', 'Learner', 'Trainee', 'Resident', 'Dormer'];

        for ($i = 0; $i < $count; $i++) {
            $tempId = rand(1000, 9999);
            $email = 'student' . $tempId . '@mnau.edu.ua';
            $password = \Illuminate\Support\Str::random(8);
            
            $adj = $adjectives[array_rand($adjectives)];
            $noun = $nouns[array_rand($nouns)];
            $name = 'Temporary ' . $adj . ' ' . $noun . ' #' . $tempId;

            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => \Illuminate\Support\Facades\Hash::make($password),
                'role' => 'user',
                'must_change_password' => true,
                'password_changed' => false,
                'gender' => $gender,
            ]);

            $generated[] = [
                'id' => $user->id,
                'name' => $name,
                'email' => $email,
                'password' => $password,
                'gender' => $user->gender,
            ];
            
            AuditLog::log($request->user()->id, 'user_generated', "Адміністратор згенерував тимчасового користувача $email ($name)");
        }

        return redirect()->back()
            ->with('generated_users', $generated)
            ->with('success', "Успішно згенеровано $count користувачів!");
    }

    /**
     * Очистити весь журнал аудиту
     */
    public function clearAuditLogs(Request $request)
    {
        \App\Models\AuditLog::truncate();

        \App\Models\AuditLog::log($request->user()->id, 'logs_cleared', "Адміністратор очистив весь журнал аудиту");

        return redirect()->back()->with('success', 'Журнал аудиту успішно очищено!');
    }

    public function storeSpecialty(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:specialties,name|max:10']);
        \App\Models\Specialty::create(['name' => strtoupper($request->name)]);
        \App\Models\AuditLog::log($request->user()->id, 'specialty_created', "Адміністратор створив напрям " . strtoupper($request->name));
        return redirect()->back()->with('success', 'Напрям успішно створено!');
    }

    public function destroySpecialty(Request $request, \App\Models\Specialty $specialty)
    {
        $name = $specialty->name;
        $specialty->delete();
        \App\Models\AuditLog::log($request->user()->id, 'specialty_deleted', "Адміністратор видалив напрям " . $name);
        return redirect()->back()->with('success', 'Напрям успішно видалено!');
    }

    public function storeCourse(Request $request)
    {
        $request->validate(['number' => 'required|integer|min:1|max:10|unique:academic_courses,number']);
        \App\Models\AcademicCourse::create(['number' => $request->number]);
        \App\Models\AuditLog::log($request->user()->id, 'course_created', "Адміністратор створив курс " . $request->number);
        return redirect()->back()->with('success', 'Курс успішно створено!');
    }

    public function destroyCourse(Request $request, \App\Models\AcademicCourse $course)
    {
        $num = $course->number;
        $course->delete();
        \App\Models\AuditLog::log($request->user()->id, 'course_deleted', "Адміністратор видалив курс " . $num);
        return redirect()->back()->with('success', 'Курс успішно видалено!');
    }

    public function storeGroup(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:academic_groups,name|max:15']);
        \App\Models\AcademicGroup::create(['name' => $request->name]);
        \App\Models\AuditLog::log($request->user()->id, 'group_created', "Адміністратор створив групу " . $request->name);
        return redirect()->back()->with('success', 'Групу успішно створено!');
    }

    public function destroyGroup(Request $request, \App\Models\AcademicGroup $group)
    {
        $name = $group->name;
        $group->delete();
        \App\Models\AuditLog::log($request->user()->id, 'group_deleted', "Адміністратор видалив групу " . $name);
        return redirect()->back()->with('success', 'Групу успішно видалено!');
    }
}
