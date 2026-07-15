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
        $pendingBookings = Booking::with(['user', 'room.building', 'newRoom.building'])
            ->where('status', 'pending')
            ->get();

        $users = User::where('role', 'user')
            ->whereDoesntHave('bookings', function ($query) {
                $query->whereIn('status', ['pending', 'approved']);
            })
            ->get(['id', 'name', 'email']);

        $tickets = Ticket::with(['user', 'room.building'])->orderBy('created_at', 'desc')->get();
        $auditLogs = AuditLog::with('user')->orderBy('created_at', 'desc')->take(100)->get();

        return Inertia::render('Admin/Dashboard', [
            'pendingBookings' => $pendingBookings,
            'buildings' => $buildings,
            'users' => $users,
            'tickets' => $tickets,
            'auditLogs' => $auditLogs,
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
        } else {
            $booking->update($updateData);
            AuditLog::log($booking->user_id, 'booking_approved', "Ухвалено заселення користувача {$booking->user->name} до кімнати №{$booking->room->room_number}");
        }

        return redirect()->back()->with('success', 'Заявку успішно оброблено!');
    }
    /**
     * Отклонение бронирования (Reject)
     */
    public function rejectBooking(Booking $booking)
    {
        if ($booking->new_room_id) {
            $targetRoom = Room::find($booking->new_room_id);
            $booking->update([
                'new_room_id' => null,
                'status' => 'approved'
            ]);

            AuditLog::log($booking->user_id, 'relocation_rejected', "Відхилено переїзд користувача {$booking->user->name} до кімнати №{$targetRoom->room_number}");
            return redirect()->back()->with('success', 'Запит на переселення відхилено. Користувач залишається в поточній кімнаті.');
        }

        $booking->update(['status' => 'rejected']);
        AuditLog::log($booking->user_id, 'booking_rejected', "Відхилено заселення користувача {$booking->user->name} до кімнати №{$booking->room->room_number}");

        return redirect()->back()->with('success', 'Бронювання відхилено.');
    }

    /**
     * Переселение жильца в другую комнату
     */
    public function reallocateBooking(Request $request, Booking $booking)
    {
        $request->validate([
            'room_id' => 'required|exists:rooms,id',
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
            return redirect()->back()->with('error', 'В обраній кімнаті немає місць!');
        }

        $oldRoomNumber = $booking->room->room_number ?? '?';
        $booking->update([
            'room_id' => $targetRoom->id,
            'new_room_id' => null,
            'status' => 'approved', // ЯВНО ВОЗВРАЩАЕМ СТАТУС APPROVED
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

        AuditLog::log($userId, 'evicted', "Виселено користувача {$userName} з кімнати №{$roomNumber}");

        return redirect()->back()->with('message', 'Жильця успішно виселено!');
    }

    /**
     * Ручное бронирование админом
     */
    public function manualBooking(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'room_id' => 'required|exists:rooms,id',
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

        $booking = Booking::create([
            'user_id' => $request->user_id,
            'room_id' => $request->room_id,
            'status' => 'approved',
        ]);

        $user = User::find($request->user_id);
        AuditLog::log($user->id, 'manual_checkin', "Адміністратор вручну заселив користувача {$user->name} до кімнати №{$room->room_number}");

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
}
