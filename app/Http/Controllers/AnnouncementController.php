<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnnouncementController extends Controller
{
    /**
     * Створення нового оголошення (доступно адміністраторам та комендантам)
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'commandant'])) {
            abort(403, 'У вас немає прав для публікації оголошень.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string|max:5000',
            'priority' => 'required|in:important,info,event',
            'building_id' => 'nullable|exists:buildings,id',
            'is_pinned' => 'boolean',
            'send_email' => 'nullable|boolean',
        ]);

        // Якщо комендант, він може публікувати або для свого корпусу, або загальне
        if ($user->role === 'commandant' && !empty($validated['building_id'])) {
            if ($user->building_id != $validated['building_id']) {
                abort(403, 'Комендант може публікувати оголошення лише для свого корпусу.');
            }
        }

        $announcement = Announcement::create([
            'building_id' => $validated['building_id'] ?? null,
            'user_id' => $user->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'priority' => $validated['priority'],
            'is_pinned' => $validated['is_pinned'] ?? false,
        ]);

        // Email-розсилка для студентів, якщо позначено чекбокс
        $emailsSent = 0;
        if ($request->boolean('send_email')) {
            $studentsQuery = \App\Models\User::where('role', 'student')
                ->whereNotNull('email')
                ->where('email', '!=', '');

            if (!empty($announcement->building_id)) {
                $bId = $announcement->building_id;
                $studentsQuery->where(function ($q) use ($bId) {
                    $q->where('building_id', $bId)
                      ->orWhereHas('approvedBooking.room', function ($rq) use ($bId) {
                          $rq->where('building_id', $bId);
                      });
                });
            }

            $targetStudents = $studentsQuery->get();
            foreach ($targetStudents as $student) {
                if (filter_var($student->email, FILTER_VALIDATE_EMAIL)) {
                    try {
                        \Illuminate\Support\Facades\Mail::to($student->email)->send(new \App\Mail\AnnouncementMail($announcement, $student));
                        $emailsSent++;
                    } catch (\Throwable $e) {
                        \Illuminate\Support\Facades\Log::warning("Не вдалося надіслати оголошення на {$student->email}: " . $e->getMessage());
                    }
                }
            }
        }

        $targetBuildingName = $announcement->building ? $announcement->building->name : 'Усі гуртожитки';
        $emailNotice = $emailsSent > 0 ? " та розіслано на {$emailsSent} email студентів" : "";

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'create_announcement',
            'details' => "Опубліковано нове оголошення: \"{$announcement->title}\" (Ціль: {$targetBuildingName}, Пріоритет: {$announcement->priority}){$emailNotice}",
        ]);

        \App\Events\AnnouncementUpdated::dispatchSafe('created', "Опубліковано нове оголошення: {$announcement->title}", $announcement->building_id);

        $successMsg = $emailsSent > 0
            ? "Оголошення успішно опубліковано та розіслано на пошти {$emailsSent} студентів!"
            : "Оголошення успішно опубліковано!";

        return redirect()->back()->with('success', $successMsg);
    }

    /**
     * Видалення оголошення
     */
    public function destroy(Request $request, Announcement $announcement)
    {
        $user = $request->user();

        if ($user->role !== 'admin' && $announcement->user_id !== $user->id) {
            abort(403, 'Ви можете видаляти лише власні оголошення.');
        }

        $title = $announcement->title;
        $buildingId = $announcement->building_id;
        $announcement->delete();

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'delete_announcement',
            'details' => "Видалено оголошення: \"{$title}\"",
        ]);

        \App\Events\AnnouncementUpdated::dispatchSafe('deleted', "Видалено оголошення: {$title}", $buildingId);

        return redirect()->back()->with('success', 'Оголошення успішно видалено.');
    }
}
