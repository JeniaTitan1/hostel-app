<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed default values
        \DB::table('settings')->insert([
            ['key' => 'min_beds_per_room', 'value' => '1', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'max_beds_per_room', 'value' => '20', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'global_intake_closed', 'value' => '0', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
