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
     * Закрыть/разрешить заявку на ремонт (только для админа)
     */
    public function resolve(Ticket $ticket)
    {
        $ticket->update(['status' => 'resolved']);

        return redirect()->back()->with('success', 'Заявку успішно виконано!');
    }
}
