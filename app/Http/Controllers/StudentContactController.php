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

        try {
            Mail::to($user->email)->send(
                new DirectStudentMail($user, $sender, $validated['subject'], $validated['message'])
            );

            AuditLog::create([
                'user_id' => $sender->id,
                'action' => 'contact_student_email',
                'details' => "Надіслано персональний лист студенту {$user->name} ({$user->email}) на тему: \"{$validated['subject']}\"",
            ]);

            return redirect()->back()->with(
                'success',
                "Лист успішно надіслано на пошту студента ({$user->email})!"
            );
        } catch (\Throwable $e) {
            Log::error("Помилка при відправці листа студенту {$user->id}: " . $e->getMessage());

            return redirect()->back()->withErrors([
                'email' => 'Не вдалося надіслати лист через помилку поштового сервера. Повідомлення збережено в системному лозі.',
            ]);
        }
    }
}
