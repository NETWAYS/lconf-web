<?php

class LConf_Interface_SimpleSearchGridSuccessView extends IcingaLConfBaseView
{
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);

		$this->setAttribute('_title', 'Interface.SimpleSearchGrid');
	}
}

?>