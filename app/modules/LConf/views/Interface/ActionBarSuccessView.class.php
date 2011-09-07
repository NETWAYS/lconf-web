<?php

class LConf_Interface_ActionBarSuccessView extends IcingaLConfBaseView
{
	public function executeSimple(AgaviRequestDataHolder $rd)
	{

		$this->setupHtml($rd);
		$this->setAttribute("parentid",$rd->getParameter("parentid"));
		$this->setAttribute('_title', 'Interface.mainMenuBar');

	}
}

?>