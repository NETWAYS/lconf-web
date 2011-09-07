<?php

class LConf_PropertyEditor_PropertyWizardDefaultView extends IcingaLConfBaseView
{
	public function executeJson(AgaviRequestDataHolder $rd) 
	{
		$ini = AgaviConfig::get("modules.lconf.ldap_object_presets_ini");
		$this->setAttribute("lconfPresets", json_encode(parse_ini_file($ini,true)));
	}
	
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);
		$ini = AgaviConfig::get("modules.lconf.ldap_object_presets_ini");
		$this->setAttribute("lconfPresets", json_encode(parse_ini_file($ini,true)));
		$this->setAttribute('_title', 'PropertyEditor.PropertyWizard');
	}
}

?>