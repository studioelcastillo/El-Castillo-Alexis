<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;
use Log;

use App\Library\HelperController;
use App\Library\LogController;
use App\Models\User;
use App\Models\UserPermission;

class UserPermissionController extends Controller
{
    private $helper;
    private $log;

    /**
     * Create a new instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->helper = new HelperController();
        $this->log = new LogController();
    }

    /**
     * Manage record.
     *
     * @return boolean true if successful, false otherwise
     */
    public function managePermissions($user, $permissions)
    {
        if ($user->prof_id === 3) {
            $toNotDelete = array();
            foreach ($permissions as $key => $permission) {
              $up = UserPermission::updateOrCreate(
                [
                  'user_id' => $user->user_id,
                  'userperm_feature' => strtoupper($key)
                ],
                [
                  'user_id' => $user->user_id,
                  'userperm_feature' => strtoupper($key),
                  'userperm_state' => strtoupper($permission),
                ]
              );
              array_push($toNotDelete, $up->userperm_id);
            }
            UserPermission::where('user_id', $user->user_id)->whereNotIn('userperm_id', $toNotDelete)->delete();
        } else {
            UserPermission::where('user_id', $user->user_id)->delete();
        }
        return true;
    }
}
