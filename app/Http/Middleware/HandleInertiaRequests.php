<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role, // Передаем роль админа/юзера
                    'telegram' => $request->user()->telegram,
                    'phone' => $request->user()->phone,
                    'must_change_password' => $request->user()->must_change_password,
                    'password_changed' => $request->user()->password_changed,
                    'gender' => $request->user()->gender,
                    'specialty' => $request->user()->specialty,
                    'course' => $request->user()->course,
                    'group' => $request->user()->group,
                    'reallocated_notification' => $request->user()->reallocated_notification,
                    'reallocated_from' => $request->user()->reallocated_from,
                    'reallocated_to' => $request->user()->reallocated_to,
                    'reallocated_reason' => $request->user()->reallocated_reason,
                ] : null,
                'notifications' => $request->user() ? ($request->user()->role === 'admin' ? $this->getAdminNotifications() : $request->user()->notifications()->latest()->get()) : [],
            ],
            // Если у тебя используются флеш-уведомления (например, статус изменения профиля)
            'status' => $request->session()->get('status'),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'academic_options' => [
                'specialties' => \App\Models\Specialty::all(),
                'courses' => \App\Models\AcademicCourse::orderBy('number')->get(),
                'groups' => \App\Models\AcademicGroup::all(),
            ],
        ]);
    }

    protected function getAdminNotifications(): array
    {
        $tickets = \App\Models\Ticket::where('status', 'pending')
            ->with('user')
            ->latest()
            ->get()
            ->toBase()
            ->map(function ($ticket) {
                return [
                    'id' => 'ticket-' . $ticket->id,
                    'title' => 'Нове звернення в підтримку',
                    'message' => 'Студент ' . ($ticket->user->name ?? 'Невідомий') . ': "' . \Illuminate\Support\Str::limit($ticket->description, 65) . '"',
                    'created_at' => $ticket->created_at ? $ticket->created_at->toIso8601String() : now()->toIso8601String(),
                    'type' => 'ticket',
                ];
            });

        $bookings = \App\Models\Booking::where('status', 'pending')
            ->with(['user', 'room', 'newRoom'])
            ->latest()
            ->get()
            ->toBase()
            ->map(function ($booking) {
                $isRelocation = !is_null($booking->new_room_id);
                $title = $isRelocation ? 'Запит на переселення' : 'Заявка на заселення';
                $roomNum = $isRelocation ? ($booking->newRoom->room_number ?? '?') : ($booking->room->room_number ?? '?');
                $message = $isRelocation
                    ? 'Студент ' . ($booking->user->name ?? 'Невідомий') . ' просить переселити його до кімнати №' . $roomNum . '.'
                    : 'Студент ' . ($booking->user->name ?? 'Невідомий') . ' подав заявку на заселення до кімнати №' . $roomNum . '.';
                
                return [
                    'id' => 'booking-' . $booking->id,
                    'title' => $title,
                    'message' => $message,
                    'created_at' => $booking->created_at ? $booking->created_at->toIso8601String() : now()->toIso8601String(),
                    'type' => 'booking',
                ];
            });

        return $tickets->merge($bookings)
            ->sortByDesc('created_at')
            ->values()
            ->all();
    }
}
