<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\Room;
use App\Models\Booking;
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

        $buildings = Building::all();
        $selectedBuildingId = $request->query('building_id');
        $selectedFloor = $request->query('floor');

        $rooms = [];
        $floors = [];

        if ($selectedBuildingId) {
            $floors = Room::where('building_id', $selectedBuildingId)
                ->select('floor')
                ->distinct()
                ->orderBy('floor', 'asc')
                ->pluck('floor');
        }

        if ($selectedBuildingId && $selectedFloor) {
            $rooms = Room::where('building_id', $selectedBuildingId)
                ->where('floor', $selectedFloor)
                ->withCount(['bookings as approved_bookings_count' => function ($query) {
                    $query->where(function ($q) {
                        $q->where('status', 'approved')
                          ->orWhere(function ($sq) {
                              $sq->where('status', 'pending')
                                ->whereNotNull('new_room_id');
                          });
                    });
                }])
                ->get();
        }

        $userBooking = Booking::with(['room.building', 'newRoom.building'])
            ->where('user_id', Auth::id())
            ->first();

        return Inertia::render('Dashboard', [
            'buildings' => $buildings,
            'floors' => $floors,
            'rooms' => $rooms,
            'selectedBuildingId' => (int)$selectedBuildingId ?: null,
            'selectedFloor' => (int)$selectedFloor ?: null,
            'userBooking' => $userBooking,
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

                // Выполняем обновление для переселения
                $existingBooking->update([
                    'new_room_id' => $room->id,
                    'status' => 'pending' // Ставим PENDING на рассмотрение админу
                ]);

                return redirect()->back()->with('success', 'Заявка на переселення відправлена!');
            }

            // ЕСЛИ СТАТУС REJECTED — разрешаем подать заново (переиспользуем запись)
            if ($existingBooking->status === 'rejected') {
                $existingBooking->update([
                    'room_id' => $room->id,
                    'new_room_id' => null, // Очищаем временную комнату, если была
                    'status' => 'pending'  // Снова отправляем на рассмотрение
                ]);

                return redirect()->back()->with('success', 'Заявку на заселення відправлено повторно!');
            }
        }

        // 3. Если броней вообще не было в базе — создаем новую запись
        Booking::create([
            'user_id' => $userId,
            'room_id' => $room->id,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Заявку на заселення відправлено!');
    }
}
