/*jshint browser:true, curly:false */
/*global Ext:true, LConf: true */
(function() {
"use strict";

var getStructuralObjectForm = function(store) {
    return {
        xtype:'form',
        layout: 'form',
        padding: "1em 1em 1em 1em",
        autoHeight: true,
        items:{
            xtype: 'fieldset',
            iconCls: 'lconf-logo',
            title: 'General info',
            labelWidth: 200,
            anchor: '90% ',
            defaults: {
                listeners: {
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
                fieldLabel: 'Name',
                xtype: 'textfield',
                allowBlank: false,
                lconfProperty: "ou",
                anchor: '90%'
            }]
        }
    };
};

LConf.Extensions.Registry.registerPropertyView({

    objectclass: ".*structuralobject$",
    handler: function(store) {
        var binder = new LConf.Extensions.Helper.LDAPStoreDataBinder();
        binder.hookStore(store);

        var p = new Ext.Panel({
            autoDestroy: true,
            autoScroll: true,
            priority: 2,
            iconCls: 'lconf-logo',
            title: 'Structural object',
            defaults: {
                flex: 1,
                border: false
            },
            items: [getStructuralObjectForm(store)]
        });
        binder.bindCmp(p, true);
        return p;
    }
});

})();