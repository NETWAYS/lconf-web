<?php

class LConf_PropertyEditor_PropertyWizardContactgroupView extends IcingaLConfBaseView
{
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);

		$this->setAttribute('_title', 'PropertyEditor.PropertyWizard');
	}
}

?>