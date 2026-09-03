<?php

namespace App\Http\Controllers;

use App\Models\AccessLog;
use App\Models\Booking;
use App\Models\Building;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AccessLogController extends Controller
{
    /**
     * Відображення журналу відвідувань або повернення JSON для адмінки/коменданта
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $isCommandant = $user && $user->role === 'commandant';
        $userBuildingId = $isCommandant ? $user->building_id : null;

        $query = AccessLog::with([
            'user',
            'booking.room.building',
            'building',
            'scanner',
        ])->latest();

        // Обмеження для коменданта конкретного гуртожитку
        if ($userBuildingId) {
            $query->where(function ($q) use ($userBuildingId) {
                $q->where('building_id', $userBuildingId)
                  ->orWhereHas('booking.room', function ($rq) use ($userBuildingId) {
                      $rq->where('building_id', $userBuildingId);
                  });
            });
        }

        // Фільтрація за датою (за замовчуванням сьогодні або обрана дата)
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->input('date'));
        }

        // Фільтрація за гуртожитком
        if ($request->filled('building_id')) {
            $bId = $request->input('building_id');
            $query->where(function ($q) use ($bId) {
                $q->where('building_id', $bId)
                  ->orWhereHas('booking.room', function ($rq) use ($bId) {
                      $rq->where('building_id', $bId);
                  });
            });
        }

        // Фільтрація за типом (entry / exit)
        if ($request->filled('type') && in_array($request->input('type'), ['entry', 'exit'])) {
            $query->where('type', $request->input('type'));
        }

        // Фільтрація за статусом (granted / denied)
        if ($request->filled('status') && in_array($request->input('status'), ['granted', 'denied'])) {
            $query->where('status', $request->input('status'));
        }

        // Пошук за ім'ям студента, email або ордером
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%")
                       ->orWhere('phone', 'like', "%{$search}%");
                })->orWhereHas('booking', function ($bq) use ($search) {
                    $bq->where('order_number', 'like', "%{$search}%");
                });
            });
        }

        $logs = $query->paginate(30)->withQueryString();

        // Розрахунок статистики за сьогодні
        $today = Carbon::today();
        $statsQuery = AccessLog::whereDate('created_at', $today);
        if ($userBuildingId) {
            $statsQuery->where('building_id', $userBuildingId);
        }

        $entriesToday = (clone $statsQuery)->where('type', 'entry')->where('status', 'granted')->count();
        $exitsToday = (clone $statsQuery)->where('type', 'exit')->where('status', 'granted')->count();
        $deniedToday = (clone $statsQuery)->where('status', 'denied')->count();

        $stats = [
            'entries_today' => $entriesToday,
            'exits_today' => $exitsToday,
            'denied_today' => $deniedToday,
            'total_scans_today' => $entriesToday + $exitsToday + $deniedToday,
        ];

        if ($request->wantsJson()) {
            return response()->json([
                'logs' => $logs,
                'stats' => $stats,
            ]);
        }

        $buildings = Building::select('id', 'name')->get();

        return Inertia::render('Admin/AccessScanner', [
            'initialLogs' => $logs,
            'stats' => $stats,
            'buildings' => $buildings,
        ]);
    }

    /**
     * API швидкого сканування перепустки (з камери або ручного вводу)
     */
    public function scan(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'forced_type' => 'nullable|in:auto,entry,exit',
            'notes' => 'nullable|string|max:500',
        ]);

        $rawCode = trim($request->input('code'));
        $scannerUser = Auth::user();

        // Очищення коду: якщо відскановано повне URL посилання (напр. https://hostel.../verify-order/ORD-2026-1234)
        $code = $rawCode;
        if (str_contains($rawCode, '/verify-order/')) {
            $parts = explode('/verify-order/', $rawCode);
            $code = end($parts);
        }
        $code = strtoupper(trim(urldecode($code)));

        // Пошук дійсного бронювання
        $currentYear = date('Y');
        $candidates = [
            $code,
            "ORD-{$code}",
            "ORD-{$currentYear}-{$code}",
        ];

        $booking = Booking::with(['user', 'room.building'])
            ->whereIn('order_number', $candidates)
            ->first();

        // Якщо за ордером не знайдено, спробуємо знайти за email студента
        $studentUser = null;
        if ($booking) {
            $studentUser = $booking->user;
        } else {
            $studentUser = User::where('email', $rawCode)
                ->orWhere('name', $rawCode)
                ->first();

            if ($studentUser) {
                $booking = Booking::with(['user', 'room.building'])
                    ->where('user_id', $studentUser->id)
                    ->where('status', 'approved')
                    ->latest()
                    ->first();
            }
        }

        if (!$studentUser) {
            return response()->json([
                'valid' => false,
                'status' => 'not_found',
                'message' => 'Цифрову перепустку або студента з таким кодом не знайдено в базі.',
            ], 404);
        }

        $isValid = $booking && $booking->status === 'approved';
        $logStatus = $isValid ? 'granted' : 'denied';

        // Визначення напрямку (Вхід чи Вихід)
        $forcedType = $request->input('forced_type', 'auto');
        $direction = 'entry';

        if ($forcedType === 'entry' || $forcedType === 'exit') {
            $direction = $forcedType;
        } else {
            // Авто-визначення за останнім логом студента
            $lastLog = AccessLog::where('user_id', $studentUser->id)
                ->where('status', 'granted')
                ->latest()
                ->first();

            if ($lastLog && $lastLog->type === 'entry') {
                $direction = 'exit';
            } else {
                $direction = 'entry';
            }
        }

        $buildingId = $booking?->room?->building_id ?? $studentUser->building_id ?? $scannerUser?->building_id;

        // Створення запису в журналі
        $accessLog = AccessLog::create([
            'user_id' => $studentUser->id,
            'booking_id' => $booking?->id,
            'building_id' => $buildingId,
            'scanned_by' => $scannerUser?->id,
            'type' => $direction,
            'status' => $logStatus,
            'method' => 'qr_scan',
            'notes' => $request->input('notes') ?? (!$isValid ? 'Спроба проходу без дійсного схваленого ордера' : null),
        ]);

        $directionName = $direction === 'entry' ? 'ВХІД' : 'ВИХІД';

        return response()->json([
            'valid' => $isValid,
            'status' => $logStatus,
            'type' => $direction,
            'direction_name' => $directionName,
            'message' => $isValid
                ? "Успішно! Зафіксовано {$directionName} студента."
                : "Увага! Студент не має дійсного схваленого ордера (доступ заборонено).",
            'student' => [
                'id' => $studentUser->id,
                'name' => $studentUser->name,
                'email' => $studentUser->email,
                'phone' => $studentUser->phone,
                'gender' => $studentUser->gender,
                'specialty' => $studentUser->specialty,
                'course' => $studentUser->course,
                'group' => $studentUser->group,
            ],
            'room' => $booking ? [
                'room_number' => $booking->room->room_number,
                'floor' => $booking->room->floor,
                'building' => [
                    'id' => $booking->room->building->id,
                    'name' => $booking->room->building->name,
                ],
            ] : null,
            'order_number' => $booking?->order_number,
            'booking_status' => $booking?->status ?? 'немає',
            'log' => [
                'id' => $accessLog->id,
                'created_at' => $accessLog->created_at->format('H:i:s d.m.Y'),
                'type' => $accessLog->type,
                'status' => $accessLog->status,
            ],
        ]);
    }

    /**
     * Швидке ручне перемикання напрямку (Вхід <-> Вихід)
     */
    public function updateDirection(Request $request, AccessLog $accessLog)
    {
        $request->validate([
            'type' => 'required|in:entry,exit',
        ]);

        $accessLog->update([
            'type' => $request->input('type'),
        ]);

        return response()->json([
            'success' => true,
            'log' => [
                'id' => $accessLog->id,
                'type' => $accessLog->type,
                'status' => $accessLog->status,
                'created_at' => $accessLog->created_at->format('H:i:s d.m.Y'),
            ],
            'message' => 'Напрямок проходу успішно змінено на ' . ($accessLog->type === 'entry' ? 'ВХІД' : 'ВИХІД'),
        ]);
    }
}
