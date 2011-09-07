<?php

class LConf_Interface_DITSuccessView extends IcingaLConfBaseView
{
	public function executeSimple(AgaviRequestDataHolder $rd) {

		$this->setupHtml($rd);
		
		$this->setAttribute("parentId",$rd->getParameter("parentid"));
	}
	
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);

		$this->setAttribute('_title', 'Interface.DIT');
	}
}

?>