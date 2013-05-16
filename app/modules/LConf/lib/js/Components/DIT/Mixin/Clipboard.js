/**
 * Helper class for the DIT Tree's clipboard data
 * It's kind of a global state container class for all DIT Trees
 * 
 */
/*jshint browser:true, curly:false */
/*global Ext:true, _:true*/
Ext.ns("LConf.DIT.Mixin").Clipboard = function() {
    "use strict";
    /**
     * This is intended to be public static, because the clipboard is a kind of
     * global state for all DIT Trees. 
     * 
     * When a clipboard action is performed, there's always the information given,
     * which tree was used, so cross tree modifications are possible.
     */
    var clipboard = [];

    /**
     * Adds a set of nodes to the clipboard, overwriting previous values
     *
     * @param Array             The nodes to add, should be an array of Ext.tree.TreeNode classes
     * @tree Lconf.DIT.DITTree  The DITTree instance the node-set belong to
     * @cutted boolean          Whether it's a destructive copy operation or not
     */
    this.clipboardInsert = function(nodes,tree,cutted) {
        this.clearClipboard();
        clipboard = [nodes,tree,cutted];
        if(cutted) {
            Ext.each(nodes,function(node) {
                node.setCls("italic");
            });

        }
    }
    /**
     * Resets the clipboard state to empty
     */
    this.clearClipboard = function(cutted) {
        if (!cutted) {
            try {
                Ext.each(clipboard[0], function(node){
                    node.setCls("");
                });
            } catch(e) {}
        }
        clipboard = [];
    }

    /**
     * Returns an object containing the current clipboard state or an empty
     * object if no nodes are currently in the clipboard
     *
     * @return Object an object with the parameters:
     *      clipboard: A collection of Ext.tree.TreeNodes which are currently in the clipboard
     *      tree     : The LConf.DIT.DITTree instance these nodes belong to
     *      cut      : Whether these nodes are marked to be removed when copied (cut operation)
     */
    this.getClipboardContent = function() {
        if (!Ext.isEmpty(clipboard)) {
            return {
                clipboard: clipboard[0],
                tree: clipboard[1],
                cut: clipboard[2] || false
            }
        }
        return {};
    }

    this.getNumberOfClipboardElements = function() {
        if(Ext.isEmpty(clipboard))
            return 0;
        return clipboard[0].length;
    }

    this.pasteFromClipboard = function(selected) {
        var nodes = this.getClipboardContent();
        // no nodes in the clipboard
        if(!nodes.clipboard)
            return false;
        nodes.clipboard.connId = nodes.tree;
        var selected = selected || this.getSelectionModel().getSelectedNodes();
        if(selected.length === 0)
            Ext.Msg.confirm(_("No node selected"), _("You haven't selected nodes to copy to"));

        // Check if this would be a recursive operation,
        // i.e. the node is at a branch of the current node
        for(var i=0;i<selected.length;i++) {
            var toNode = selected[i];
            for(var x=0;x<nodes.clipboard.length;x++)  {
                if (toNode === nodes.clipboard[x] || toNode.isAncestor(nodes.clipboard[x])) {
                    Ext.Msg.alert(_("Invalid operation"), _("Moving or Copying a node below itself is not supported."));
                    return false;
                }
            }
        }

        // Copy the node to the clipboard
        for(i=0;i<selected.length;i++) {
            var clNode = selected[i];
            clNode.connId = this.connId;
            this.copyNode("append",nodes.clipboard,selected[i],nodes.cut);
        }
        if(nodes.cut) {
            this.clearClipboard(true);
        }
        return true;
    }

    this.createAliasesFromClipboard = function(selected) {
        var nodes = this.getClipboardContent();
        // no nodes in the clipboard
        if(!nodes.clipboard)
            return false;
        nodes.clipboard.connId = nodes.tree;
        var selected = selected || this.getSelectionModel().getSelectedNodes();
        if(selected.length === 0)
            Ext.Msg.confirm(_("No node selected"), _("You haven't selected nodes to copy to"));


        for(var i=0;i<selected.length;i++) {
            var toNode = selected[i];
            for(var x=0;x<nodes.clipboard.length;x++)  {
                if (toNode === nodes.clipboard[x] || toNode.isAncestor(nodes.clipboard[x])) {
                    Ext.Msg.alert(_("Invalid operation"), _("Moving or Copying a node below itself is not supported."));
                    return false;
                }
            }
        }

        for(i=0;i<selected.length;i++) {
            var clNode = selected[i];
            clNode.connId = this.connId;
            this.buildAlias("append",nodes.clipboard,selected[i])
        }

        return true;
    }
};
