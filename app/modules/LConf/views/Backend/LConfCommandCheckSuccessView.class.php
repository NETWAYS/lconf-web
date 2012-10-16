<?php
/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of LConf_LConfCommandCheckSuccessView
 *
 * @author jmosshammer
 */
class LConf_Backend_LConfCommandCheckSuccessView extends IcingaLConfBaseView {

    public function executeJson(AgaviRequestDataHolder $rd) {
        $errors = $this->getAttribute("errors",array());

        if(!empty($errors)) {
            return json_encode(array(
                "success" => false,
                "output" => json_encode($errors)
            ));
        }
        return json_encode($this->getAttribute("result",
            array("success"=>false,"output" => "Unknown result")
        ));
        
    }
}
