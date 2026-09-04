<?php

namespace App\Console\Commands;

use App\Services\AcademicPromotionService;
use Illuminate\Console\Command;

class PromoteAcademicCoursesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'academic:promote-students {--force : Примусово перевести всіх студентів без перевірки дати}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Перевести студентів на наступний курс (+1 курс з 1 вересня)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $force = (bool) $this->option('force');

        $this->info("Запуск процедури переведення студентів на новий навчальний рік...");

        $result = AcademicPromotionService::promoteAllStudents($force);

        $this->info("Успішно переведено {$result['count']} студентів на наступний курс (+1) для навчального року {$result['academic_year_label']}.");

        return Command::SUCCESS;
    }
}
