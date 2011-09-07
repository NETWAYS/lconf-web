Ext.ns("lconf");

/*****			 Action Menu             ****/
lconf.panelId = "<?php echo $t["parentid"] ?>";

// function stub for filters
lconf.getActiveFilters = function(connId) {return [];}

// Initial setup-functions for the action panel
lconf.initActionPanelProc = function(cmpRoute) {
	var cmpPanel = this;
	// if connectionManager is already set up, update and stop
	if	(cmpPanel.panelManager) {
		cmpPanel.panelManager.update();
		return true;
	}

	// if its the initial setup, create a new updater which loads the LConf_connManager class	
	var updater = cmpPanel.getUpdater();
	var eventId = Ext.id(null,'CmpReady');
	updater.setDefaultUrl({
		url: cmpRoute,
		scripts: true,
		params: {
			filter: 'own;global',
			eventId: eventId,
			parentid: cmpPanel.id
		}
	});
	updater.refresh();

	//listener that will be fired when the loaded component is ready
	eventDispatcher.addCustomListener(eventId,function(cmp,cmpManager) {
									this.add(cmp);
									this.panelManager = cmpManager;
									this.doLayout();
								},cmpPanel);

	return true;
	
};

	
// Create Accordeon panel entries
lconf.panelComponent;
if(lconf.panelComponent = Ext.getCmp(lconf.panelId)) {
	// Connection list
	lconf.panelComponent.add(
		new Ext.Panel({
			title: _('Connections'),
			id: 'lconf.pl_connections',
			autoScroll:true,
			listeners: {
				render: function(r) {lconf.initActionPanelProc.call(r,'<?php echo $ro->gen('modules.lconf.actionbar.connmanager'); ?>')}
			}
		})
	);
	lconf.panelComponent.add(
		new Ext.Panel({
			title: _('Filters'),
			id: 'lconf.pl_filters',
			autoScroll:true,
			listeners: {
				render: function(r) {lconf.initActionPanelProc.call(r,'<?php echo $ro->gen('modules.lconf.actionbar.filtermanager'); ?>')}
			}
		})
	);
	lconf.panelComponent.doLayout();
}
var cmpPanel = null;




