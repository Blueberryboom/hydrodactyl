<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Helpers\SoftwareVersionService;

class BaseController extends Controller
{
    /**
     * BaseController constructor.
     */
    public function __construct(private SoftwareVersionService $version, private ViewFactory $view)
    {
    }

    /**
     * Return the admin index view.
     */
    public function index(Request $request): View
    {
        $user = $request->user();

        return $this->view->make('admin.index', [
            'version' => $this->version,
            'overview' => [
                'username' => $user instanceof User ? $user->username : 'Admin',
                'totalNodes' => Node::query()->count(),
                'totalServers' => Server::query()->count(),
                'totalUsers' => User::query()->count(),
            ],
        ]);
    }
}
