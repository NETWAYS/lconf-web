<?php

class AppKit_DataProvider_UserProviderAction extends AppKitBaseAction {

    private static $sortArray = array(
        "firstname" => "user_firstname",
        "name" => "user_name",
        "lastname" => "user_lastname",
        "modified" => "user_modified",
        "created" => "user_created",
        "disabled" => "user_disabled",
        "id" => "user_id",
        "email" => "user_email"
    );
    public function getDefaultViewName() {
        return 'Success';
    }

    public function isSecure() {
        return true;
    }

    public function getCredentials() {
        return array('lconf.admin');
    }

    private function getUserAsArray(NsmUser $user) {
        return array(
            "id" => $user->user_id,
            "name" => $user->user_name,
            "lastname" => $user->user_lastname,
            "firstname" => $user->user_firstname,
            "authsrc" => $user->user_authsrc,
            "authkey" => $user->user_authkey,
            "email" => $user->user_email,
            "modified" => $user->user_modified,
            "created" => $user->user_created,
            "disabled" => $user->user_disabled
        );
    }

    private function formatUser(NsmUser $user, $simple = false) {

        $userObject = $this->getUserAsArray($user);
        if($simple)
            return $userObject;
        $groups = $user->NsmRole;
        $userObject["roles"] = array();
        foreach($groups as $role) {

            $userObject["roles"][] = array(
                "id" => $role->role_id,
                "name" => $role->role_name,
                "description" => $role->role_name,
                "active" => $role->role_disabled != 1
            );
        }



        $userObject["principals"] = array();
        $targets = $user->getTargets(null,true);

        foreach($targets as $t) {
            //if($t->target_type != "icinga")
            //    continue;
            $userObject["principals"][] = array(
                "target" => $t->toArray(),
                "values" => $user->getTargetValues($t->target_name)->toArray()

            );
        }

        return $userObject;
    }

    public function executeRead(AgaviRequestDataHolder $rd) {
        $useradmin = $this->getContext()->getModel('UserAdmin', 'AppKit');
        $userId = $rd->getParameter('userId',false);
        $disabled = $rd->getParameter('hideDisabled',false) == "false";
        $start = $rd->getParameter('start',false);
        $limit = $rd->getParameter('limit',false);
        $sort = $rd->getParameter('sort',false);
        $asc = ($rd->getParameter('dir','ASC') == 'ASC');

        if($sort) {
            if(array_key_exists($sort, self::$sortArray))
                $sort = self::$sortArray[$sort];
            else
                $sort = false;
        }



        $result;

        // return a single user when an id is provided
        if ($userId !== false) {
            $user = $useradmin->getUserById($userId);

            if (!$user instanceof NsmUser) {
                return "{}";
            }

            $result = $this->formatUser($user);

            $this->setAttribute("user", $result);

        } else {	//return list of all users if no id is provided
            $users;

            if ($start === false || $limit === false) {
                $users = $useradmin->getUsersCollection($disabled);
            } else {
                $users = $useradmin->getUsersCollectionInRange($disabled,$start,$limit,$sort,$asc);
            }

            $result = array();
            foreach($users as $user) {
                $result[] = $this->formatUser($user,true);
            }
            $this->setAttribute("users", $result);
       }
       return 'Success';
    }

    public function executeWrite(AgaviRequestDataHolder $rd) {
        // We need the execute method to work with parameter od the request!
        try {
            AppKitDoctrineUtil::getConnection()->beginTransaction();

            $useradmin = $this->getContext()->getModel('UserAdmin', 'AppKit');
            $padmin = $this->getContext()->getModel('PrincipalAdmin', 'AppKit');

            if ($rd->getParameter('id') == 'new') {
                $user = new NsmUser();
            } else {
                $user = $useradmin->getUserById($rd->getParameter('id'));
            }

            $useradmin->updateUserData($user, $rd);

            if ($rd->getParameter('password_validate', false) !== false) {
                $useradmin->updateUserPassword($user, $rd->getParameter('password_validate'));
            }

            // Updating the roles
            $useradmin->updateUserroles($user, $rd->getParameter('userroles', array()));

            $padmin->updatePrincipalValueData(
                $user->principal,
                $rd->getParameter('principal_target', array()),
                $rd->getParameter('principal_value', array())
            );

            AppKitDoctrineUtil::getConnection()->commit();
        } catch (Exception $e) {
            try {
                AppKitDoctrineUtil::getConnection()->rollback();
            } catch (Doctrine_Transaction_Exception $e) {}
            print_r($e->getTraceAsString());
            $this->setAttribute("error",$e->getMessage());

        }

        return 'Success';
    }

    public function executeRemove(AgaviRequestDataHolder $rd) {
        $useradmin = $this->getContext()->getModel('UserAdmin', 'AppKit');
        $padmin = $this->getContext()->getModel('PrincipalAdmin', 'AppKit');
        
        $ids = $rd->getParameter("ids",array());
        
        foreach($ids as $id) {
            $user = $useradmin->getUserById($id);

            if (!$user) {
                continue;
            }

            $useradmin->removeUser($user);
        }

        return 'Success';
    }

    public function handleError(AgaviRequestDataHolder $rd) {
        return 'Success';
    }

}

?>
