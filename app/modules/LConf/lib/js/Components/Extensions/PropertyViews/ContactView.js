/**
 * Simple Editor view for Contact definitions
 * 
 */
/*jshint browser:true, curly:false */
/*global Ext:true, LConf: true */
(function() {
"use strict";
    
var prefix = LConf.Configuration.prefix;

/**
 * Eventhandler function for ldap-editor sync 
 */
var updateFieldValues = function(map) {   
    if(!this.lconfProperty) {
        return;
    }
    if(this.hideOn) {
        if(new RegExp(".*"+this.hideOn+"$","i").test(map.objectclass)) {
            this.hide();
            return;
        }
    }
    var lconfProperty = this.lconfProperty.toLowerCase();
    for(var i in map) {
        if(lconfProperty === i.toLowerCase())
            this.setValue(map[i]);
    }
};

var updateTristateButtonValues = function(map) {
    if(map[this.lconfProperty.toLowerCase()] === "0" || map[this.lconfProperty] === 0)
        this.toggle("false",true);
    else if(map[this.lconfProperty.toLowerCase()] === "1" || map[this.lconfProperty] === 1)
        this.toggle("true",true);
    else
        this.toggle("disabled");
};


/**
 * Returns the panel for entering a contacts generic details like name, alias, etc.
 * @param {Ext.data.Store} The store containing the nodes information (WARNING: May not be populated yet)
 * 
 * @return {Ext.form.FormPanel}
 */
var getContactPanel = function(store) {
    var onFieldChange = function(cmp,value) {
        if(value === ""  && cmp.allowBlank !== false) {
            store.deleteProperties(store.findProperty(cmp.lconfProperty));
        } else {
            store.setProperty(cmp.lconfProperty,value);
        }

    };

    // specific comboboxes for groups
    var contactgroupBox = LConf.Editors.EditorFieldManager.getEditorFieldForProperty(
        prefix+"ContactGroups",{
            fieldLabel: 'Contactgroups',
            lconfProperty: prefix+"Contactgroups",
            xtype: 'combo',
            anchor: '90%',
            listeners: {
                change: onFieldChange
            }
        },[prefix+"contact"]
    );
    
    // current store is being populated while this field is set, so we have to wait a few ms
    var setupFn = function(fn) {
        if(!contactgroupBox.store) {
            fn.defer(200,null,[setupFn])
        } else {
            contactgroupBox.store.setBaseParam("connectionId",store.getConnection());
            contactgroupBox.updateFieldValues = updateFieldValues;
        }
    }
    setupFn.defer(200,null,[setupFn]);
    
    return {
        xtype:'form',
        layout: 'form',
        padding: "1em 1em 1em 1em",
        autoHeight: true,
        items:{
            xtype: 'fieldset',
            iconCls: 'icinga-icon-user',
            title: 'Contact info',
            labelWidth: 200,
            anchor: '90% ',
            defaults: {
                updateFieldValues: updateFieldValues,
                listeners: {
                    change: onFieldChange,
                    invalid: function(cmp) {
                        if(!cmp.activeError)
                            store.markInvalid(true);
                    },
                    valid: function() {
                        store.markInvalid(false);
                    }
                }
            },
            items: [{
                fieldLabel: 'Contact name',
                xtype: 'textfield',
                allowBlank: false,
                lconfProperty: "cn",
                hideOn: 'structuralobject',
                anchor: '90%'
            },{
                fieldLabel: 'Contact alias',
                xtype: 'textfield',
                lconfProperty: prefix+"Alias",
                hideOn: 'structuralobject',
                anchor: '90%'
            },{
                fieldLabel: 'Email',
                xtype: 'textfield',
                lconfProperty: prefix+"Email",
                hideOn: 'structuralobject',
                anchor: '90%'
            },{
                fieldLabel: 'Pager',
                xtype: 'textfield',
                lconfProperty: prefix+"Pager",
                hideOn: 'structuralobject',
                anchor: '90%'
            },
            contactgroupBox]
        }
    }; 
};

/**
 * The Host notification panel, like in the host editor
 * @param {Ext.data.Store} The store containing the nodes information (WARNING: May not be populated yet)
 * 
 * @return {Ext.form.FormPanel}
 */
var getContactHostNotificationPreferences = function(store) {
        
    var onFieldChange = function(cmp,value) {
        if(value === "") {
            store.deleteProperties(store.findProperty(cmp.lconfProperty));
        } else {
            store.setProperty(cmp.lconfProperty,value);
        }
    };
    var onTristateToggle = function(cmp,state) {
        if(state === "true") {
            store.setProperty(this.lconfProperty,"1");
        } else if(state === "false") {
            store.setProperty(this.lconfProperty,"0");
        } else {
            store.deleteProperties(store.findProperty(this.lconfProperty));
        }
    };
    // specific comboboxes for groups
    var tpCommandBox = LConf.Editors.EditorFieldManager.getEditorFieldForProperty(
        prefix+"HostNotificationPeriod",{
            fieldLabel: 'Period',
            lconfProperty: prefix+"ContactHostNotificationPeriod",
            xtype: 'combo',
            emptyText: 'Default contact timeperiod',
            anchor: '90%',         
            listeners: {
                change: onFieldChange
            }
        },[prefix+"host"]
    );
    (function() {
        if(!tpCommandBox.store)
            return;
        tpCommandBox.store.setBaseParam("connectionId",store.getConnection());
        tpCommandBox.updateFieldValues = updateFieldValues;
    }).defer(200);
    
    var btnGroup = new Ext.ButtonGroup({
        xtype: 'buttongroup',
        autoHeight: true,
        lconfProperty: prefix+'ContactHostNotificationOptions',
        defaults: {
            bubbleEvents: ["toggle","change"],
            xtype: 'button'
        },
        layout: 'column',

        listeners: {
            toggle: function() {
                var opts = "";
                this.items.each(function(btn) {
                    if(btn.pressed)
                        opts += (opts ? "," : "")+btn.notificationType;
                });
                store.setProperty(this.lconfProperty,opts);
            }
        },
        disabled: true,
        border: false,
        items: [{
            text: 'Down',
            notificationType: 'd',
            enableToggle: true
        },{
            text: 'Unreachable',
            notificationType: 'u',
            enableToggle: true
        },{
            text: 'Recovery',
            notificationType: 'r',
            enableToggle: true
        },{
            text: 'Flapping',
            notificationType: 'f',
            enableToggle: true,
            iconCls: 'icinga-icon-flapping'
        },{
            text: 'Downtime',
            notificationType: 's',
            enableToggle: true,
            iconCls: 'icinga-icon-downtime'
        },{
            text: 'None',
            notificationType: 'n',
            enableToggle: true,
            iconCls: 'icinga-icon-cancel'
        }]
    });
    btnGroup.updateFieldValues = function(map) {
        var p = this.lconfProperty.toLowerCase();
        if(typeof map[p] === "undefined")
            return;
        this.items.each(function(btn) {
            btn.toggle(false,true);
            var split = map[p].split(",");
            for(var i=0;i<split.length;i++) {
                if(split[i].toLowerCase() === btn.notificationType)
                    btn.toggle(true,true);
            }
        },this);
    };
    
    
    var defaultBtn =  new Ext.Button({
        xtype: 'button',
        text: 'Use default rules',
        fieldLabel: 'Notify on',
        pressed: true,
        enableToggle: true,
        lconfProperty: prefix+'ContactHostNotificationOptions',
        toggleHandler: function(btn,state) {
            
            for(var i=1;i<this.ownerCt.items.length;i++) {
                this.ownerCt.items.items[1].setDisabled(state);
            }
            if(state === true) {
                btnGroup.items.each(function(btn) {
                    btn.toggle(false,true);
                });
                store.deleteProperties(store.findProperty(btn.lconfProperty));
            }
        },
        updateFieldValues: function(map) {
            if(typeof map[this.lconfProperty.toLowerCase()] === "undefined") {
                this.toggle(true,true);
                
                btnGroup.setDisabled(true);
                
            } else {
                this.toggle(false,true); 
                btnGroup.setDisabled(false);
                
            }
        }
    });

    return {
        xtype:'form',
        autoHeight: true,        
        flex: 1,
        layout: 'form',
        padding: "1em 1em 1em 1em",
        
        items: {
            xtype: 'fieldset',
            flex:1,
            title: 'Host Notifications for this contact',
            iconCls: 'icinga-icon-host',
            border: true,
            anchor: '90%',
            defaults: {
               
                listeners: {
                    change: onFieldChange
                }
        
            },
            items: [
                defaultBtn,
                btnGroup,{
                    xtype: 'spacer',
                    height: 20
                },tpCommandBox,{
                    xtype: 'numberfield',
                    fieldLabel: 'Interval',
                    updateFieldValues: function() {
                        updateFieldValues.apply(this,arguments);
                        btnGroup.updateFieldValues.apply(btnGroup,arguments);
                        defaultBtn.updateFieldValues.apply(defaultBtn,arguments);
                    },
                lconfProperty: prefix+'ContactHostNotificationInterval',
                width:30
            },{
                xtype: 'tristatebutton',
                fieldLabel: 'Enable notifications',
                lconfProperty: prefix+'ContactHostNotificationsEnabled',
                text: 'Use default',
                stateText: {
                    "true": 'Yes',
                    "false": 'No',
                    "disabled": 'Use default'
                },
                updateFieldValues: updateTristateButtonValues,
                listeners: {    
                    toggle: onTristateToggle
                },
                pressed: 'disabled'
            }]
        }
    };
};



/**
 * The Service notification panel, like in the service editor
 * @param {Ext.data.Store} The store containing the nodes information (WARNING: May not be populated yet)
 * 
 * @return {Ext.form.FormPanel}
 */
var getContactServiceNotificationPreferences = function(store) {
        
    var onFieldChange = function(cmp,value) {
        if(value === "") {
            store.deleteProperties(store.findProperty(cmp.lconfProperty));
        } else {
            store.setProperty(cmp.lconfProperty,value);
        }
    };
    var onTristateToggle = function(cmp,state) {
        if(state === "true") {
            store.setProperty(this.lconfProperty,"1");
        } else if(state === "false") {
            store.setProperty(this.lconfProperty,"0");
        } else {
            store.deleteProperties(store.findProperty(this.lconfProperty));
        }
    };
    // specific comboboxes for groups
    var tpCommandBox = LConf.Editors.EditorFieldManager.getEditorFieldForProperty(
        prefix+"ContactServiceNotificationPeriod",{
            fieldLabel: 'Period',
            lconfProperty: prefix+"ContactServiceNotificationPeriod",
            xtype: 'combo',
            emptyText: 'Default service notification timeperiod',
            anchor: '90%',         
            listeners: {
                change: onFieldChange
            }
        },[prefix+"service"]
    );
    (function() {
        if(!tpCommandBox.store)
            return null;
        tpCommandBox.store.setBaseParam("connectionId",store.getConnection());
        tpCommandBox.updateFieldValues = updateFieldValues;
    }).defer(200);
    
    var btnGroup = new Ext.ButtonGroup({
        xtype: 'buttongroup',
        autoHeight: true,
        lconfProperty: prefix+'ContactServiceNotificationOptions',
        defaults: {
            bubbleEvents: ["toggle","change"],
            xtype: 'button'
        },
        layout: 'column',

        listeners: {
            toggle: function() {
                var opts = "";
                this.items.each(function(btn) {
                    if(btn.pressed)
                        opts += (opts ? "," : "")+btn.notificationType;
                });
                store.setProperty(this.lconfProperty,opts);
            }
        },
        disabled: true,
        border: false,
        items: [{
            text: 'Down',
            notificationType: 'd',
            enableToggle: true
        },{
            text: 'Unreachable',
            notificationType: 'u',
            enableToggle: true
        },{
            text: 'Recovery',
            notificationType: 'r',
            enableToggle: true
        },{
            text: 'Flapping',
            notificationType: 'f',
            enableToggle: true,
            iconCls: 'icinga-icon-flapping'
        },{
            text: 'Downtime',
            notificationType: 's',
            enableToggle: true,
            iconCls: 'icinga-icon-downtime'
        },{
            text: 'None',
            notificationType: 'n',
            enableToggle: true,
            iconCls: 'icinga-icon-cancel'
        }]
    });
    btnGroup.updateFieldValues = function(map) {
        var p = this.lconfProperty.toLowerCase();
        if(typeof map[p] === "undefined")
            return;
        this.items.each(function(btn) {
            btn.toggle(false,true);
            var split = map[p].split(",");
            for(var i=0;i<split.length;i++) {
                if(split[i].toLowerCase() === btn.notificationType)
                    btn.toggle(true,true);
            }
        },this);
    };
    
    
    var defaultBtn =  new Ext.Button({
        xtype: 'button',
        text: 'Use default rules',
        fieldLabel: 'Notify on',
        pressed: true,
        enableToggle: true,
        lconfProperty: prefix+'ContactServiceNotificationOptions',
        toggleHandler: function(btn,state) {
            
            for(var i=1;i<this.ownerCt.items.length;i++) {
                this.ownerCt.items.items[1].setDisabled(state);
            }
            if(state === true) {
                btnGroup.items.each(function(btn) {
                    btn.toggle(false,true);
                });
                store.deleteProperties(store.findProperty(btn.lconfProperty));
            }
        },
        updateFieldValues: function(map) {
            if(typeof map[this.lconfProperty.toLowerCase()] === "undefined") {
                this.toggle(true,true);
                btnGroup.setDisabled(true);             
            } else {
                this.toggle(false,true); 
                btnGroup.setDisabled(false);             
            }
        }
    });

    return {
        xtype:'form',
        autoHeight: true,        
        flex: 1,
        layout: 'form',
        padding: "1em 1em 1em 1em", 
        items: {
            xtype: 'fieldset',
            flex:1,
            title: 'Service Notifications for this contact',
            iconCls: 'icinga-icon-service',
            border: true,
            anchor: '90%',
            defaults: {
                listeners: {
                    change: onFieldChange
                }  
            },
            items: [
                defaultBtn,
                btnGroup,
            {
                xtype: 'hidden',
                updateFieldValues: function() {
                    // required for button update
                    var btnGroups = this.ownerCt.findByType('buttongroup');
                    for(var i=0;i<btnGroups.length;i++) {
                        btnGroups[i].updateFieldValues.apply(btnGroups[i],arguments);
                    }
                
                    var tristateBtns = this.ownerCt.findByType('tristatebutton');
                    for(i=0;i<tristateBtns.length;i++) {
                        tristateBtns[i].updateFieldValues.apply(tristateBtns[i],arguments);
                    }
                }
            },{
                xtype: 'spacer',
                height: 20
            },tpCommandBox,{
                xtype: 'numberfield',
                fieldLabel: 'Interval',
                updateFieldValues: function() {
                    updateFieldValues.apply(this,arguments);
                    btnGroup.updateFieldValues.apply(btnGroup,arguments);
                    defaultBtn.updateFieldValues.apply(defaultBtn,arguments);

                },
                lconfProperty: prefix+'ContactServiceNotificationInterval',
                width:30
            },{
                xtype: 'tristatebutton',
                fieldLabel: 'Enable notifications',
                lconfProperty: prefix+'ContactServiceNotificationsEnabled',
                text: 'Use default',
                stateText: {
                    "true": 'Yes',
                    "false": 'No',
                    "disabled": 'Use default'
                },
                updateFieldValues: updateTristateButtonValues,
                listeners: {    
                    toggle: onTristateToggle
                },
                pressed: 'disabled'
            }]
        }
    };
};

var updateFormValues = function() {
    var ldapMap = {};
    this.store.each(function(r) {
        ldapMap[r.get('property').toLowerCase()] = r.get('value');
    });
    if(this.rendered) {
        
        this.items.each(function(item) {
            if(!item)
                return false;
            if(item.xtype !== 'panel') {
                item.getForm().callFieldMethod("updateFieldValues",[ldapMap]);
            } else {
                item.items.each(function(subitem) {
                    if(!subitem)
                        return false;
                    subitem.getForm().callFieldMethod("updateFieldValues",[ldapMap]);
                    return true;
                });
            }
            return true;
        });
        if(this.items.items[1])
            this.items.items[1].getForm().callFieldMethod("updateFieldValues",[ldapMap]);
    } else {
        this.on("show",updateFormValues,this,{single:true});
    }
};

LConf.Extensions.Registry.registerPropertyView({

    objectclass: ".*(structuralobject|contact)$",
    handler: function(store) {
        var p = new Ext.Panel({
            autoScroll: true,
            priority: 1,
            iconCls: 'icinga-icon-user',
            title: 'Contact settings',
            defaults: {
                flex: 1,
                border: false
            },
            items: [
                getContactPanel(store),
                getContactHostNotificationPreferences(store),
                getContactServiceNotificationPreferences(store)

            ]
        });
 
        p.store = store;
        var storeFn = updateFormValues.createDelegate(p);
        store.on("update",storeFn);
        store.on("load",storeFn);
        p.addListener("beforeremove",function() {
            store.removeListener("update",storeFn);
            store.removeListener("load",storeFn);
        });
        return p;
    }
});

})();
