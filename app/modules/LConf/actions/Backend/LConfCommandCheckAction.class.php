<?php
/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of LConfCommandCheckAction
 *
 * @author jmosshammer
 */
class LConf_Backend_LConfCommandCheckAction extends IcingaLConfBaseAction {
    public function executeRead(AgaviRequestDataHolder $rd) {
        return $this->executeWrite($rd);
    }

    public function executeWrite(AgaviRequestDataHolder $rd) {
        $connectionId = $rd->getParameter("connectionId");
        $dn = $rd->getParameter("dn");
        $cmdLine = $this->getCommandLine($connectionId,$dn);
        if(!$cmdLine)
            return "Success";
        $tokens = json_decode($rd->getParameter("tokens","{}"),true);

        $model = $this->getContext()->getModel("LConfCheckTest","LConf");
        
        $this->setAttribute("result", $model->testCheck($cmdLine,$tokens));

        return "Success";
    }

    private function getCommandLine($connectionId,$checkDn) {
        $ctx = $this->getContext();
        $ctx->getModel("LDAPClient","LConf");

        $client = LConf_LDAPClientModel::__fromStore($connectionId,$ctx->getStorage());
        if(!$client) {
            $this->setAttribute("errors",array("Connection has gone away"));
            return;
        }
            
        $node = $client->getNodeProperties($checkDn);
        foreach($node as $attribute=>$value) {
            if(preg_match("/.*?commandline/i",$attribute))
                return $value[0];
        }
        $this->setAttribute("errors",array("Couldn't find command at ".$checkDn));
        return;
    }

    public function handleError(AgaviRequestDataHolder $rd) {
        $errors = $this->getContainer()->getValidationManager()->getErrorMessages();
        $this->setAttribute("errors",$errors);
        return "Success";
    }
    
    public function getCredentials() {
        return array("lconf.user","lconf.testcheck");
    }
    public function isSecure() {
        return true;
    }
}
