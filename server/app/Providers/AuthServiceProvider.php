<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

use App\User;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Boot the authentication services for the application.
     *
     * @return void
     */
    public function boot()
    {
        $this->app['auth']->viaRequest('api', function ($request) {
            if ($request->header('Authorization')) {
                $token = explode(' ', $request->header('Authorization'))[1];

                if (empty($token)) {
                    return null;
                }

                $user = User::where('api_token', $token)->first();

                if (empty($user) || !$user->checkToken()) {
                    return null;
                }

                return $user;
            }
        });
    }
}
