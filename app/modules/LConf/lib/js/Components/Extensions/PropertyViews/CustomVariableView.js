/*jshint browser:true, curly:false */
/*global Ext:true, LConf: true */
(function() {
    "use strict";

    var getCVGrid = function(bstore,type) {
        var ns = Ext.ns("LConf").Configuration.prefix;
        var grid = new Ext.grid.EditorGridPanel({
            bindId: 'cvpanel_'+type,
            bindType: type,
            title: Ext.util.Format.capitalize(_(type))+" customvariables",
            height: 350,
            flex:1,
            tbar: [{
                iconCls: 'icinga-icon-add',
                text: _('Add new custom variable'),
                handler: function(cmp) {
                    var grid = cmp.ownerCt.ownerCt;
                    var store = grid.getStore();
                    store.add(new store.recordType());
                }
            },{
                iconCls: 'icinga-icon-cancel',
                text: _('Remove selected variable'),
                handler: function(cmp) {
                    var grid = cmp.ownerCt.ownerCt;
                    var selModel = grid.getSelectionModel();
                    var store = grid.getStore();
                    store.remove(selModel.getSelections());
                }
            }],
            colModel: new Ext.grid.ColumnModel({
                columns:[{
                    header:_('Name'),
                    width:.5,
                    editable: true,
                    editor: new Ext.form.TextField(),
                    dataIndex: 'cv_name'
                },{
                    header:_('Value'),
                    width:.5,
                    editable: true,
                    editor: new Ext.form.TextField(),
                    dataIndex: 'cv_value'
                }]
            }),
            sm: new Ext.grid.RowSelectionModel({
                
            }),
            viewConfig:{
                forceFit:true
            },
            store: new Ext.data.JsonStore({
                data: {},
                idProperty:'id',
                fields: ['id','cv_name','cv_value'],
                listeners: {
                    update: function(store, record, operation)  {
                        var idx = bstore.find('value', "_" + record.get('cv_name') + " ");

                        if (idx === -1) {
                            bstore.setProperty(ns + type + "customvar", "_" + record.get('cv_name') + " " + record.get('cv_value'), true);
                        } else {
                            bstore.remove(bstore.getAt(idx));
                            bstore.setProperty(ns + type + "customvar", "_" + record.get('cv_name') + " " + record.get('cv_value'), true);
                        }
                    },
                    remove: function(store, record, index) {
                        var idx = bstore.find('value', "_" + record.get('cv_name') + " ");

                        if (idx > -1) {
                            bstore.remove(bstore.getAt(idx));
                        }
                    }
                }
            })
        });
        return grid;
    };
    
    var LConfCVToCVGrid = function(values,grid) {
        var regexp = new RegExp("\w*"+grid.bindType+"customvar","i");
        var store = grid.getStore();
        store.removeAll(true);
        var data = [];
        for(var i in values) {
            if(!regexp.test(i))
                continue;
            var value = values[i];
            if(typeof value === "undefined")
                continue;
            if(!Ext.isArray(value))
                value = [value];
            for(var x=0;x<value.length;x++) {
                
                var cv = value[x].split(" ");
                if(cv.length < 2)
                    continue;
                data.push(new store.recordType({
                    cv_name: cv.shift().trim().substr(1),
                    cv_value: cv.join(" ").trim()
                }));
            }
        }
        
        store.add(data);
    };
    
    var CVGridToLConfCV = function() {
    };
    var getHandler = function(type) {
        return function(store) {
            var binder = new LConf.Extensions.Helper.LDAPStoreDataBinder();
            binder.hookStore(store);
            var items = [];
            if(!Ext.isArray(type)) {
                type = [type];
            }
            for(var i=0;i<type.length;i++) {
                items.push(getCVGrid(store,type[i]));
            }

            var p = new Ext.Panel({
                autoScroll: true,
                priority: 0,

                title: 'Customvariables',
                iconCls: 'icinga-icon-application',
                defaults: {
                    flex: 1,
                    border: false
                },             
                items: items
            });
            
            var getMatchfn = function(matchType) {
                return function(cmp) {
                    return (cmp.bindId === "cvpanel_"+matchType);
                }
            };
            
            for(var i=0;i<type.length;i++) {
                binder.registerCustomBinding(getMatchfn(type[i]),CVGridToLConfCV,LConfCVToCVGrid); 
            }
            binder.bindCmp(p,true);
            p.addListener("destroy",function() {
                binder.destroy();
            });
            return p;
        }
    };
    LConf.Extensions.Registry.registerPropertyView({
        objectclass: ".*(host)$",
        priority: 0,
        handler: getHandler(['host'])
            
    });
    
    LConf.Extensions.Registry.registerPropertyView({
        objectclass: ".*(service)$",
        priority: 0,
        handler: getHandler(['service'])
    });
    
    LConf.Extensions.Registry.registerPropertyView({
        objectclass: ".*(structuralobject)$",
        priority: 0,
        handler: getHandler(['service','host'])
    });
})();
