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

        $targetBuildingName = $announcement->building ? $announcement->building->name : 'Усі гуртожитки';
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'create_announcement',
            'details' => "Опубліковано нове оголошення: \"{$announcement->title}\" (Ціль: {$targetBuildingName}, Пріоритет: {$announcement->priority})",
        ]);

        \App\Events\AnnouncementUpdated::dispatchSafe('created', "Опубліковано нове оголошення: {$announcement->title}", $announcement->building_id);

        return redirect()->back()->with('success', 'Оголошення успішно опубліковано!');
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
