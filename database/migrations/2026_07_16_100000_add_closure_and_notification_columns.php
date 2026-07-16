<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('closure_reason')->nullable();
            $table->string('closure_duration')->nullable();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('reallocated_notification')->default(false);
            $table->string('reallocated_from')->nullable();
            $table->string('reallocated_to')->nullable();
            $table->string('reallocated_reason')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn(['closure_reason', 'closure_duration']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'reallocated_notification',
                'reallocated_from',
                'reallocated_to',
                'reallocated_reason'
            ]);
        });
    }
};
