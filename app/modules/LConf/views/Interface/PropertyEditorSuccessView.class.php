<?php

class LConf_Interface_PropertyEditorSuccessView extends IcingaLConfBaseView
{
	public function executeSimple(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);
		$this->setAttribute("parentId",$rd->getParameter("parentid"));
	}
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);
		$this->setAttribute("parentId",$rd->getParameter("parentid"));
	}
}

?>