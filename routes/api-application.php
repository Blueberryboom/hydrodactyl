<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Api\Application;
use Pterodactyl\Http\Controllers\Base;



/*
|--------------------------------------------------------------------------
| Root Server Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/panel
|
*/

Route::group(['prefix' => '/panel'], function () {
    Route::get('/status', [Base\SystemStatusController::class, 'index']);
});

Route::group(['prefix' => '/settings'], function () {
    Route::get('/', [Application\Settings\SettingsController::class, 'index']);
    Route::patch('/', [Application\Settings\SettingsController::class, 'update']);
    Route::get('/mail', [Application\Settings\SettingsController::class, 'mail']);
    Route::patch('/mail', [Application\Settings\SettingsController::class, 'updateMail']);
    Route::post('/mail/test', [Application\Settings\SettingsController::class, 'testMail']);
    Route::get('/captcha', [Application\Settings\SettingsController::class, 'captcha']);
    Route::patch('/captcha', [Application\Settings\SettingsController::class, 'updateCaptcha']);
    Route::get('/advanced', [Application\Settings\SettingsController::class, 'advanced']);
    Route::patch('/advanced', [Application\Settings\SettingsController::class, 'updateAdvanced']);
    Route::get('/custom-navigation', [Application\Settings\SettingsController::class, 'customNavigation']);
    Route::patch('/custom-navigation', [Application\Settings\SettingsController::class, 'updateCustomNavigation']);
    Route::get('/logo', [Application\Settings\SettingsController::class, 'logo']);
    Route::post('/logo', [Application\Settings\SettingsController::class, 'updateLogo']);
    Route::patch('/logo', [Application\Settings\SettingsController::class, 'updateLogo']);
    Route::get('/domains', [Application\Settings\SettingsController::class, 'domains']);
    Route::post('/domains', [Application\Settings\SettingsController::class, 'storeDomain']);
    Route::post('/domains/test', [Application\Settings\SettingsController::class, 'testDomainConnection']);
    Route::get('/domains/schema/{provider}', [Application\Settings\SettingsController::class, 'domainProviderSchema']);
    Route::get('/domains/{domain:id}', [Application\Settings\SettingsController::class, 'domain']);
    Route::patch('/domains/{domain:id}', [Application\Settings\SettingsController::class, 'updateDomain']);
    Route::delete('/domains/{domain:id}', [Application\Settings\SettingsController::class, 'deleteDomain']);
});


/*
|--------------------------------------------------------------------------
| User Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/users
|
*/


Route::group(['prefix' => '/users'], function () {
    Route::get('/', [Application\Users\UserController::class, 'index'])->name('api.application.users');
    Route::get('/{user:id}', [Application\Users\UserController::class, 'view'])->name('api.application.users.view');
    Route::get('/external/{external_id}', [Application\Users\ExternalUserController::class, 'index'])->name('api.application.users.external');

    Route::post('/', [Application\Users\UserController::class, 'store']);
    Route::patch('/{user:id}', [Application\Users\UserController::class, 'update']);

    Route::delete('/{user:id}', [Application\Users\UserController::class, 'delete']);
});

/*
|--------------------------------------------------------------------------
| Node Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/nodes
|
*/
Route::group(['prefix' => '/nodes'], function () {
    Route::get('/', [Application\Nodes\NodeController::class, 'index'])->name('api.application.nodes');
    Route::get('/deployable', Application\Nodes\NodeDeploymentController::class);
    Route::get('/{node:id}', [Application\Nodes\NodeController::class, 'view'])->name('api.application.nodes.view');
    Route::get('/{node:id}/configuration', Application\Nodes\NodeConfigurationController::class);

    Route::post('/', [Application\Nodes\NodeController::class, 'store']);
    Route::patch('/{node:id}', [Application\Nodes\NodeController::class, 'update']);

    Route::delete('/{node:id}', [Application\Nodes\NodeController::class, 'delete']);

    Route::group(['prefix' => '/{node:id}/allocations'], function () {
        Route::get('/', [Application\Nodes\AllocationController::class, 'index'])->name('api.application.allocations');
        Route::post('/', [Application\Nodes\AllocationController::class, 'store']);
        Route::delete('/{allocation:id}', [Application\Nodes\AllocationController::class, 'delete'])->name('api.application.allocations.view');
    });
});

/*
|--------------------------------------------------------------------------
| Location Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/locations
|
*/
Route::group(['prefix' => '/locations'], function () {
    Route::get('/', [Application\Locations\LocationController::class, 'index'])->name('api.applications.locations');
    Route::get('/{location:id}', [Application\Locations\LocationController::class, 'view'])->name('api.application.locations.view');

    Route::post('/', [Application\Locations\LocationController::class, 'store']);
    Route::patch('/{location:id}', [Application\Locations\LocationController::class, 'update']);

    Route::delete('/{location:id}', [Application\Locations\LocationController::class, 'delete']);
});

/*
|--------------------------------------------------------------------------
| Server Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/servers
|
*/
Route::group(['prefix' => '/servers'], function () {
    Route::get('/', [Application\Servers\ServerController::class, 'index'])->name('api.application.servers');
    Route::get('/{server:id}', [Application\Servers\ServerController::class, 'view'])->name('api.application.servers.view');
    Route::get('/external/{external_id}', [Application\Servers\ExternalServerController::class, 'index'])->name('api.application.servers.external');

    Route::patch('/{server:id}/details', [Application\Servers\ServerDetailsController::class, 'details'])->name('api.application.servers.details');
    Route::patch('/{server:id}/build', [Application\Servers\ServerDetailsController::class, 'build'])->name('api.application.servers.build');
    Route::patch('/{server:id}/startup', [Application\Servers\StartupController::class, 'index'])->name('api.application.servers.startup');

    Route::post('/', [Application\Servers\ServerController::class, 'store']);
    Route::post('/{server:id}/suspend', [Application\Servers\ServerManagementController::class, 'suspend'])->name('api.application.servers.suspend');
    Route::post('/{server:id}/unsuspend', [Application\Servers\ServerManagementController::class, 'unsuspend'])->name('api.application.servers.unsuspend');
    Route::post('/{server:id}/reinstall', [Application\Servers\ServerManagementController::class, 'reinstall'])->name('api.application.servers.reinstall');

    Route::delete('/{server:id}', [Application\Servers\ServerController::class, 'delete']);
    Route::delete('/{server:id}/{force?}', [Application\Servers\ServerController::class, 'delete']);

    // Database Management Endpoint
    Route::group(['prefix' => '/{server:id}/databases'], function () {
        Route::get('/', [Application\Servers\DatabaseController::class, 'index'])->name('api.application.servers.databases');
        Route::get('/{database:id}', [Application\Servers\DatabaseController::class, 'view'])->name('api.application.servers.databases.view');

        Route::post('/', [Application\Servers\DatabaseController::class, 'store']);
        Route::post('/{database:id}/reset-password', [Application\Servers\DatabaseController::class, 'resetPassword']);

        Route::delete('/{database:id}', [Application\Servers\DatabaseController::class, 'delete']);
    });
});

/*
|--------------------------------------------------------------------------
| Nest Controller Routes
|--------------------------------------------------------------------------
|
| Endpoint: /api/application/nests
|
*/
Route::group(['prefix' => '/nests'], function () {
    Route::get('/', [Application\Nests\NestController::class, 'index'])->name('api.application.nests');
    Route::get('/{nest:id}', [Application\Nests\NestController::class, 'view'])->name('api.application.nests.view');

    Route::post('/', [Application\Nests\NestController::class, 'store']);
    Route::patch('/{nest:id}', [Application\Nests\NestController::class, 'update']);

    Route::delete('/{nest:id}', [Application\Nests\NestController::class, 'delete']);

    // Egg Management Endpoint
    Route::group(['prefix' => '/{nest:id}/eggs'], function () {
        Route::get('/', [Application\Nests\EggController::class, 'index'])->name('api.application.nests.eggs');
        Route::get('/{egg:id}', [Application\Nests\EggController::class, 'view'])->name('api.application.nests.eggs.view');

        Route::post('/', [Application\Nests\EggController::class, 'store']);
        Route::patch('/{egg:id}', [Application\Nests\EggController::class, 'update']);
        Route::delete('/{egg:id}', [Application\Nests\EggController::class, 'delete']);
        Route::post('/import', [Application\Nests\EggController::class, 'import']);
        Route::post('/import-url', [Application\Nests\EggController::class, 'importFromUrl']);
    });
});
