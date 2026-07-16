<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\Room;
use App\Models\Booking;
use App\Models\AuditLog;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BuildingController extends Controller
{
    /**
     * Отображение главной страницы со списком корпусов
     */
    public function index(Request $request)
    {
        if ($request->user() && $request->user()->role === 'admin') {
            return redirect()->route('admin.dashboard');
        }

        $selectedBuildingId = $request->query('building_id');
        $selectedFloor = $request->query('floor');

        $buildings = Building::all();
        $floors = [];
        $rooms = [];

        if ($selectedBuildingId) {
            $floors = Room::where('building_id', $selectedBuildingId)
                ->where('hide_from_frontend', false)
                ->select('floor')
                ->distinct()
                ->orderBy('floor', 'asc')
                ->pluck('floor');
        }

        if ($selectedBuildingId && $selectedFloor) {
            $rooms = Room::where('building_id', $selectedBuildingId)
                ->where('floor', $selectedFloor)
                ->where('hide_from_frontend', false)
                ->withCount(['bookings as approved_bookings_count' => function ($query) {
                    $query->where(function ($q) {
                        $q->where('status', 'approved')
                          ->orWhere(function ($sq) {
                              $sq->where('status', 'pending')
                                ->whereNotNull('new_room_id');
                          });
                    });
                }])
                ->with(['bookings.user'])
                ->get();
        }

        $userBooking = Booking::with(['room.building', 'newRoom.building'])
            ->where('user_id', Auth::id())
            ->first();

        $tickets = [];
        $roommates = [];

        if ($userBooking && $userBooking->status === 'approved') {
            $tickets = Ticket::where('user_id', Auth::id())
                ->orderBy('created_at', 'desc')
                ->get();

            $roommates = Booking::with('user')
                ->where('room_id', $userBooking->room_id)
                ->where('status', 'approved')
                ->where('user_id', '!=', Auth::id())
                ->get()
                ->map(function ($b) {
                    return [
                        'name' => $b->user->name,
                        'email' => $b->user->email,
                        'telegram' => $b->user->telegram,
                        'phone' => $b->user->phone,
                    ];
                });
        }

        return Inertia::render('Dashboard', [
            'auth' => ['user' => $request->user()],
            'buildings' => Building::all(),
            'floors' => $floors,
            'rooms' => $rooms,
            'selectedBuildingId' => $selectedBuildingId,
            'selectedFloor' => $selectedFloor,
            'userBooking' => $userBooking,
            'tickets' => $tickets,
            'roommates' => $roommates,
        ]);
    }

    /**
     * Создание заявки на бронирование от пользователя
     */
    public function storeBooking(Request $request)
    {
        $request->validate([
            'room_id' => 'required|exists:rooms,id',
        ]);

        $userId = Auth::id();
        $room = Room::findOrFail($request->room_id);

        if ($room->status === 'closed' || $room->intake_closed || $room->hide_from_frontend) {
            return redirect()->back()->with('error', 'Набір у цю кімнату закритий.');
        }

        // 1. Проверка свободных мест в целевой комнате
        $approvedCount = Booking::where('room_id', $room->id)
            ->where(function ($query) {
                $query->where('status', 'approved')
                      ->orWhere(function ($q) {
                          $q->where('status', 'pending')
                            ->whereNotNull('new_room_id');
                      });
            })
            ->count();

        if ($approvedCount >= $room->max_capacity) {
            return redirect()->back()->with('error', 'В цій кімнаті немає місць.');
        }

        // Гендерна перевірка: бекенд дозволяє змішані кімнати,
        // оскільки фронтенд попереджує користувача перед відправкою запиту.
        // (Заявка все одно потребує підтвердження адміністратора)

        // 2. Ищем существующую бронь (любую: pending, approved, rejected)
        $existingBooking = Booking::where('user_id', $userId)->first();

        if ($existingBooking) {

            // Если статус PENDING — не даем создавать новую (защита от спама)
            if ($existingBooking->status === 'pending') {
                return redirect()->back()->with('error', 'У вас вже є заявка на розгляді!');
            }

            // Если статус APPROVED — это запрос на переселение
            if ($existingBooking->status === 'approved') {
                if ($existingBooking->room_id == $room->id) {
                    return redirect()->back()->with('error', 'Ви вже тут живете!');
                }

                $oldRoomNumber = $existingBooking->room->room_number ?? '?';
                // Выполняем обновление для переселения
                $existingBooking->update([
                    'new_room_id' => $room->id,
                    'status' => 'pending' // Ставим PENDING на рассмотрение админу
                ]);

                AuditLog::log($userId, 'relocation_requested', "Надіслано запит на переселення з кімнати №{$oldRoomNumber} до №{$room->room_number} ({$room->building->name})");

                return redirect()->back()->with('success', 'Заявка на переселення відправлена!');
            }

            // ЕСЛИ СТАТУС REJECTED — разрешаем подать заново (переиспользуем запись)
            if ($existingBooking->status === 'rejected') {
                $existingBooking->update([
                    'room_id' => $room->id,
                    'new_room_id' => null, // Очищаем временную комнату, если была
                    'status' => 'pending'  // Снова отправляем на рассмотрение
                ]);

                AuditLog::log($userId, 'booking_requested', "Повторно надіслано запит на заселення в кімнату №{$room->room_number} ({$room->building->name})");

                return redirect()->back()->with('success', 'Заявку на заселення відправлено повторно!');
            }
        }

        // 3. Если броней вообще не было в базе — создаем новую запись
        Booking::create([
            'user_id' => $userId,
            'room_id' => $room->id,
            'status' => 'pending',
        ]);

        AuditLog::log($userId, 'booking_requested', "Надіслано запит на заселення в кімнату №{$room->room_number} ({$room->building->name})");

        return redirect()->back()->with('success', 'Заявку на заселення відправлено!');
    }
}
