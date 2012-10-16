/*jshint browser:true, curly:false */
/*global Ext:true, LConf:true, _:true */
(function() {    

"use strict";

Ext.ns("LConf.Extensions.KVGrid").JumpToCheckCommand = {
    xtype: 'action',
    appliesOn: {
        properties: ".*checkcommand$"
    },
    iconCls: 'icinga-icon-arrow-right',
    qtip: _('Jump to definition'),
    grid: null,

    handler: function(grid,row,col) {
        var cell = grid.getView().getCell(row,col);
        var checkValue = this.record.get("value");
        var checkCmd = checkValue.replace(/^(.*?)!.*/,"$1");
        var me =  LConf. Extensions.KVGrid.JumpToCheckCommand;
        if(typeof checkValue !== "string")
            return;
        me.grid = grid;
        Ext.Ajax.request({
            url: grid.urls.ldapmetaprovider,
            params: {
                field: Ext.encode({"LDAP":["objectclass=lconfCommand","cn="+checkCmd],"Attr":"*"}),
                connectionId: grid.getStore().getConnection()
            },

            success: function(result) {
                var resultSet = Ext.decode(result.responseText);

                if(resultSet.total < 1) {
                    (new Ext.ToolTip({
                        width: 200,
                        dismissDelay: 1000,
                        hideDelay: 1000,
                        closable: false,
                        
                        draggable: false,
                        title: _("Command not defined in ldap-node")
                    })).showBy(cell);
                    return false;
                }
                
                grid.eventDispatcher.fireCustomEvent("searchDN",resultSet.result[0].entry.dn);
                return true;
            },
            scope: this
        });
    }
};

LConf.Extensions.Registry.registerKeyValueGridExtension(LConf.Extensions.KVGrid.JumpToCheckCommand);
})();
