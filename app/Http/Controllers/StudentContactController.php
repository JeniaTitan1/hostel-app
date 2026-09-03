<?php

namespace App\Http\Controllers;

use App\Mail\DirectStudentMail;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class StudentContactController extends Controller
{
    /**
     * Відправка персонального email-повідомлення студенту з панелі керування
     */
    public function sendEmail(Request $request, User $user)
    {
        $sender = $request->user();

        if (!in_array($sender->role, ['admin', 'commandant'])) {
            abort(403, 'У вас немає прав для відправки повідомлень студентам.');
        }

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        if (empty($user->email) || !filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return redirect()->back()->withErrors([
                'email' => 'У обраного студента відсутня коректна адреса електронної пошти.',
            ]);
        }

        // 1. Доставляємо внутрішнє сповіщення в кабінет студента (іконка дзвіночка в шапці)
        \App\Models\Notification::create([
            'user_id' => $user->id,
            'title' => "Повідомлення від адміністрації: {$validated['subject']}",
            'message' => $validated['message'],
        ]);

        // 2. Фіксуємо дію в журналі аудиту
        AuditLog::create([
            'user_id' => $sender->id,
            'action' => 'contact_student_email',
            'details' => "Надіслано звернення студенту {$user->name} ({$user->email}) на тему: \"{$validated['subject']}\"",
        ]);

        // 3. Відправляємо на зовнішній email, якщо налаштовано поштовий сервер
        $emailDelivered = false;
        try {
            Mail::to($user->email)->send(
                new DirectStudentMail($user, $sender, $validated['subject'], $validated['message'])
            );
            $emailDelivered = true;
        } catch (\Throwable $e) {
            Log::warning("Зовнішній поштовий сервер не налаштований або повернув помилку при відправці студенту {$user->id} ({$user->email}): " . $e->getMessage());
        }

        $flashMessage = $emailDelivered
            ? "Лист успішно надіслано на email ({$user->email}) та в особистий кабінет студента!"
            : "Повідомлення успішно доставлено в особистий кабінет студента! (Зовнішній email-сервер ще не налаштовано)";

        return redirect()->back()->with('success', $flashMessage);
    }
}
