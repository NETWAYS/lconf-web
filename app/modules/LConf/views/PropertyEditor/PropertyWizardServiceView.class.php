<?php

class LConf_PropertyEditor_PropertyWizardServiceView extends IcingaLConfBaseView
{
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);

		$this->setAttribute('_title', 'PropertyEditor.PropertyWizard');
	}
}

?>