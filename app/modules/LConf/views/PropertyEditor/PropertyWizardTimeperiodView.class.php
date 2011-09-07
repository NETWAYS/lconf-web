<?php

class LConf_PropertyEditor_PropertyWizardTimeperiodView extends IcingaLConfBaseView
{
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);

		$this->setAttribute('_title', 'PropertyEditor.PropertyWizard');
	}
}

?>