<?php
/*
 *  $Id: DocBloxTask.php 1155 2011-06-16 14:59:29Z mrook $
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * This software consists of voluntary contributions made by many individuals
 * and is licensed under the LGPL. For more information please see
 * <http://phing.info>.
 */

require_once 'phing/Task.php';
require_once 'phing/system/io/FileOutputStream.php';

/**
 * DocBlox Task (http://www.docblox-project.org)
 *
 * @author    Michiel Rook <mrook@php.net>
 * @version   $Revision: 1155 $
 * @since     2.4.6
 * @package   phing.tasks.ext.docblox
 */
class DocBloxTask extends Task
{
    /**
     * List of filesets
     * @var FileSet[]
     */
    private $filesets = array();
    
    /**
     * Destination/target directory
     * @var string
     */
    private $destDir = "";
    
    /**
     * Title of the project
     * @var string
     */
    private $title = "";
    
    /**
     * Force DocBlox to be quiet
     * @var boolean
     */
    private $quiet = true;
    
    /**
     * Nested creator, adds a set of files (nested fileset attribute).
     * 
     * @return FileSet
     */
    public function createFileSet()
    {
        $num = array_push($this->filesets, new FileSet());
        return $this->filesets[$num-1];
    }
    
    /**
     * Sets destination/target directory
     * @param string $destDir
     */
    public function setDestDir($destDir)
    {
        $this->destDir = (string) $destDir;
    }

    /**
     * Convenience setter (@see setDestDir)
     * @param string $output
     */
    public function setOutput($output)
    {
        $this->destDir = (string) $output;
    }
    
    /**
     * Sets the title of the project
     * @param strings $title
     */
    public function setTitle($title)
    {
        $this->title = (string) $title;
    }
    
    /**
     * Forces DocBlox to be quiet
     * @param boolean $quiet
     */
    public function setQuiet($quiet)
    {
        $this->quiet = (boolean) $quiet;
    }
    
    /**
     * Finds and initializes the DocBlox installation
     */
    private function initializeDocBlox()
    {
        $docbloxPath = null;
        
        foreach (explode(PATH_SEPARATOR, get_include_path()) as $path) {
            $testpath = $path . DIRECTORY_SEPARATOR . 'DocBlox' . DIRECTORY_SEPARATOR . 'src';
            if (file_exists($testpath)) {
                $docbloxPath = $testpath;
                break;
            }
        }
        if (empty($docbloxPath)) {
            throw new BuildException("Please make sure DocBlox is installed and on the include_path.", $this->getLocation());
        }
        
        require_once 'Zend/Loader/Autoloader.php';
        
        set_include_path($docbloxPath . PATH_SEPARATOR . get_include_path());
        
        $autoloader = Zend_Loader_Autoloader::getInstance();
        $autoloader->registerNamespace('DocBlox_');
    }
    
    /**
     * Build a list of files (from the fileset elements) and call the DocBlox parser
     * @return string
     */
    private function parseFiles()
    {
        $parser = new DocBlox_Parser();
        $parser->setTitle($this->title);
        
        if ($this->quiet) {
            $parser->setLogLevel(Zend_Log::CRIT);
        }
        
        $files = array();
        
        // filesets
        foreach ($this->filesets as $fs) {
            $ds    = $fs->getDirectoryScanner($this->project);
            $dir   = $fs->getDir($this->project);
            $srcFiles = $ds->getIncludedFiles();
            
            foreach ($srcFiles as $file) {
                $files[] = $dir . FileSystem::getFileSystem()->getSeparator() . $file;
            }
        }
        
        $this->log("Will parse " . count($files) . " file(s)", Project::MSG_VERBOSE);
        
        return $parser->parseFiles($files);
    }

    /**
     * Task entry point
     * @see Task::main()
     */
    public function main()
    {
        if (empty($this->destDir)) {
            throw new BuildException("You must supply the 'destdir' attribute", $this->getLocation());
        }
        
        if (empty($this->filesets)) {
            throw new BuildException("You have not specified any files to include (<fileset>)", $this->getLocation());
        }
        
        $this->initializeDocBlox();
        
        $xml = $this->parseFiles();
        
        $transformer = new DocBlox_Transformer();
        
        $transformer->setSource($xml);
        $transformer->setTarget($this->destDir);
        
        $transformer->execute();
    }
}