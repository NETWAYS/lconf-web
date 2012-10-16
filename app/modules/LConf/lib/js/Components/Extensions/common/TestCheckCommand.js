/**
 * Grid extension that adds a column to test checks 
 * 
 */
/*jshint browser:true, curly:false */
/*global Ext:true, LConf:true, _:true */
(function() {    
"use strict";

Ext.ns("LConf.Extensions.KVGrid").TestCheckCommand = {
    xtype: 'action',
    appliesOn: {
        object: {
            "objectclass": ".*?service$"
        },
        properties: ".*servicecheckcommand$"
    },
    iconCls: 'icinga-icon-cog',
    qtip: _('Test this definition'),

    grid: null,
    
    handler: function(grid) {
        var checkValue = this.record.get("value");
        var splittedCmd = checkValue.split("!");
        var checkCmd = splittedCmd[0];
        var args = [];
       
        for(var i=1;i<splittedCmd.length;i++)
            args.push(splittedCmd[i]);
       
        var me = LConf.Extensions.KVGrid.TestCheckCommand;
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
                var ldapEntry = null;

                if(resultSet.total > 0) {
                    ldapEntry = resultSet.result[0].entry;
                }

                me.showCheckCommandWindow(
                    ldapEntry,
                    this.record,
                    checkValue,
                    args
                );
            },
            scope: this
        });
    },

    

    showCheckCommandWindow: function(ldapEntry,record, directCheckCmd,args) {
        var commandLine = null;
        var prefix = "";
        var me = LConf.Extensions.KVGrid.TestCheckCommand;
        var dn = "";
        if(ldapEntry === null) {
            commandLine = record.get("value");
            prefix = record.get("property").match(/(.*?)service.*$/i)[1];
        } else {
            for(var i in ldapEntry) {
                if(i === "dn")
                    dn = ldapEntry[i];
                if(/(.*?)(commandline)$/i.test(i)) {
                    commandLine = ldapEntry[i][0];
                    if(Ext.isObject(commandLine))
                        commandLine = commandLine.data.property;
                    prefix = i.match(/(.*?)(commandline)$/i)[1];

                }
            }
        }
        if(commandLine === null)
            return Ext.Msg.alert("Error",_("Couldn't find commandline"));
        
        var wnd = new LConf.Views.TestCheckWindow({
            grid: me.grid,
            record: record,
            dn: dn,
            prefix: prefix,
            commandLine: commandLine,
            args: args
        });
        wnd.show();
        return true;
    }
};

// register extension, comment to disable it
LConf.Extensions.Registry.registerKeyValueGridExtension(LConf.Extensions.KVGrid.TestCheckCommand);

})();