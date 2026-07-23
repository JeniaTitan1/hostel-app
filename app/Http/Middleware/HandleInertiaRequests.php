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
                    'role' => $request->user()->role,
                    'building_id' => $request->user()->building_id,
                    'building' => $request->user()->building ? [
                        'id' => $request->user()->building->id,
                        'name' => $request->user()->building->name,
                    ] : null,
                    'telegram' => $request->user()->telegram,
                    'phone' => $request->user()->phone,
                    'must_change_password' => $request->user()->must_change_password,
                    'password_changed' => $request->user()->password_changed,
                    'gender' => $request->user()->gender,
                    'specialty' => $request->user()->specialty,
                    'course' => $request->user()->course,
                    'group' => $request->user()->group,
                    'email_changes_count' => $request->user()->email_changes_count,
                    'pending_email_change_request' => $request->user()->pendingEmailChangeRequest,
                    'reallocated_notification' => $request->user()->reallocated_notification,
                    'reallocated_from' => $request->user()->reallocated_from,
                    'reallocated_to' => $request->user()->reallocated_to,
                    'reallocated_reason' => $request->user()->reallocated_reason,
                ] : null,
                'notifications' => $request->user() ? (in_array($request->user()->role, ['admin', 'commandant']) ? $this->getAdminNotifications($request->user()) : $request->user()->notifications()->latest()->get()) : [],
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
            'settings' => [
                'min_beds_per_room' => (int) \App\Models\Setting::get('min_beds_per_room', 1),
                'max_beds_per_room' => (int) \App\Models\Setting::get('max_beds_per_room', 20),
                'global_intake_closed' => (bool) \App\Models\Setting::get('global_intake_closed', false),
            ],
        ]);
    }

    protected function getAdminNotifications($user = null): array
    {
        $ticketQuery = \App\Models\Ticket::where('status', 'pending')->with(['user', 'room']);
        $bookingQuery = \App\Models\Booking::where('status', 'pending')->with(['user', 'room', 'newRoom']);

        if ($user && $user->role === 'commandant') {
            $buildingId = $user->building_id;
            $ticketQuery->whereHas('room', function ($q) use ($buildingId) {
                $q->where('building_id', $buildingId);
            });
            // Комендантам доступні лише звичайні заселення (без переселень) у їхньому корпусі
            $bookingQuery->whereNull('new_room_id')
                ->whereHas('room', function ($q) use ($buildingId) {
                    $q->where('building_id', $buildingId);
                });
        }

        $tickets = $ticketQuery->latest()
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

        $bookings = $bookingQuery->latest()
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

        $items = $tickets->merge($bookings);

        if ($user && $user->role === 'admin') {
            $emailRequests = \App\Models\EmailChangeRequest::where('status', 'pending')
                ->with('user')
                ->latest()
                ->get()
                ->toBase()
                ->map(function ($req) {
                    return [
                        'id' => 'email-req-' . $req->id,
                        'title' => 'Запит на зміну Email',
                        'message' => 'Студент ' . ($req->user->name ?? 'Невідомий') . ' просить змінити email на ' . $req->new_email,
                        'created_at' => $req->created_at ? $req->created_at->toIso8601String() : now()->toIso8601String(),
                        'type' => 'email_change',
                    ];
                });

            $items = $items->merge($emailRequests);
        }

        return $items
            ->sortByDesc('created_at')
            ->values()
            ->all();
    }
}
