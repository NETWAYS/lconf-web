/*jshint browser:true, curly:false */
/*global Ext:true, _:true, AppKit: true */
(function() {
    "use strict";
    
    Ext.ns("LConf.View").ConnectionList = Ext.extend(Ext.Panel, {
        connections: {},
        eventDispatcher: null,
        title: _('Connections'),
        layout: 'fit',
        dView: null,
        flex:2,
        width: 200,
        autoScroll:true,
        constructor : function(config) {
            config = config || {};
            Ext.apply(this,config);
            this.filter = ['global','own'];
            
            this.storeURL = config.urls.connectionlisting;
            this.id = Ext.id(null,'connManager');
            
            Ext.Panel.prototype.constructor.call(this,config);
            this.init();
        },
        
        
        
        getStore : function() {
            if(!this.dStore) {
                this.dStore = new Ext.data.JsonStore({
                    autoLoad:true,
                    listeners: {
                        // Check for errors
                        load: function() {
                            this.eventDispatcher.fireCustomEvent("connectionsLoaded",this.getStore(),this);
                        },
                        exception : function(prox,type,action,options,response) {
                            if(response.status === 200) {
                                return true;
                            }
                            response = Ext.decode(response.responseText);
                            if(response.error.length > 100)
                                response.error = _("A critical error occured, please check your logs");
                            Ext.Msg.alert(_("Error"), response.error);
                            return true;
                        },
                        save: function(store) {
                            store.load();
                        },
                        scope:this
                    },
                    autoDestroy:true,
                    fields: [
                        'connection_id','connection_name','connection_description','connection_binddn',
                        'connection_bindpass','connection_host','connection_default','connection_port','connection_basedn','connection_tls','connection_ldaps'
                    ],
                    idProperty:'connection_id',
                    root: 'connections',
                    url: this.urls.connectionlisting
                });
            }
            return this.dStore;
        },
        
        getTemplate : function() {
            if(!this.tpl) {
                this.tpl = new Ext.XTemplate(
                '<tpl for=".">',
                '<div class="ldap-connection" ext:qtip="',
                '<div=\'margin:10px;padding:5px,width:100%\'>',
                '<b>{connection_name}</b><br/>',
                '<span style=\'font-family:monaco,monospace\'>{connection_host}:{connection_port}</span>',
                '<div>BindDN: {connection_binddn}</div>',
                '<div>BaseDN: {connection_basedn}</div>',
                '<div>','" id="conn_{connection_id}">',
                '<div class="thumb icon-16 icinga-icon-world"></div>',
                '<div class="X-editable" style="font-size:12px">{connection_name}</div>',
                '        </div>',
                '</tpl>'
            );
            }
            return this.tpl;
        },
        
        
        getView : function(createNew) {
            if(!this.dView || createNew) {
                this.dView = new Ext.DataView({
                    id: 'view-'+this.id,
                    store: this.getStore(),
                    tpl: this.getTemplate(),
                    autoHeight:true,
                    overClass:'x-view-over',
                    multiSelect: false,
                    itemSelector:'div.ldap-connection',
                    emptyText: '',
                    cls: 'ldap-data-view'
                });
            }
            return this.dView;
        },
        
        update : function() {
            this.dStore.load();
        },
        
        init : function() {
            var view = this.getView();
            var store = this.getStore();
            view.addListener("click",this.handleContext,this);

            view.addListener(
            "dblclick",
            function (dView,index,node) {
                this.startConnect(index,node);
            },this);
            store.load();
            
            this.eventDispatcher.addCustomListener(
            "ConnectionClosed",
            function(id) {
                this.closeConnection(id,true);
            },this);
        },

        initComponent: function() {
            Ext.Panel.prototype.initComponent.apply(this,arguments);
            this.add(this.getView());
        },
        
        // handles creation and display of the context menu
        handleContext : function(dView,index,node,_e)    {
            Ext.QuickTips.getQuickTip().hide();
            _e.preventDefault();
            if(!this.ctxMenu)
                this.ctxMenu = {};
            if(!this.ctxMenu[index]) {
                this.ctxMenu[index] = new Ext.menu.Menu({
                    items:[{
                            text: 'Connect',
                            id: this.id+'-connect-'+index,
                            iconCls: 'icinga-icon-database-go',
                            handler : function() {this.startConnect(index,node);},
                            scope:this
                        },{
                            iconCls: 'icinga-icon-wrench-screwdriver',
                            text: 'Export config',
                            handler: function() {
                                this.checkBeforeExportPreflight(index, node)
                            },
                            scope: this
                        }]
                });
            }
            this.ctxMenu[index].showAt(_e.getXY());
        },
        
        
        isConnected: function(connName) {
            if(this.connections[connName])
                return true;
            else
                return false;
        },
        
        startConnect: function(index) {
            var record = this.dStore.getAt(index);
            var connName = record.get('connection_name');
            if(this.isConnected(connName)) {
                AppKit.notifyMessage(connName, _('Connection is already open!'));
                return false;
            }
            AppKit.notifyMessage(connName, 'Connecting...');
            Ext.Ajax.request({
                url: this.urls.connect,
                success: this.onConnectionSuccess,
                failure: this.onConnectionFailure,
                params: {connection_id : record.get('connection_id')},
                scope: this,
                // custom parameter
                record: record,
                connName: connName
            });
            return true;
        },
        
        showExportSuccessWindow: function(result) {
            
            var infoWnd = new Ext.Window({
                title: _('Export result'),
                width: Ext.getBody().getWidth()*0.8,
                height:  Ext.getBody().getHeight()*0.8,
                layout: 'fit',
                autoScroll: true,
                modal:true,
                items: new Ext.grid.GridPanel({
                    border: false,
                    store: new Ext.data.JsonStore({
                        root: 'config',
                        fields: ['count','type'],
                        data: result
                    }),
                    colModel: new Ext.grid.ColumnModel({
                        columns: [{
                                width:50,
                                dataIndex: 'type',
                                renderer: function(v) {
                                    var icon = "";
                                    switch(v) {
                                        case 'services':
                                        case 'Service(s)':
                                            icon = 'service';
                                            break;
                                        case 'hosts':
                                        case 'Host(s)':
                                            icon = 'host';
                                            break;
                                        case 'HostGroup(s)':
                                        case 'host groups':
                                            icon = 'hostgroup';
                                            break;
                                        case 'ServiceGroup(s)':
                                        case 'service groups':
                                            icon = 'servicegroup';
                                            break;
                                        case 'User(s)':
                                        case 'contacts':
                                            icon = 'user';
                                            break;
                                        case 'UserGroup(s)':
                                        case 'contact groups':
                                            icon = 'group';
                                            break;
                                        case 'CheckCommand(s)':
                                        case 'NotificationCommand(s)':
                                        case 'EventCommand(s)':
                                        case 'commands':
                                            icon = 'script';
                                            break;
                                        case 'TimePeriod(s)':
                                        case 'time periods':
                                            icon = 'clock-red';
                                            break;
                                        case 'Notification(s)':
                                            icon = 'notify';
                                            break;
                                        case 'NotificationComponent(s)':
                                        case 'CheckerComponent(s)':
                                            icon = 'bricks';
                                            break;
                                        case 'IcingaApplication(s)':
                                            icon = 'dot';
                                            break;
                                        case 'Zone(s)':
                                            icon = 'organisation';
                                            break;
                                        case 'FileLogger(s)':
                                            icon = 'report';
                                            break;
                                        case 'Endpoint(s)':
                                            icon = 'world';
                                            break;
                                    }
                                    if(icon)
                                        icon = "icinga-icon-"+icon;
                                    return '<div class="icon-16 '+icon+'"></div>';
                                }
                            },{
                                header: _('Type'),
                                dataIndex: 'type',
                                renderer: function(v) {
                                    
                                    return Ext.util.Format.capitalize(v);
                                },
                                width: 200
                            },{
                                header: _('Nr of objects'),
                                dataIndex: 'count',
                                width:100
                            }]
                    }),
                    sm: null
                })
            });
            
            infoWnd.show();
        },

        checkBeforeExportPreflight: function(index, node) {
            if(this.store.hasPendingChanges()) {
                Ext.Msg.confirm(_("Unsaved changes pending"),_("Save changes?"),function (btn) {
                    if(btn === 'yes') {
                        this.store.save();
                        this.store.on("save",function () {
                            this.exportPreflight(index, node);
                        },this,{
                            single:true
                        });
                    } else {
                        this.store.load();
                        this.store.on("load",function () {
                            this.exportPreflight(index, node);
                        },this,{
                            single:true
                        });
                    }
                },this);
            } else {
                this.exportPreflight(index, node);
            }
        },
        
        exportPreflight: function(index) {
            var record = this.dStore.getAt(index);
            var prog = Ext.Msg.wait(_("Exporting config"),_("Your icinga-web config is being exported"));
            Ext.Ajax.request({
                url: this.urls.exportConfig,
                params: {preflight:true,connection_id : record.get('connection_id')},
                success: function(r) {
                    try {
                        var result = Ext.decode(r.responseText);
                        if(!result)
                            result = {};
                        prog.hide();
                        this.showExportTargets(result,record);
                    } catch(e) {
                        prog.hide();
                        Ext.Msg.alert(_("Warning"),_("Export preflight succeeded, but there was an error parsing the server's result <br/>"+e));
                    }
                    
                },
                exception: function() {
                    prog.hide();
                },
                failure: function(r) {
                    try {
                        var result = Ext.decode(r.responseText);
                        
                        if(!result)
                            result = {};
                        result.error = result.error || _("Unknown error");
                        
                        result.error = "<div style='border:1px solid black;overflow:scroll;height:200px;width:400px;background-color:white;font-family:monospace;font-size:10;'><pre>"+Ext.util.Format.ellipsis(result.error,200)+"</pre></div>";
                        prog.hide();
                        Ext.Msg.alert(_("Could not export config: "),result.error);
                    } catch(e) {
                        prog.hide();
                        Ext.Msg.alert(_("Could not export config: "),_("Unknown error"));
                    }
                },
                scope: this
            });
        },
        
        showExportTargets: function(results,record) {
            var items = [{
                    html: _('Choose targets to export to<br/>'),
                    xtype: 'label',
                    style : 'font-weight: bold;margin-bottom:15px'
                },{
                    xtype: 'spacer',
                    height: 10
                },{
                    fieldLabel: _('Master instance'),
                    checked: true,
                    disabled: true
                }];
            
            for(var i=0;i<results.config.Available.length;i++) {
                var itemName = results.config.Available[i];
                items.push({
                    fieldLabel: Ext.util.Format.htmlEncode(itemName),
                    checked: results.config.Updated.indexOf(itemName) > -1,
                    name: itemName
                });
            }
            var formId = Ext.id();
            var wnd = new Ext.Window({
                title : _('Exporter'),
                layout: 'fit',
                width: 300,
                height: 200,
                autoScroll:true,
                
                items: {
                    padding: 5,
                    layout: 'form',
                    xtype: 'form',
                    id: formId,
                    defaults: {
                        xtype: 'checkbox',
                        width: 200
                    },
                    items: items
                },
                buttons: [{
                        text: _('Deploy selected configs'),
                        iconCls: 'icinga-icon-wrench',
                        handler: function(e) {
                            var selected = Ext.getCmp(formId);
                            var items = (selected.getForm().getValues());
                            var toExport = [];
                            for(var i in items) {
                                toExport.push(i);
                            }
                            this.exportConfiguration(record,toExport);
                            e.ownerCt.ownerCt.close();
                        },
                        scope: this
                        
                    }, {
                        text: _('Cancel'),
                        iconCls: 'icinga-icon-cancel',
                        handler: function(e) {
                            e.ownerCt.ownerCt.close();
                        }
                    }]
            });
            wnd.show();
        },
        
        exportConfiguration: function(record, toExport) {
            toExport = Ext.encode(toExport);
            
            Ext.Msg.confirm(_("Export config"),_("Export configuration in this tree?"),function(btn){
                if(btn !== 'yes')
                    return false;
                var prog = Ext.Msg.wait(
                _("Exporting config"),
                _("Your icinga-web config is being exported")
            );
                Ext.Ajax.request({
                    url: this.urls.exportConfig,
                    params: {
                        satellites: toExport,
                        connection_id : record.get('connection_id')
                    },
                    success: function(r) {
                        try {
                            var result = Ext.decode(r.responseText);
                            if(!result)
                                result = {};
                            prog.hide();
                            this.showExportSuccessWindow(result);
                        } catch(e) {
                            prog.hide();
                            Ext.Msg.alert(
                            _("Warning"),
                            _("Exporting succeeded, but there was an error parsing the server's result <br/>"+e)
                        );
                        }
                        
                    },
                    exception: function() {
                        prog.hide();
                    },
                    failure: function(r) {
                        try {
                            var result = Ext.decode(r.responseText);
                            
                            if(!result)
                                result = {};
                            result.error = result.error || _("Unknown error");
                            
                            result.error = "<div style='border:1px solid black;overflow:scroll;height:200px;width:400px;background-color:white;font-family:monospace;font-size:10;'><pre>"+Ext.util.Format.ellipsis(result.error,200)+"</pre></div>";
                            prog.hide();
                            Ext.Msg.alert(
                            _("Could not export config: "),
                            result.error
                        );
                        } catch(e) {
                            prog.hide();
                            Ext.Msg.alert(
                            _("Could not export config: "),
                            _("Unknown error")
                        );
                        }
                    },
                    scope: this
                });
                return true;
            },this);
        },
        
        onConnectionSuccess: function(response,params) {
            var responseJSON = Ext.decode(response.responseText);
            if(!responseJSON.ConnectionID) {
                AppKit.notifyMessage(params.connName, 'No connectionID returned!');
                return false;
            }
            
            // Tell the dispatcher to spread that the connection is open
            this.eventDispatcher.fireCustomEvent("ConnectionStarted",{
                id:responseJSON.ConnectionID,
                rootNode: responseJSON.RootNode,
                connectionName:params.connName
            });
            // save connectionId to avoid duplicates
            this.connections[params.connName] = responseJSON.ConnectionID;
            return true;
        },
        
        onConnectionFailure: function(response, params) {
            AppKit.notifyMessage(params.connName,
            'Couldn\'t connect!<br/>'+
                response.responseText
        );
        },
        getConnectionNameById: function(id) {
            for(var index in this.connections) {
                if(this.connections[index] === id) {
                    return index;
                }
            }
            return null;
        },
        closeConnection: function(connName,isId) {
            if(isId)
                connName = this.getConnectionNameById(connName);
            
            AppKit.notifyMessage('Closing connection',connName);
            this.connections[connName] = null;
        }
    });
    
})();
