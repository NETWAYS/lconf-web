<?php

class LConf_Interface_jsLDAPEditorsSuccessView extends IcingaLConfBaseView
{
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);

		$this->setAttribute('_title', 'Interface.jsLDAPEditors');
	}
}

?>