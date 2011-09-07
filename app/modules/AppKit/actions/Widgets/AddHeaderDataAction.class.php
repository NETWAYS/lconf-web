<?php

class AppKit_Widgets_AddHeaderDataAction extends AppKitBaseAction {
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
    public function getDefaultViewName() {
        return 'Success';
    }

    public function execute(AgaviRequestDataHolder $rd) {

        $header = $this->getContext()->getModel('HeaderData', 'AppKit');

        // Adding javascript squishloader
        $this->setAttribute('js_files_includes', array(
                                $this->getContext()->getRouting()->gen('modules.appkit.squishloader'),
                                $this->getContext()->getRouting()->gen('modules.appkit.ext.applicationState', array('cmd' => 'init'))
                            ));

        return $this->getDefaultViewName();
    }
}

?>