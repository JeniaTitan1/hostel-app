<?php

namespace App\Services;

use App\Models\User;
use App\Models\Setting;
use App\Models\AuditLog;
use App\Models\AcademicCourse;
use App\Models\Building;
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
     * Отримати детальну академічну статистику для панелі налаштувань
     */
    public static function getPromotionStatistics(): array
    {
        $currentYear = self::getCurrentAcademicYear();
        $yearLabel = "{$currentYear}/" . ($currentYear + 1);

        $students = User::where('role', 'user')->whereNotNull('course')->with(['bookings' => function ($q) {
            $q->where('status', 'approved')->with('room.building');
        }])->get();

        $courseDist = [];
        foreach ([1, 2, 3, 4, 5, 6] as $c) {
            $courseDist[$c] = 0;
        }

        $buildingDist = [];
        $unassignedCount = 0;

        $buildings = Building::all(['id', 'name']);
        foreach ($buildings as $b) {
            $buildingDist[$b->id] = [
                'id' => $b->id,
                'name' => $b->name,
                'count' => 0,
            ];
        }

        foreach ($students as $student) {
            $c = (int) $student->course;
            if (isset($courseDist[$c])) {
                $courseDist[$c]++;
            } else {
                $courseDist[$c] = 1;
            }

            $approvedBooking = $student->bookings->first();
            $buildingId = $approvedBooking?->room?->building_id;

            if ($buildingId && isset($buildingDist[$buildingId])) {
                $buildingDist[$buildingId]['count']++;
            } else {
                $unassignedCount++;
            }
        }

        return [
            'currentAcademicYear'  => $currentYear,
            'academicYearLabel'    => $yearLabel,
            'autoPromote'          => Setting::get('auto_promote_courses_on_september', '1') === '1',
            'lastPromotedYear'     => (int) Setting::get('last_academic_promotion_year', 0),
            'lastPromotedDate'     => Setting::get('last_academic_promotion_date'),
            'totalStudents'        => $students->count(),
            'courseDistribution'   => $courseDist,
            'buildingDistribution' => array_values($buildingDist),
            'unassignedCount'      => $unassignedCount,
        ];
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
     * Базове глобальне підвищення курсу (+1) для всіх
     */
    public static function promoteAllStudents(bool $force = false, ?int $actorId = null): array
    {
        return self::processTargetedPromotion([
            'direction' => '+1',
            'building_id' => 'all',
            'specialty' => 'all',
            'source_course' => 'all',
            'force' => $force,
        ], $actorId);
    }

    /**
     * Базове глобальне пониження курсу (-1) для всіх
     */
    public static function demoteAllStudents(?int $actorId = null): array
    {
        return self::processTargetedPromotion([
            'direction' => '-1',
            'building_id' => 'all',
            'specialty' => 'all',
            'source_course' => 'all',
            'force' => true,
        ], $actorId);
    }

    /**
     * Гнучке переведення студентів за фільтрами (корпус, спеціальність, початковий курс, напрямок +1/-1)
     * 
     * @param array $filters [
     *     'direction' => '+1' | '-1',
     *     'building_id' => 'all' | 'unassigned' | int,
     *     'specialty' => 'all' | string,
     *     'source_course' => 'all' | int,
     *     'force' => bool,
     * ]
     * @param int|null $actorId
     * @return array
     */
    public static function processTargetedPromotion(array $filters, ?int $actorId = null): array
    {
        $direction = $filters['direction'] ?? '+1'; // '+1' або '-1'
        $buildingId = $filters['building_id'] ?? 'all';
        $specialty = $filters['specialty'] ?? 'all';
        $sourceCourse = $filters['source_course'] ?? 'all';
        $force = !empty($filters['force']);

        $currentYear = self::getCurrentAcademicYear();
        $yearLabel = "{$currentYear}/" . ($currentYear + 1);
        $maxCourse = (int) (AcademicCourse::max('number') ?: 6);

        $query = User::where('role', 'user')->whereNotNull('course');

        // Фільтр по спеціальності
        if ($specialty && $specialty !== 'all') {
            $query->where('specialty', $specialty);
        }

        // Фільтр по поточному курсу
        if ($sourceCourse && $sourceCourse !== 'all') {
            $query->where('course', (int) $sourceCourse);
        }

        // Фільтр по корпусу проживання / закріплення
        if ($buildingId === 'unassigned') {
            $query->whereDoesntHave('bookings', function ($b) {
                $b->where('status', 'approved');
            });
        } elseif ($buildingId !== 'all' && is_numeric($buildingId)) {
            $bId = (int) $buildingId;
            $query->where(function ($q) use ($bId) {
                $q->whereHas('bookings', function ($b) use ($bId) {
                    $b->where('status', 'approved')->whereHas('room', function ($r) use ($bId) {
                        $r->where('building_id', $bId);
                    });
                })->orWhere(function ($q2) use ($bId) {
                    $q2->whereDoesntHave('bookings', function ($b) {
                        $b->where('status', 'approved');
                    })->where(function ($q3) use ($bId) {
                        $q3->whereJsonContains('allowed_buildings', $bId)
                           ->orWhereJsonContains('allowed_buildings', (string) $bId);
                    });
                });
            });
        }

        // Захист для автоматичного/планового переведення +1: не чіпати новачків поточного року
        if (!$force && $direction === '+1') {
            $academicStart = Carbon::create($currentYear, 9, 1, 0, 0, 0);
            $query->where('created_at', '<', $academicStart);
        }

        $students = $query->get();
        $count = 0;

        foreach ($students as $student) {
            $oldCourse = (int) $student->course;
            if ($direction === '+1') {
                if ($oldCourse < $maxCourse) {
                    $student->course = $oldCourse + 1;
                    $student->save();
                    $count++;
                }
            } elseif ($direction === '-1') {
                if ($oldCourse > 1) {
                    $student->course = $oldCourse - 1;
                    $student->save();
                    $count++;
                }
            }
        }

        // Якщо проводилося повне підвищення для всіх
        if ($direction === '+1' && $buildingId === 'all' && $specialty === 'all' && $sourceCourse === 'all') {
            Setting::set('last_academic_promotion_year', (string) $currentYear);
            Setting::set('last_academic_promotion_date', Carbon::now()->toDateTimeString());
        }

        // Детальний запис у журнал аудиту
        $dirText = $direction === '+1' ? 'на наступний курс (+1)' : 'на курс нижче (-1)';
        $scopeText = [];
        if ($buildingId !== 'all') {
            $bName = $buildingId === 'unassigned' ? 'Без корпусу' : (Building::find($buildingId)?->name ?: "Корпус #{$buildingId}");
            $scopeText[] = "корпус: {$bName}";
        }
        if ($specialty !== 'all') {
            $scopeText[] = "спец.: {$specialty}";
        }
        if ($sourceCourse !== 'all') {
            $scopeText[] = "початковий курс: {$sourceCourse}";
        }
        $scopeStr = count($scopeText) > 0 ? ' (' . implode(', ', $scopeText) . ')' : ' (всі студенти)';

        AuditLog::log(
            $actorId,
            $direction === '+1' ? 'academic_promotion' : 'academic_demotion',
            "Переведення студентів {$dirText}{$scopeStr}: оновлено {$count} студентів."
        );

        return [
            'success'             => true,
            'count'               => $count,
            'direction'           => $direction,
            'academic_year'       => $currentYear,
            'academic_year_label' => $yearLabel,
        ];
    }
}
