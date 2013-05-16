/*jshint browser:true, curly:false */
/*global Ext:true, _:true */
Ext.ns("LConf.DIT.Helper").KeyMap = function(DITTree) {
    "use strict";
    
    var sm = DITTree.getSelectionModel();
    return new Ext.KeyMap(DITTree.getEl(),[{
        // copy
        key: "c",
        ctrl: true,
        fn: function() {
            DITTree.clipboardInsert(sm.getSelectedNodes(),DITTree.connId,false);
        },
        scope: this
    },{ // cut
        key: "x",
        ctrl: true,
        fn: function() {
            DITTree.clipboardInsert(sm.getSelectedNodes(),DITTree.connId,true);
        },
        scope: this
    },{ // insert
        key: "v",
        ctrl: true,
        fn: DITTree.pasteFromClipboard.createDelegate(DITTree),
        scope: this
    },{
        key: "n",
        ctrl: true,
        fn: function(key,ev) {
            
            var selected = sm.getSelectedNodes();
            if(selected.length === 0)
                Ext.Msg.confirm(_("No node selected"), _("You haven't selected a node"));
            var lastSelect = selected[selected.length-1];
            sm.select(lastSelect);

            DITTree.getContextMenu().show(lastSelect,{
                preventDefault: function() {},
                getXY: function() {
                    return [25,Ext.getBody().getHeight()/2-25];
                }
            },true);
            ev.preventDefault();
        },
        scope: this
    },{
        key: 46, //delete
        fn: function() {
            Ext.Msg.confirm(_("Remove selected nodes"),_("Do you really want to delete the selected entries?<br/>")+
                                              _("Subentries will be deleted, too!"),
                function(btn){
                    if(btn === 'yes') {
                        var toDelete = sm.getSelectedNodes();
                        DITTree.removeNodes(toDelete);
                    }
            },this);
        },
        scope: this
    }]);
};