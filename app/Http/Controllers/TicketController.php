<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TicketController extends Controller
{
    /**
     * Создать заявку на ремонт/обслуживание
     */
    public function store(Request $request)
    {
        $request->validate([
            'description' => 'required|string|max:1000',
        ]);

        $user = Auth::user();
        
        // Находим одобренное заселение пользователя
        $booking = $user->bookings()->where('status', 'approved')->first();

        if (!$booking) {
            return redirect()->back()->with('error', 'Ви повинні мати активне заселення, щоб надіслати заявку!');
        }

        $ticket = Ticket::create([
            'user_id' => $user->id,
            'room_id' => $booking->room_id,
            'description' => $request->description,
            'status' => 'pending',
        ]);

        $roomNum = $booking->room ? $booking->room->room_number : '';
        \App\Events\TicketUpdated::dispatchSafe(
            $ticket->id,
            'created',
            "Нове звернення від {$user->name} (Кімната №{$roomNum}): " . \Illuminate\Support\Str::limit($request->description, 50)
        );

        return redirect()->back()->with('success', 'Заявку на обслуговування успішно надіслано!');
    }

    /**
     * Закрыть/разрешить заявку на ремонт (для админа и коменданта соответствующего корпуса)
     */
    public function resolve(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'commandant'])) {
            abort(403, 'Доступ заборонено.');
        }

        $ticket->load(['user', 'room.building']);

        if ($user->role === 'commandant') {
            if ($ticket->room && $ticket->room->building_id != $user->building_id) {
                abort(403, 'Доступ заборонено. Ви можете керувати лише заявками свого корпусу.');
            }
        }

        $ticket->update(['status' => 'resolved']);

        $roomNum = $ticket->room ? $ticket->room->room_number : '';
        $msg = "Вашу заявку щодо кімнати №{$roomNum} успішно вирішено!";

        // Створюємо постійне сповіщення для студента
        $notification = \App\Models\Notification::create([
            'user_id' => $ticket->user_id,
            'title' => 'Заявку на обслуговування виконано',
            'message' => $msg,
        ]);

        // Диспатчимо події в реальному часі (WebSockets)
        \App\Events\TicketUpdated::dispatchSafe($ticket->id, 'resolved', $msg);
        \App\Events\NotificationCreated::dispatchSafe($ticket->user_id, $notification, $msg);

        return redirect()->back()->with('success', 'Заявку успішно виконано!');
    }
}
