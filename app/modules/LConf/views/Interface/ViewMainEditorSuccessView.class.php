<?php

class LConf_Interface_ViewMainEditorSuccessView extends IcingaLConfBaseView
{
	public function executeHtml(AgaviRequestDataHolder $rd)
	{
		$this->setupHtml($rd);
		$container = $this->getContainer();
		$actionBarParameters = new AgaviRequestDataHolder();
		$actionBarParameters->setParameter("parentid","east-frame");
		$actionBarContainer = $container->createExecutionContainer("LConf","Interface.ActionBar",$actionBarParameters,"simple");
		
		$DITParameters = new AgaviRequestDataHolder();
		$DITParameters->setParameter("parentid","west-frame-lconf");
		$DITContainer = $container->createExecutionContainer("LConf","Interface.DIT",$DITParameters,"simple");

		$PropertyEditorParameters = new AgaviRequestDataHolder();
		$PropertyEditorParameters->setParameter("parentid","center-frame");
		$PropertyEditorContainer= $container->createExecutionContainer("LConf","Interface.PropertyEditor",$PropertyEditorParameters,"simple");

		$SimpleSearchGrid = new AgaviRequestDataHolder();
		$SimpleSearchGrid= $container->createExecutionContainer("LConf","Interface.SimpleSearchGrid",null,"simple");

		$this->setAttribute("js_actionBarInit",$actionBarContainer->execute()->getContent());
		$this->setAttribute("js_DITinit",$DITContainer->execute()->getContent());
		$this->setAttribute("js_PropertyEditorInit",$PropertyEditorContainer->execute()->getContent());
		$this->setAttribute("js_SimpleSearchGridInit",$SimpleSearchGrid->execute()->getContent());
		
		if($rd->getParameter("connection"))
			$this->setAttribute("start_connection",$rd->getParameter("connection"));
		if($rd->getParameter("dn"))
			$this->setAttribute("start_dn",$rd->getParameter("dn"));
			
		$this->setAttribute('_title', 'Interface.ViewMainEditor');
	}
	
}

?>