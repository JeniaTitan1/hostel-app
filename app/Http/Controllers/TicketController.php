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

        Ticket::create([
            'user_id' => $user->id,
            'room_id' => $booking->room_id,
            'description' => $request->description,
            'status' => 'pending',
        ]);

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

        if ($user->role === 'commandant') {
            $ticket->load('room');
            if ($ticket->room && $ticket->room->building_id != $user->building_id) {
                abort(403, 'Доступ заборонено. Ви можете керувати лише заявками свого корпусу.');
            }
        }

        $ticket->update(['status' => 'resolved']);

        return redirect()->back()->with('success', 'Заявку успішно виконано!');
    }
}
