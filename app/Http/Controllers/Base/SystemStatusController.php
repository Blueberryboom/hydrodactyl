<?php

namespace Pterodactyl\Http\Controllers\Base;

use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Arr;
use Pterodactyl\Enums\Daemon\DaemonType;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Pterodactyl\Repositories\Elytra\DaemonServerRepository as ElytraDaemonServerRepository;
use Pterodactyl\Repositories\Wings\DaemonConfigurationRepository;
use Pterodactyl\Repositories\Wings\DaemonServerRepository as WingsDaemonServerRepository;

class SystemStatusController extends Controller
{
    /**
     * Get system metrics and status
     */
  public function index(): JsonResponse
  {
    try {
      $metrics = Cache::remember('system_metrics', 5, function () {
        return [
          'status' => 'running',
          'timestamp' => now()->toIso8601String(),
          'metrics' => [
            'uptime' => $this->getUptime(),
            'memory' => $this->getMemoryUsage(),
            'cpu' => $this->getCpuUsage(),
            'disk' => $this->getDiskUsage(),
            'network' => $this->getNetworkUsage(),
          ],
          'overview' => $this->getOverview(),
          'system' => [
            'php_version' => PHP_VERSION,
            'os' => php_uname(),
            'hostname' => gethostname(),
            'load_average' => sys_getloadavg(),
          ]
        ];
      });

      return response()->json($metrics);

    } catch (\Throwable $e) {
      return response()->json([
        'status' => 'error',
        'message' => 'Failed to retrieve system metrics',
        'error' => $e->getMessage()
      ], 500);
    }
  }

  private function getMemoryUsage(): array
  {
    if (PHP_OS_FAMILY === 'Darwin') {
      $memory = shell_exec('vm_stat');
      if (!$memory) {
        throw new \RuntimeException('Failed to execute vm_stat command');
      }

      // Parse memory stats more reliably
      $stats = [];
      foreach (explode("\n", $memory) as $line) {
        if (preg_match('/Pages\s+([^:]+):\s+(\d+)/', $line, $matches)) {
          $stats[strtolower($matches[1])] = (int) $matches[2];
        }
      }

      $page_size = 4096; // Default page size for macOS

      $total_memory = $this->getTotalMemoryMac();
      $free_memory = ($stats['free'] ?? 0) * $page_size;
      $used_memory = $total_memory - $free_memory;

      return [
        'total' => $total_memory,
        'used' => $used_memory,
        'free' => $free_memory,
        'page_size' => $page_size
      ];
    }

    // Linux memory calculation
    $memory = shell_exec('free -b');
    if (!$memory) {
      throw new \RuntimeException('Failed to execute free command');
    }

    if (!preg_match('/Mem:\s+(\d+)\s+(\d+)\s+(\d+)/', $memory, $matches)) {
      throw new \RuntimeException('Failed to parse memory information');
    }

    return [
      'total' => (int) $matches[1],
      'used' => (int) $matches[2],
      'free' => (int) $matches[3]
    ];
  }

  private function getTotalMemoryMac(): int
  {
    $memory = shell_exec('sysctl hw.memsize');
    if (!$memory || !preg_match('/hw.memsize: (\d+)/', $memory, $matches)) {
      throw new \RuntimeException('Failed to get total memory size');
    }
    return (int) $matches[1];
  }

  private function getCpuUsage(): float
  {
    if (PHP_OS_FAMILY === 'Darwin') {
      $cmd = "top -l 1 | grep -E '^CPU' | awk '{print $3}' | cut -d'%' -f1";
    } else {
      $cmd = "top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'";
    }

    $usage = shell_exec($cmd);
    if ($usage === null) {
      throw new \RuntimeException('Failed to get CPU usage');
    }

    return (float) $usage;
  }

  private function getDiskUsage(): array
  {
    $total = disk_total_space('/');
    $free = disk_free_space('/');

    if ($total === false || $free === false) {
      throw new \RuntimeException('Failed to get disk  space information');
    }

    return [
      'total' => $total,
      'free' => $free,
      'used' => $total - $free
    ];
  }

  private function getOverview(): array
  {
    $totalNodes = Node::query()->count();
    $onlineNodes = Node::query()->get()->filter(fn (Node $node) => $this->isNodeOnline($node))->count();
    $serverStates = $this->getServerStates();

    return [
      'total_nodes' => $totalNodes,
      'online_nodes' => $onlineNodes,
      'offline_nodes' => max(0, $totalNodes - $onlineNodes),
      'total_servers' => $serverStates['total'],
      'online_servers' => $serverStates['online'],
      'offline_servers' => max(0, $serverStates['total'] - $serverStates['online']),
      'total_users' => User::query()->count(),
    ];
  }

  private function isNodeOnline(Node $node): bool
  {
    return Cache::remember("node_online:$node->id", 60, function () use ($node) {
      try {
        app(DaemonConfigurationRepository::class)->setNode($node)->getSystemInformation();

        return true;
      } catch (\Throwable) {
        return false;
      }
    });
  }

  private function getServerStates(): array
  {
    $total = Server::query()->count();
    $online = Server::query()
      ->with('node')
      ->get(['id', 'uuid', 'node_id'])
      ->filter(fn (Server $server) => $this->isServerOnline($server))
      ->count();

    return ['total' => $total, 'online' => $online];
  }

  private function isServerOnline(Server $server): bool
  {
    try {
      $stats = Cache::remember("resources:$server->uuid", 20, function () use ($server) {
        $daemonType = $server->node?->daemonType ?? DaemonType::ELYTRA->value;

        return $daemonType === DaemonType::WINGS->value
          ? app(WingsDaemonServerRepository::class)->setServer($server)->getDetails()
          : app(ElytraDaemonServerRepository::class)->setServer($server)->getDetails();
      });
    } catch (\Throwable) {
      return false;
    }

    return in_array(Arr::get($stats, 'state', 'stopped'), ['running', 'starting'], true);
  }

  private function getNetworkUsage(): array
  {
    if (PHP_OS_FAMILY === 'Darwin') {
      $network = shell_exec('netstat -ibn');
      if (!$network) {
        return ['rx_bytes' => 0, 'tx_bytes' => 0];
      }

      $rx = 0;
      $tx = 0;
      foreach (explode("\n", $network) as $line) {
        $columns = preg_split('/\s+/', trim($line));
        if (count($columns) >= 10 && ($columns[0] ?? '') !== 'Name') {
          $rx += (int) ($columns[6] ?? 0);
          $tx += (int) ($columns[9] ?? 0);
        }
      }

      return ['rx_bytes' => $rx, 'tx_bytes' => $tx];
    }

    $network = @file('/proc/net/dev', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($network === false) {
      return ['rx_bytes' => 0, 'tx_bytes' => 0];
    }

    $rx = 0;
    $tx = 0;
    foreach (array_slice($network, 2) as $line) {
      [$interface, $data] = array_pad(explode(':', $line, 2), 2, '');
      if (trim($interface) === 'lo') {
        continue;
      }

      $columns = preg_split('/\s+/', trim($data));
      $rx += (int) ($columns[0] ?? 0);
      $tx += (int) ($columns[8] ?? 0);
    }

    return ['rx_bytes' => $rx, 'tx_bytes' => $tx];
  }

  private function getUptime(): int
  {
    if (PHP_OS_FAMILY === 'Darwin') {
      $uptime = shell_exec('sysctl -n kern.boottime');
      if (!$uptime || !preg_match('/sec = (\d+)/', $uptime, $matches)) {
        throw new \RuntimeException('Failed to get system uptime');
      }
      return time() - (int) $matches[1];
    }

    $uptime = @file_get_contents('/proc/uptime');
    if ($uptime === false) {
      throw new \RuntimeException('Failed to read uptime file');
    }

    return (int) floatval($uptime);
  }
}
