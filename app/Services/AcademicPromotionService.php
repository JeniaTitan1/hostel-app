<?php

namespace App\Services;

use App\Models\User;
use App\Models\Setting;
use App\Models\AuditLog;
use App\Models\AcademicCourse;
use Carbon\Carbon;

class AcademicPromotionService
{
    /**
     * Отримати поточний академічний рік початку навчання (наприклад, для вересня 2026 це 2026)
     */
    public static function getCurrentAcademicYear(): int
    {
        $now = Carbon::now();
        // В Україні навчальний рік починається 1 вересня
        return $now->month >= 9 ? $now->year : ($now->year - 1);
    }

    /**
     * Перевірка та автоматичне переведення студентів з 1 вересня
     */
    public static function checkAndAutoPromote(?int $actorId = null): array
    {
        $autoEnabled = Setting::get('auto_promote_courses_on_september', '1') === '1';
        if (!$autoEnabled) {
            return ['promoted' => false, 'reason' => 'disabled'];
        }

        $currentYear = self::getCurrentAcademicYear();
        $lastPromotedYear = (int) Setting::get('last_academic_promotion_year', 0);

        // Якщо для поточного навчального року переведення ще не виконувалось
        if ($lastPromotedYear < $currentYear) {
            return self::promoteAllStudents(false, $actorId);
        }

        return ['promoted' => false, 'reason' => 'already_promoted_this_year'];
    }

    /**
     * Підвищення курсу (+1) для всіх діючих студентів
     * 
     * @param bool $force Якщо true, ігнорує обмеження року та дату створення
     * @param int|null $actorId ID користувача, який ініціював дію (або null для системи)
     * @return array
     */
    public static function promoteAllStudents(bool $force = false, ?int $actorId = null): array
    {
        $currentYear = self::getCurrentAcademicYear();
        $maxCourse = (int) (AcademicCourse::max('number') ?: 6);

        $query = User::where('role', 'user')->whereNotNull('course');

        if (!$force) {
            // Захист: не підвищувати повторно тих, хто щойно зареєструвався після 1 вересня поточного року
            $academicStart = Carbon::create($currentYear, 9, 1, 0, 0, 0);
            $query->where('created_at', '<', $academicStart);
        }

        $students = $query->get();
        $count = 0;

        foreach ($students as $student) {
            if ($student->course < $maxCourse) {
                $student->course += 1;
                $student->save();
                $count++;
            }
        }

        Setting::set('last_academic_promotion_year', (string) $currentYear);
        Setting::set('last_academic_promotion_date', Carbon::now()->toDateTimeString());

        $yearLabel = "{$currentYear}/" . ($currentYear + 1);
        $actionName = $force ? 'manual_promotion' : 'automatic_september_promotion';
        $logText = "Перехід на {$yearLabel} навчальний рік (з 1 вересня): переведено на наступний курс (+1) для {$count} студентів.";

        AuditLog::log($actorId, $actionName, $logText);

        return [
            'promoted' => true,
            'count' => $count,
            'academic_year' => $currentYear,
            'academic_year_label' => $yearLabel,
        ];
    }
}
