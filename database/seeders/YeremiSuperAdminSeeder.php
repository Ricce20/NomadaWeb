<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class YeremiSuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email = 'yeremi@gmail.com';

        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = new User();
            $user->name = 'Yeremi SuperAdmin';
            $user->email = $email;
            $user->username = 'yeremi_admin';
            $user->phone = '5550000000';
            $user->type = User::TYPE_SUPER_ADMIN;
            $user->password = Hash::make($email);
            $user->email_verified_at = now();
            $user->save();
        } else {
            // Ensure desired state for testing convenience
            $user->type = User::TYPE_SUPER_ADMIN;
            $user->password = Hash::make($email);
            if (!$user->email_verified_at) {
                $user->email_verified_at = now();
            }
            $user->save();
        }
    }
}