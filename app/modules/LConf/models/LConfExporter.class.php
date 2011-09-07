<?php
/**
 * Exporter task for creating lconf configs from the webinterface
 * 
 * @author jmosshammer
 *
 */

class LConf_LConfExporter extends IcingaLConfBaseModel
{
	protected $consoleInterface = null;
	protected $instance = null;
	protected $status = array(
		"NONE",
		"CREATE CONFIG",
		"FETCH CONSOLE",
		"CHECK PERMS",
		"VERIFY CONFIG",
		"BACKUP",
		"SETUP",
		 "RESTART",
		 
	);
	protected $statusCounter = 0;
	public function getStatus() {
		return $this->status[$statusCounter];
	}

	public function getConsole($instance) {
		if(!$this->consoleInterface)
			$this->consoleInterface = AgaviContext::getInstance()->getModel('Console.ConsoleInterface',"Api",array("host"=>$instance));
		return $this->consoleInterface;
	}
	
	public function exportConfig(LConf_LDAPConnectionModel $config) {
		try {
			$this->statusCounter++;
			$this->createConfig();
			
			$this->statusCounter++;
			$this->checkConsoleAccess();
			
			$this->statusCounter++;
			$this->checkPermissions();
			
			$this->statusCounter++;
			$this->verifyConfig();	
			
			$this->statusCounter++;
			$this->createBackup();
			
			$this->statusCounter++;
			$this->setupConfig();
			
			$this->statusCounter++;
			$this->checkIcingaStatus();
		} catch(Exception $e) {
			$this->rollback();
			throw($e);
		}
	}
	
	protected function createConfig() {
		$createCommand =  AgaviContext::getInstance()->getModel(
			'Console.ConsoleCommand',
			"Api",
			array(
				"command" => "ls",
				"connection" => $console, 
				"arguments" => array(
					'' => '', 
					'1' => '/usr/local/icinga-web/' 
				)
			)
		);
	} 
	
	protected function checkConsoleAccess() {}	
	protected function checkPermissions() {}
	protected function verifyConfig() {}
	protected function createBackup() {}
	protected function setupConfig() {}	
	protected function checkIcingaStatus() {}
	
	protected function rollback() {}
}