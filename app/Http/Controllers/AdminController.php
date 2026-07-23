<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use App\Models\Ticket;
use App\Models\AuditLog;
use App\Models\EmailChangeRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminController extends Controller
{
    protected function checkBuildingAccess($user, $buildingId)
    {
        if ($user->role === 'commandant' && $user->building_id != $buildingId) {
            abort(403, 'Доступ заборонено. Ви можете керувати лише своїм корпусом.');
        }
    }

    protected function ensureSuperAdmin($user)
    {
        if ($user->role !== 'admin') {
            abort(403, 'Ця дія доступна лише Головному Адміністратору.');
        }
    }

    /**
     * Главная страница админки (список заявок, комнат и свободных пользователей)
     */
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $isCommandant = $currentUser->role === 'commandant';
        $commandantBuildingId = $currentUser->building_id;

        if ($isCommandant) {
            $buildings = Building::where('id', $commandantBuildingId)
                ->with(['rooms.bookings.user', 'rooms.bookings.newRoom'])
                ->get();

            // Комендант бачить лише звичайні бронювання у своєму корпусі (без запитів на переселення)
            $pendingBookings = Booking::with(['user', 'room.building', 'room.bookings.user', 'newRoom.building', 'newRoom.bookings.user'])
                ->where('status', 'pending')
                ->whereNull('new_room_id')
                ->whereHas('room', function ($q) use ($commandantBuildingId) {
                    $q->where('building_id', $commandantBuildingId);
                })
                ->get();

            $tickets = Ticket::with(['user', 'room.building'])
                ->whereHas('room', function ($q) use ($commandantBuildingId) {
                    $q->where('building_id', $commandantBuildingId);
                })
                ->orderBy('created_at', 'desc')
                ->get();

            $commandants = [];
            $emailChangeRequests = [];
        } else {
            $buildings = Building::with(['rooms.bookings.user', 'rooms.bookings.newRoom'])->get();

            $pendingBookings = Booking::with(['user', 'room.building', 'room.bookings.user', 'newRoom.building', 'newRoom.bookings.user'])
                ->where('status', 'pending')
                ->get();

            $tickets = Ticket::with(['user', 'room.building'])->orderBy('created_at', 'desc')->get();

            $commandants = User::where('role', 'commandant')
                ->with('building')
                ->orderBy('created_at', 'desc')
                ->get();

            $emailChangeRequests = EmailChangeRequest::with('user')
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->get();
        }

        $users = User::where('role', 'user')
            ->whereDoesntHave('bookings', function ($query) {
                $query->where('status', 'approved');
            })
            ->get(['id', 'name', 'email', 'gender']);

        $auditLogs = AuditLog::with('user')->orderBy('created_at', 'desc')->take(100)->get();

        $allUsers = User::where('role', 'user')
            ->orderBy('created_at', 'desc')
            ->get([
                'id', 'name', 'email', 'gender', 'telegram', 'phone', 
                'must_change_password', 'password_changed', 'created_at',
                'specialty', 'course', 'group'
            ]);

        // Аналітика по корпусах
        $roomsQuery = $isCommandant ? Room::where('building_id', $commandantBuildingId) : Room::query();
        $approvedBookingsQuery = Booking::where('status', 'approved');
        if ($isCommandant) {
            $approvedBookingsQuery->whereHas('room', function ($q) use ($commandantBuildingId) {
                $q->where('building_id', $commandantBuildingId);
            });
        }

        $stats = [
            'total_rooms'    => (clone $roomsQuery)->count(),
            'total_capacity' => (clone $roomsQuery)->sum('max_capacity'),
            'occupied'       => $approvedBookingsQuery->count(),
            'pending'        => $pendingBookings->count(),
            'open_tickets'   => $tickets->whereIn('status', ['open', 'in_progress', 'pending'])->count(),
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
            'pendingBookings'     => $pendingBookings,
            'buildings'           => $buildings,
            'users'               => $users,
            'tickets'             => $tickets,
            'auditLogs'           => $auditLogs,
            'allUsers'            => $allUsers,
            'commandants'         => $commandants,
            'emailChangeRequests' => $emailChangeRequests,
            'allBuildings'        => $isCommandant ? [] : Building::all(['id', 'name']),
            'generatedUsers'      => session('generated_users'),
            'generatedCommandant' => session('generated_commandant'),
            'stats'               => $stats,
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

        $this->checkBuildingAccess($request->user(), $request->building_id);

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
    public function approveBooking(Request $request, Booking $booking)
    {
        if ($booking->new_room_id && $request->user()->role === 'commandant') {
            abort(403, 'Механіка переселення доступна лише Головному Адміністратору.');
        }

        $targetRoomId = $booking->new_room_id ?? $booking->room_id;
        $targetRoom = Room::findOrFail($targetRoomId);

        $this->checkBuildingAccess($request->user(), $targetRoom->building_id);

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

        return redirect()->back()->with('success', 'Заявку успішно обролено!');
    }

    /**
     * Отклонение бронирования (Reject)
     */
    public function rejectBooking(Request $request, Booking $booking)
    {
        if ($booking->new_room_id && $request->user()->role === 'commandant') {
            abort(403, 'Механіка переселення доступна лише Головному Адміністратору.');
        }

        $this->checkBuildingAccess($request->user(), $booking->room->building_id);
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
        $this->checkBuildingAccess($request->user(), $room->building_id);

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
        $this->checkBuildingAccess($request->user(), $room->building_id);

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
        $this->checkBuildingAccess($request->user(), $room->building_id);

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
        $this->checkBuildingAccess($request->user(), $room->building_id);

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
     * Оновити глобальні налаштування системи
     */
    public function updateSettings(Request $request)
    {
        $this->ensureSuperAdmin($request->user());

        $request->validate([
            'min_beds_per_room' => 'required|integer|min:1|max:20',
            'max_beds_per_room' => 'required|integer|min:1|max:20',
            'global_intake_closed' => 'required|boolean',
        ]);

        $min = (int) $request->min_beds_per_room;
        $max = (int) $request->max_beds_per_room;

        if ($min > $max) {
            return redirect()->back()->withErrors([
                'min_beds_per_room' => 'Мінімальна місткість не може бути більшою за максимальну.'
            ]);
        }

        \App\Models\Setting::set('min_beds_per_room', $min);
        \App\Models\Setting::set('max_beds_per_room', $max);
        \App\Models\Setting::set('global_intake_closed', $request->global_intake_closed ? '1' : '0');

        AuditLog::log($request->user()->id, 'settings_updated', "Оновлено глобальні налаштування: мін. ліжок={$min}, макс. ліжок={$max}, глобальний набір=" . ($request->global_intake_closed ? 'закритий' : 'відкритий'));

        return redirect()->back()->with('success', 'Глобальні налаштування успішно збережено.');
    }

    /**
     * Переселение жильца в другую комнату
     */
    public function reallocateBooking(Request $request, Booking $booking)
    {
        $this->ensureSuperAdmin($request->user());

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
        $this->checkBuildingAccess(auth()->user(), $booking->room->building_id);

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
        $this->checkBuildingAccess($request->user(), $room->building_id);

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
        $this->ensureSuperAdmin($request->user());

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
        $this->ensureSuperAdmin($request->user());

        \App\Models\AuditLog::truncate();

        \App\Models\AuditLog::log($request->user()->id, 'logs_cleared', "Адміністратор очистив весь журнал аудиту");

        return redirect()->back()->with('success', 'Журнал аудиту успішно очищено!');
    }

    public function storeSpecialty(Request $request)
    {
        $this->ensureSuperAdmin($request->user());

        $request->validate(['name' => 'required|string|unique:specialties,name|max:10']);
        \App\Models\Specialty::create(['name' => strtoupper($request->name)]);
        \App\Models\AuditLog::log($request->user()->id, 'specialty_created', "Адміністратор створив напрям " . strtoupper($request->name));
        return redirect()->back()->with('success', 'Напрям успішно створено!');
    }

    public function destroySpecialty(Request $request, \App\Models\Specialty $specialty)
    {
        $this->ensureSuperAdmin($request->user());

        $name = $specialty->name;
        $specialty->delete();
        \App\Models\AuditLog::log($request->user()->id, 'specialty_deleted', "Адміністратор видалив напрям " . $name);
        return redirect()->back()->with('success', 'Напрям успішно видалено!');
    }

    public function storeCourse(Request $request)
    {
        $this->ensureSuperAdmin($request->user());

        $request->validate(['number' => 'required|integer|min:1|max:10|unique:academic_courses,number']);
        \App\Models\AcademicCourse::create(['number' => $request->number]);
        \App\Models\AuditLog::log($request->user()->id, 'course_created', "Адміністратор створив курс " . $request->number);
        return redirect()->back()->with('success', 'Курс успішно створено!');
    }

    public function destroyCourse(Request $request, \App\Models\AcademicCourse $course)
    {
        $this->ensureSuperAdmin($request->user());

        $num = $course->number;
        $course->delete();
        \App\Models\AuditLog::log($request->user()->id, 'course_deleted', "Адміністратор видалив курс " . $num);
        return redirect()->back()->with('success', 'Курс успішно видалено!');
    }

    public function storeGroup(Request $request)
    {
        $this->ensureSuperAdmin($request->user());

        $request->validate(['name' => 'required|string|unique:academic_groups,name|max:15']);
        \App\Models\AcademicGroup::create(['name' => $request->name]);
        \App\Models\AuditLog::log($request->user()->id, 'group_created', "Адміністратор створив групу " . $request->name);
        return redirect()->back()->with('success', 'Групу успішно створено!');
    }

    public function destroyGroup(Request $request, \App\Models\AcademicGroup $group)
    {
        $this->ensureSuperAdmin($request->user());

        $name = $group->name;
        $group->delete();
        \App\Models\AuditLog::log($request->user()->id, 'group_deleted', "Адміністратор видалив групу " . $name);
        return redirect()->back()->with('success', 'Групу успішно видалено!');
    }

    /**
     * Створення коменданта вручну
     */
    public function storeCommandant(Request $request)
    {
        $this->ensureSuperAdmin($request->user());

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'building_id' => 'required|exists:buildings,id',
        ]);

        $commandant = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role' => 'commandant',
            'building_id' => $request->building_id,
            'password_changed' => true,
        ]);

        $building = Building::find($request->building_id);
        AuditLog::log($request->user()->id, 'commandant_created', "Створено коменданта {$commandant->name} ({$commandant->email}) для корпуса \"{$building->name}\"");

        return redirect()->back()->with('success', "Коменданта {$commandant->name} успішно створено!");
    }

    /**
     * Автоматична генерація коменданта для корпусу
     */
    public function generateCommandant(Request $request)
    {
        $this->ensureSuperAdmin($request->user());

        $request->validate([
            'building_id' => 'required|exists:buildings,id',
        ]);

        $building = Building::findOrFail($request->building_id);
        $tempId = rand(100, 999);
        $email = 'commandant.b' . $building->id . '.' . $tempId . '@mnau.edu.ua';
        $password = \Illuminate\Support\Str::random(8);
        $name = 'Комендант (' . $building->name . ') #' . $tempId;

        $commandant = User::create([
            'name' => $name,
            'email' => $email,
            'password' => \Illuminate\Support\Facades\Hash::make($password),
            'role' => 'commandant',
            'building_id' => $building->id,
            'must_change_password' => false,
            'password_changed' => true,
        ]);

        AuditLog::log($request->user()->id, 'commandant_generated', "Згенеровано акаунт коменданта {$email} для корпуса \"{$building->name}\"");

        $generated = [
            'id' => $commandant->id,
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'building_name' => $building->name,
        ];

        return redirect()->back()
            ->with('generated_commandant', $generated)
            ->with('success', "Акаунт коменданта для \"{$building->name}\" успішно згенеровано!");
    }

    /**
     * Видалення коменданта
     */
    public function deleteCommandant(Request $request, User $user)
    {
        $this->ensureSuperAdmin($request->user());

        if ($user->role !== 'commandant') {
            return redirect()->back()->withErrors(['error' => 'Користувач не є комендантом.']);
        }

        $name = $user->name;
        $user->delete();

        AuditLog::log($request->user()->id, 'commandant_deleted', "Видалено коменданта {$name}");

        return redirect()->back()->with('success', "Коменданта {$name} успішно видалено!");
    }

    /**
     * Схвалення запиту на зміну електронної пошти
     */
    public function approveEmailChange(Request $request, EmailChangeRequest $emailRequest)
    {
        $this->ensureSuperAdmin($request->user());

        if ($emailRequest->status !== 'pending') {
            return redirect()->back()->with('error', 'Запит вже опрацьовано.');
        }

        $user = $emailRequest->user;
        if (!$user) {
            return redirect()->back()->with('error', 'Користувача не знайдено.');
        }

        // Перевіряємо унікальність емейлу
        $existing = User::where('email', $emailRequest->new_email)->where('id', '!=', $user->id)->first();
        if ($existing) {
            $emailRequest->update([
                'status' => 'rejected',
                'rejection_reason' => 'Електронна пошта вже використовується іншим акаунтом.',
            ]);

            AuditLog::log($request->user()->id, 'email_change_rejected_auto', "Автоматично відхилено запит на зміну емейлу користувача {$user->name} на {$emailRequest->new_email} (пошта вже зайнята)");

            return redirect()->back()->with('error', 'Запит відхилено: пошта вже зайнята іншим користувачем.');
        }

        $user->email = $emailRequest->new_email;
        $user->email_verified_at = null;
        $user->email_changes_count += 1;
        $user->save();

        $emailRequest->update(['status' => 'approved']);

        AuditLog::log($request->user()->id, 'email_change_approved', "Схвалено зміну емейлу для користувача {$user->name} на {$emailRequest->new_email}");

        return redirect()->back()->with('success', "Запит на зміну електронної пошти для {$user->name} успішно схвалено.");
    }

    /**
     * Відхилення запиту на зміну електронної пошти
     */
    public function rejectEmailChange(Request $request, EmailChangeRequest $emailRequest)
    {
        $this->ensureSuperAdmin($request->user());

        $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($emailRequest->status !== 'pending') {
            return redirect()->back()->with('error', 'Запит вже опрацьовано.');
        }

        $emailRequest->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason ?: 'Відхилено адміністратором.',
        ]);

        AuditLog::log($request->user()->id, 'email_change_rejected', "Відхилено запит на зміну емейлу для користувача {$emailRequest->user->name}. Причина: " . ($request->rejection_reason ?: 'Без вказання причини'));

        return redirect()->back()->with('success', 'Запит на зміну електронної пошти відхилено.');
    }

    /**
     * Оновлення профілю користувача адміном або комендантом
     */
    public function updateUser(Request $request, User $user)
    {
        $currentUser = $request->user();

        if ($currentUser->role === 'commandant') {
            if ($user->role !== 'user') {
                abort(403, 'Комендант може редагувати лише акаунти студентів.');
            }
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'telegram' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female'])],
            'specialty' => ['nullable', 'string', 'max:50'],
            'course' => ['nullable', 'integer', 'min:1', 'max:6'],
            'group' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = \Illuminate\Support\Facades\Hash::make($validated['password']);
            $validated['must_change_password'] = false;
            $validated['password_changed'] = true;
        } else {
            unset($validated['password']);
        }

        // Роль і корпус може змінювати тільки Super Admin
        if ($currentUser->role === 'admin' && $request->has('role')) {
            $request->validate([
                'role' => ['required', 'string', Rule::in(['admin', 'commandant', 'user'])],
                'building_id' => ['nullable', 'exists:buildings,id'],
            ]);
            $validated['role'] = $request->role;
            $validated['building_id'] = $request->building_id ?: null;
        }

        $user->update($validated);

        AuditLog::log(
            $currentUser->id,
            'user_profile_updated_by_admin',
            "Адміністратор {$currentUser->name} оновив дані користувача {$user->name} (#{$user->id})"
        );

        return redirect()->back()->with('success', "Дані користувача {$user->name} успішно оновлено!");
    }

    /**
     * Швидкий вхід під акаунтом студента (Impersonate)
     */
    public function impersonate(Request $request, User $user)
    {
        $currentUser = $request->user();

        if ($user->role === 'admin') {
            return redirect()->back()->with('error', 'Неможливо увійти під акаунтом адміністратора.');
        }

        if ($currentUser->role === 'commandant' && $user->role !== 'user') {
            return redirect()->back()->with('error', 'Комендант може входити лише під акаунтами студентів.');
        }

        AuditLog::log($currentUser->id, 'impersonated_user', "Адміністратор {$currentUser->name} увійшов під ім'ям {$user->name} (ID: {$user->id})");

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard')->with('success', "Ви увійшли під ім'ям {$user->name}");
    }
}
