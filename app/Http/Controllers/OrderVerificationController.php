<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderVerificationController extends Controller
{
    /**
     * Відображення сторінки перевірки або повернення результат перевірки ордера
     */
    public function verify(Request $request, ?string $orderNumber = null)
    {
        if ($request->user() && $request->user()->role === 'user') {
            abort(403, 'Перевірка ордерів доступна лише адміністрації та комендантам.');
        }

        $code = trim($request->input('code', $orderNumber ?? ''));

        $booking = null;
        $searched = false;

        if (!empty($code)) {
            $searched = true;
            $booking = Booking::with(['user', 'room.building'])
                ->where('order_number', $code)
                ->where('status', 'approved')
                ->first();
        }

        if ($request->wantsJson()) {
            if ($booking) {
                return response()->json([
                    'valid' => true,
                    'booking' => [
                        'id' => $booking->id,
                        'order_number' => $booking->order_number,
                        'status' => $booking->status,
                        'user' => [
                            'name' => $booking->user->name,
                            'email' => $booking->user->email,
                            'phone' => $booking->user->phone,
                            'gender' => $booking->user->gender,
                            'specialty' => $booking->user->specialty,
                            'course' => $booking->user->course,
                            'group' => $booking->user->group,
                        ],
                        'room' => [
                            'room_number' => $booking->room->room_number,
                            'floor' => $booking->room->floor,
                            'building' => [
                                'name' => $booking->room->building->name,
                                'address' => $booking->room->building->address ?? '',
                            ],
                        ],
                        'created_at' => $booking->created_at->format('d.m.Y H:i'),
                    ],
                ]);
            }

            return response()->json([
                'valid' => false,
                'message' => 'Ордер з таким кодом не знайдено або він є недійсним.',
            ], 404);
        }

        return Inertia::render('VerifyOrder', [
            'initialCode' => $code,
            'searched' => $searched,
            'booking' => $booking ? [
                'id' => $booking->id,
                'order_number' => $booking->order_number,
                'status' => $booking->status,
                'user' => [
                    'name' => $booking->user->name,
                    'email' => $booking->user->email,
                    'phone' => $booking->user->phone,
                    'gender' => $booking->user->gender,
                    'specialty' => $booking->user->specialty,
                    'course' => $booking->user->course,
                    'group' => $booking->user->group,
                ],
                'room' => [
                    'room_number' => $booking->room->room_number,
                    'floor' => $booking->room->floor,
                    'building' => [
                        'name' => $booking->room->building->name,
                        'address' => $booking->room->building->address ?? '',
                    ],
                ],
                'created_at' => $booking->created_at->format('d.m.Y H:i'),
            ] : null,
        ]);
    }
}
