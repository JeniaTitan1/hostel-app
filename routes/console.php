<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Автоматичне переведення студентів на наступний курс (+1) щороку 1 вересня
\Illuminate\Support\Facades\Schedule::command('academic:promote-students')
    ->yearlyOn(9, 1, '00:01')
    ->description('Щорічне переведення студентів на новий навчальний рік');

