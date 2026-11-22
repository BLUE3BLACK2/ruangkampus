<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `role` is already created by 0001_01_01_000000_create_users_table.
     *
     * This migration is kept only as a compatibility no-op for databases that
     * ran the stock users migration before the column was added there. Without
     * the guard, migrating from an empty database fails with a duplicate column
     * error.
     */
    public function up(): void
    {
        if (Schema::hasColumn('users', 'role')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')
                ->default('mahasiswa')
                ->after('password');
        });
    }

    /**
     * No-op on purpose: `create_users_table` owns the column, so dropping it
     * here would break that migration's schema on rollback.
     */
    public function down(): void
    {
        //
    }
};
