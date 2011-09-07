<?php
/**
 * Parser for Schema-Files
 * Returns a xml format with the specified entities and stores it.
 * 
 * @author jmosshammer
 *
 */

// if set to true, unrecognized entities will stop the parser instead of being 
// ignored
define("STRICT_SCHEMA_PARSE",false);
// magic numbers for the entity regexp, match 1 is the type, match 2 is the data 
define("SCHEMA_E_TYPE",1);
define("SCHEMA_E_DATA",2);

class LConf_Schema_SCHEMAParserModel extends IcingaLConfBaseModel
{
	protected $Schema_URL = "";
	protected $Schema_Content = null;
	protected $status = "closed";
	protected $xml = null;
	
	public function setSchema_URL($url) {
		$this->Schema_URL = $url;
	}
	public function setSchema_Content($fileContent) {
		$this->Schema_Content = $fileContent;	
	}
	public function setStatus($status) {
		return $this->status;
	}
	public function setXML(DOMDocument $dom) {
		$this->xml = $dom;
	}
	
	public function getSchema_URL()	{
		return $this->Schema_URL;
	}
	public function getSchema_Content()	{
		return $this->Schema_FileContent;
	}
	public function getStatus()	{
		return $this->status;
	}
	public function getXML()	{
		return $this->xml;
	}
	

	
	public function parse() {
		if($this->getStatus != "File Read" || !$this->getSchema_FileContent())
			throw new AppKitException("No Schema specified!");
		
		$this->openFile();
		$this->prepareXML();
		$this->cleanUp();
		$this->writeToXML();
	}
	
	protected function openFile()	{
		$Schema_File = $this->getSchema_URL();
		$content;
		if(!$Schema_File)
			throw new AppKitException("No Schema-file specified!");
		if(!file_exists($Schema_File))
			throw new AppKitException("Schema-file doesn't exist!");	
		if(!$content = @file_get_contents($LDFI_File,"r")) 
			throw new AppKitException("Error reading Schema-file: ".error_get_last());
	
		$this->setSchema_FileContent($content);
		$this->setStatus("File Read");
	}
	
	
	protected function prepareXML() {
		$xmlDocument = new DOMDocument();
		// Create Meta Information
		$metaData = new DOMNode("Meta");
		// Creation date
		$creationDate = new DOMNode("Created on");
			$creationDate->appendChild(new DOMText(date("c")));	
			$metaData->appendChild($creationDate);
		/***
		 			--More Metadata--
		 **/
			
		$xmlDocument->appendChild($metaData);
		$this->setXML($xmlDocument);			
	}
	
	/**
	 * Function that removes comments, whitespaces and not needed linebreaks 
	 * from the Schema file 
	 * @return void
	 */
	protected function cleanUp() {
		// remove comments (just check if the line starts with #)
		$commentRemoveRegExp = '/^#.*?$/';
		$Schema_edited = preg_replace($commentRemoveRegExp,"",$this->getSchema_Content());
	
		// checks if a line begins with a whitespace and removes the linebreak
		// see http://tools.ietf.org/html/rfc2849, Notes on Schema Syntax (2)
		$linebreakRemoveRegExp = '/(\r\n|\n) ';
		$Schema_edited = preg_replace($linebreakRemoveRegExp," ",$this->getSchemaContent());
		
		// remove repeated whitespaces
		$whitespaceRemoveRegExp = '/ {2,}/';
		$Schema_edited = preg_replace($whitespaceRemoveRegExp," ",$this->getSchemaContent());
		
		$this->setSchema_Content($Schema_edited);
	}
	
	
	protected function writeToXML() {
		$entities = buildEntityBlocks($this->getSchema_Content());
		
	}
	
	/**
	 * Builds an array with the seperated entity information
	 * @param string $Schema
	 * @return array
	 */
	protected function buildEntityBlocks($Schema) {
		$entityBlocks = array("cn" =>"", "objectClass"=> "", "Classes"=>array(),"Attributes"=>array(), "Identifiers"=>array());
		$rawData = $this->getSchema_Content()->explode("\n");
		//Regexp that helps to determine the type of the entity
		$typeRegExp = "/^([A-Za-z*): *?(.*)$/";
		$entityData = null;
		foreach($rawData as $entity) {
			// get entityType
			preg_grep($typeRegExp,$entity,$entityData);
			// invalid line - shouldn't happen
			if(!isset($entityData[SCHEMA_E_TYPE]))  { 
				if(!STRICT_SCHEMA_PARSE) 
					continue; // ignore if not strict
			
				throw new AppKitException ("Error while parsing document!\n Couldn't recognize: ".$entity);
			}
			
			switch($entityType) {
				case 'cn':
					$entityBlocks["cn"] = $entityData[SCHEMA_E_DATA];
					break; 
				case 'objectClass': // in general, this is a schema
					$entityBlocks["objectClass"] = $entityData[SCHEMA_E_TYPE];
					break;
				case 'olcObjectIdentifier':
					$entityBlocks["Identifiers"] = $this->parseIdentifier($entityData[Schema_E_TYPE]);
					break;
				case 'olcAttributeTypes':
					$entityBlocks["Attributes"] =  $this->parseAttribute($entityData[Schema_E_TYPE]);
					break;
				case 'olcObjectClasses':
					$entityBlocks["Classes"] = $this->parseClass($entityData[Schema_E_TYPE]);
					break;
			}
		}
	}
	
	protected function parseIdentifier($entity) {
		
	}

	protected function parseAttribute($entity) {
		
	}
	
	protected function parseClass($entity) {
		
	}
	
	public function __destruct() {
		
	}
}

?>