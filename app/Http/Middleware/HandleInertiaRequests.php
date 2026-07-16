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
}
