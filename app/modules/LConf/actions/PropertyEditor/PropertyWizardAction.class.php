<?php

class LConf_PropertyEditor_PropertyWizardAction extends IcingaLConfBaseAction
{
	/**
	 * Returns the default view if the action does not serve the request
	 * method used.
	 *
	 * @return     mixed <ul>
	 *                     <li>A string containing the view name associated
	 *                     with this action; or</li>
	 *                     <li>An array with two indices: the parent module
	 *                     of the view to be executed and the view to be
	 *                     executed.</li>
	 *                   </ul>
	 */
	
	public function executeWrite(AgaviRequestDataHolder $rd) {		
		$target = $rd->getParameter("view","Default");
		return $this->getDefaultViewName();
	}
	
	public function executeRead(AgaviRequestDataHolder $rd) {
		$target = $rd->getParameter("view","Default");
		return $this->getDefaultViewName();		
	}
	
	public function getDefaultViewName()
	{
		return 'Default';
	}
}

?>