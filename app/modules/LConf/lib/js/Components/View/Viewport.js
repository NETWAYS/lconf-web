/*jshint browser:true, curly:false */
/*global Ext:true,LConf:true */
Ext.ns("LConf.View").Viewport = function(cfg) {
    "use strict";    
    cfg.eventDispatcher = new LConf.EventDispatcher();
    cfg.filterState = new LConf.Filter.FilterState(cfg);

    var mainContainer =  new Ext.Panel({
        layout:'border',
        id: 'view-container',
        defaults: {
            //split:true,
            padding:1
            //collapsible: true
        },
        border: false,
        items: [{
            region: 'west',
            id: 'west-frame-lconf',
            layout: 'fit',
            margins:'5 0 0 0',
            cls: false,
            split:true,
            width:400,
            minSize:200,
            maxSize:500,
            items: new LConf.View.DITPanel(cfg)
        }, {
            region:'center',
            collapsible:false,
            layout: 'fit',
            id:'center-frame',
            margins: '5 0 0 0',
            
            items: new LConf.View.PropertyManagerPanel(cfg)
        /*
              url: '<?php echo $ro->gen("modules.lconf.data.modifyproperty");?>',
              api: {
              read :'<?php echo $ro->gen("modules.lconf.data.propertyprovider");?>'
              }*/
            
        },{
            region: 'east',
            id: 'east-frame',
            layout: 'vbox',
            animate:true,
            collapsible:true,
            margins:'5 0 0 0',
            cls: false,
            width:210,
           
            items:[
                new LConf.View.ConnectionList(cfg),
                new LConf.View.FilterPanel(cfg)
            ]
        }]
    });
    
    if(cfg.connId) {
        cfg.eventDispatcher.addCustomListener("connectionsLoaded",function(store,conn) {
            conn.startConnect(store.indexOfId(cfg.connId));
            if(cfg.dn)
                cfg.eventDispatcher.addCustomListener("TreeReady",function(tree) {
                    tree.searchDN(cfg.dn);
                });
        },this,{
            single:true
        });
    }
    cfg.parentCmp.add(mainContainer);
    cfg.parentCmp.doLayout();
};
