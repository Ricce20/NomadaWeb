<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class YeremiUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update the test user "Yeremi" with super_admin role
        $email = 'yeremi@test.com';
        $password = 'Yeremi123!';

        $user = User::query()->where('email', $email)->first();

        if (! $user) {
            User::create([
                'name' => 'Yeremi',
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]);
        } else {
            $user->forceFill([
                'name' => 'Yeremi',
                'password' => Hash::make($password),
                'email_verified_at' => $user->email_verified_at ?: now(),
            ])->save();
        }
    }
}
