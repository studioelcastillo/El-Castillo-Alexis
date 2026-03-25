<?php
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "--- User Statistics ---\n";
echo "Total Users: " . User::count() . "\n";
echo "Users with user_active = true: " . User::where('user_active', true)->count() . "\n";
echo "Users with user_active = false: " . User::where('user_active', false)->count() . "\n";
echo "Users with deleted_at IS NOT NULL: " . User::whereNotNull('deleted_at')->count() . "\n";

echo "\n--- Data Type Check (user_active) ---\n";
$firstUser = User::first();
if ($firstUser) {
    echo "Raw user_active value: " . var_export($firstUser->user_active, true) . " (Type: " . gettype($firstUser->user_active) . ")\n";
}

echo "\n--- Sample Users ---\n";
$samples = User::select('user_id', 'user_name', 'user_active', 'deleted_at', 'prof_id')
    ->orderBy('user_id', 'desc')
    ->limit(10)
    ->get();

foreach ($samples as $u) {
    echo "ID: {$u->user_id} | Name: {$u->user_name} | Active: " . var_export($u->user_active, true) . " | Deleted: " . var_export($u->deleted_at, true) . " | Prof: {$u->prof_id}\n";
}

echo "\n--- Datatable Query Simulation ---\n";
// Trying to simulate the query in UserController.php
$bool_active_users = true;

$users = User::where('user_active', $bool_active_users)
    ->whereNull('users.deleted_at')
    ->limit(5)
    ->get();

echo "Datatable Simulation Count (Active=true): " . count($users) . "\n";
foreach ($users as $u) {
    echo "ID: {$u->user_id} | Name: {$u->user_name}\n";
}

$bool_active_users = false;

$usersInactive = User::where('user_active', $bool_active_users)
    ->whereNull('users.deleted_at')
    ->limit(5)
    ->get();
echo "Datatable Simulation Count (Active=false): " . count($usersInactive) . "\n";

echo "\n--- Raw SQL Check ---\n";
$rawActive = DB::select("SELECT count(*) as count FROM users WHERE user_active IS TRUE");
echo "Raw SQL (IS TRUE): " . $rawActive[0]->count . "\n";
$rawFalse = DB::select("SELECT count(*) as count FROM users WHERE user_active IS FALSE");
echo "Raw SQL (IS FALSE): " . $rawFalse[0]->count . "\n";
$rawNull = DB::select("SELECT count(*) as count FROM users WHERE user_active IS NULL");
echo "Raw SQL (IS NULL): " . $rawNull[0]->count . "\n";
