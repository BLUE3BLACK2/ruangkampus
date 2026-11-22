<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `nim` and `nip` are already created by
     * 0001_01_01_000000_create_users_table.
     *
     * Kept as a compatibility no-op for databases that ran the stock users
     * migration before these columns existed. Each column is guarded on its own
     * so a partially migrated database still ends up complete.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'nim')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('nim', 20)->nullable()->unique()->after('role');
            });
        }

        if (! Schema::hasColumn('users', 'nip')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('nip', 20)->nullable()->unique()->after('nim');
            });
        }
    }

    /**
     * No-op on purpose: `create_users_table` owns both columns.
     */
    public function down(): void
    {
        //
    }
};
