<?php
/**
 * $Id: PHPUnitTestRunner.php 1093 2011-05-17 14:54:10Z mrook $
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

// phpunit 3.5 ships with autoloader
// @todo - find out sane model for Phing and PHPUnit autoloaders/hooks co-existense
if (version_compare(PHPUnit_Runner_Version::id(), '3.5.0') >=0) {
    require_once 'PHPUnit/Autoload.php';
}
require_once 'PHPUnit/Util/ErrorHandler.php';
require_once 'PHPUnit/Util/Filter.php';
require_once 'PHPUnit/Runner/BaseTestRunner.php';
require_once 'PHPUnit/Framework/TestListener.php';
require_once 'phing/tasks/ext/coverage/CoverageMerger.php';
require_once 'phing/system/util/Timer.php';

/**
 * Simple Testrunner for PHPUnit that runs all tests of a testsuite.
 *
 * @author Michiel Rook <michiel.rook@gmail.com>
 * @version $Id: PHPUnitTestRunner.php 1093 2011-05-17 14:54:10Z mrook $
 * @package phing.tasks.ext.phpunit
 * @since 2.1.0
 */
class PHPUnitTestRunner extends PHPUnit_Runner_BaseTestRunner implements PHPUnit_Framework_TestListener
{
    const SUCCESS = 0;
    const FAILURES = 1;
    const ERRORS = 2;
    const INCOMPLETES = 3;
    const SKIPPED = 4;

    private $retCode = 0;
    private $lastErrorMessage = '';
    private $lastFailureMessage = '';
    private $lastIncompleteMessage = '';
    private $lastSkippedMessage = '';
    private $formatters = array();
    
    private $codecoverage = false;
    
    private $project = NULL;

    private $groups = array();
    private $excludeGroups = array();
    
    private $useCustomErrorHandler = true;

    public function __construct(Project $project, $groups = array(), $excludeGroups = array())
    {
        $this->project = $project;
        $this->groups = $groups;
        $this->excludeGroups = $excludeGroups;
        $this->retCode = self::SUCCESS;
    }
    
    public function setCodecoverage($codecoverage)
    {
        $this->codecoverage = $codecoverage;
    }

    public function setUseCustomErrorHandler($useCustomErrorHandler)
    {
        $this->useCustomErrorHandler = $useCustomErrorHandler;
    }

    public function addFormatter($formatter)
    {
        $this->formatters[] = $formatter;
    }
    
    public static function handleError($level, $message, $file, $line)
    {
        $isFiltered = false;
        if (version_compare(PHPUnit_Runner_Version::id(), '3.5.0') >=0) {
            $isFiltered = PHP_CodeCoverage::getInstance()->filter()->isFiltered(
                $file, array(), true
            );
        } else {
            $isFiltered = PHPUnit_Util_Filter::isFiltered($file, true, true);
        }
        if (!$isFiltered) {
            return PHPUnit_Util_ErrorHandler::handleError($level, $message, $file, $line);
        }
    }
    
    /**
     * Run a test
     */
    public function run(PHPUnit_Framework_TestSuite $suite)
    {
        $res = new PHPUnit_Framework_TestResult();

        if ($this->codecoverage)
        {
            $res->collectCodeCoverageInformation(TRUE);
        }
        
        $res->addListener($this);

        foreach ($this->formatters as $formatter)
        {
            $res->addListener($formatter);
        }
        
        /* Set PHPUnit error handler */
        if ($this->useCustomErrorHandler)
        {
            $oldErrorHandler = set_error_handler(array('PHPUnitTestRunner', 'handleError'), E_ALL | E_STRICT);
        }
        
        $suite->run($res, false, $this->groups, $this->excludeGroups);
        
        foreach ($this->formatters as $formatter)
        {
            $formatter->processResult($res);
        }
        
        /* Restore Phing error handler */
        if ($this->useCustomErrorHandler)
        {
            restore_error_handler();
        }
        
        if ($this->codecoverage)
        {
            if (version_compare(PHPUnit_Runner_Version::id(), '3.5.0') >=0) {
                $coverage = $res->getCodeCoverage();
            
                $summary = $coverage->getSummary();
            } else {
                $coverageInformation = $res->getCodeCoverageInformation();
                PHPUnit_Util_CodeCoverage::clearSummary();
                $summary = PHPUnit_Util_CodeCoverage::getSummary($coverageInformation);
            }

            CoverageMerger::merge($this->project, $summary);
        }
        
        if ($res->errorCount() != 0)
        {
            $this->retCode = self::ERRORS;
        }
        else if ($res->failureCount() != 0)
        {
            $this->retCode = self::FAILURES;
        }
        else if ($res->notImplementedCount() != 0)
        {
            $this->retCode = self::INCOMPLETES;
        }
        else if ($res->skippedCount() != 0)
        {
            $this->retCode = self::SKIPPED;
        }
    }

    public function getRetCode()
    {
        return $this->retCode;
    }
    
    public function getLastErrorMessage()
    {
        return $this->lastErrorMessage;
    }
    
    public function getLastFailureMessage()
    {
        return $this->lastFailureMessage;
    }
    
    public function getLastIncompleteMessage()
    {
        return $this->lastIncompleteMessage;
    }
    
    public function getLastSkippedMessage()
    {
        return $this->lastSkippedMessage;
    }
    
    protected function composeMessage($message, PHPUnit_Framework_Test $test, Exception $e)
    {
        return "Test $message (" . $test->getName() . " in class " . get_class($test) . "): " . $e->getMessage();
    }

    /**
     * An error occurred.
     *
     * @param  PHPUnit_Framework_Test $test
     * @param  Exception              $e
     * @param  float                  $time
     */
    public function addError(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
        $this->lastErrorMessage = $this->composeMessage("ERROR", $test, $e);
    }

    /**
     * A failure occurred.
     *
     * @param  PHPUnit_Framework_Test                 $test
     * @param  PHPUnit_Framework_AssertionFailedError $e
     * @param  float                                  $time
     */
    public function addFailure(PHPUnit_Framework_Test $test, PHPUnit_Framework_AssertionFailedError $e, $time)
    {
        $this->lastFailureMessage = $this->composeMessage("FAILURE", $test, $e);
    }

    /**
     * Incomplete test.
     *
     * @param  PHPUnit_Framework_Test $test
     * @param  Exception              $e
     * @param  float                  $time
     */
    public function addIncompleteTest(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
        $this->lastIncompleteMessage = $this->composeMessage("INCOMPLETE", $test, $e);
    }

    /**
     * Skipped test.
     *
     * @param  PHPUnit_Framework_Test $test
     * @param  Exception              $e
     * @param  float                  $time
     * @since  Method available since Release 3.0.0
     */
    public function addSkippedTest(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
        $this->lastSkippedMessage = $this->composeMessage("SKIPPED", $test, $e);
    }

    /**
     * A test started.
     *
     * @param  string  $testName
     */
    public function testStarted($testName)
    {
    }

    /**
     * A test ended.
     *
     * @param  string  $testName
     */
    public function testEnded($testName)
    {
    }

    /**
     * A test failed.
     *
     * @param  integer                                 $status
     * @param  PHPUnit_Framework_Test                 $test
     * @param  PHPUnit_Framework_AssertionFailedError $e
     */
    public function testFailed($status, PHPUnit_Framework_Test $test, PHPUnit_Framework_AssertionFailedError $e)
    {
    }

    /**
     * Override to define how to handle a failed loading of
     * a test suite.
     *
     * @param  string  $message
     */
    protected function runFailed($message)
    {
        throw new BuildException($message);
    }

    /**
     * A test suite started.
     *
     * @param  PHPUnit_Framework_TestSuite $suite
     * @since  Method available since Release 2.2.0
     */
    public function startTestSuite(PHPUnit_Framework_TestSuite $suite)
    {
    }

    /**
     * A test suite ended.
     *
     * @param  PHPUnit_Framework_TestSuite $suite
     * @since  Method available since Release 2.2.0
     */
    public function endTestSuite(PHPUnit_Framework_TestSuite $suite)
    {
    }

    /**
     * A test started.
     *
     * @param  PHPUnit_Framework_Test $test
     */
    public function startTest(PHPUnit_Framework_Test $test)
    {
    }

    /**
     * A test ended.
     *
     * @param  PHPUnit_Framework_Test $test
     * @param  float                  $time
     */
    public function endTest(PHPUnit_Framework_Test $test, $time)
    {
    }
}

