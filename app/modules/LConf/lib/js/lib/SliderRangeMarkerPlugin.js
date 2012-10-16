/**
 * Small slider plugin that marks (horizontal) slider ranges
 * Does currently not work with animated sliders
 * 
 * @author: Jannis Moßhammer <jannis.mosshammer@netways.de>
 */

/*jshint browser:true, curly:false */
/*global Ext:true */
Ext.ns("Ext.ux.LConf").SliderRangeMarkerPlugin= function(cfg) {
    "use strict";
    cfg = cfg || {
        color: "green"
    };
    return {
        init : function(slider) {
            var el = {
                inner: new Ext.Element(Ext.DomHelper.createDom({
                    tag: 'div',
                    style: "background-color:"+cfg.color
                })),
                // left and right element for saturated timeranges, like from 16 to 4 mod 24
                l : new Ext.Element(Ext.DomHelper.createDom({
                    tag: 'div',
                    style: "background-color:"+cfg.color+";position:relative"
                })),
                r : new Ext.Element(Ext.DomHelper.createDom({
                    tag: 'div',
                    style: "background-color:"+cfg.color+";position:relative"
                }))
            };
            var resize = function() {
                
                if(slider.getValues()[0] < slider.getValues()[1]) {
                    var l = slider.thumbs[0].el.getRight();
                    var width  = slider.thumbs[1].el.getLeft()-l;
                    
                    el.inner.anchorTo(slider.thumbs[0].el,"tr");
                    el.inner.setWidth(width);
                    
                    el.l.hide();
                    el.r.hide();
                    el.inner.show();
                    
                } else {
                    el.l.setHeight(el.inner.getHeight());
                    el.r.setHeight(el.inner.getHeight());
                    
                    
                    el.l.alignTo(slider.thumbs[1].el,"t");
                    el.r.alignTo(slider.thumbs[0].el,"tr");
                    el.l.setLeft(-7);
                    el.l.setWidth(slider.thumbs[1].el.getLeft()-el.l.getLeft());
                    el.r.setWidth(slider.el.getRight()-slider.thumbs[0].el.getRight());
                    
                    el.inner.hide();
                    el.l.show();
                    el.r.show();
                }
            };
            slider.on({
                scope    : this,
                change: resize,
                afterrender: function(cmp) {
                    var thumbHeight = slider.thumbs[0].el.getHeight();
                    el.inner.setHeight(thumbHeight);
                    
                    el.inner.setOpacity(0.2);
                    el.r.setOpacity(0.2);
                    el.l.setOpacity(0.2);
                    el.r.alignTo(slider.thumbs[0].el,"tr");
                    el.l.alignTo(slider.thumbs[0].el,"tl");
                    cmp.innerEl.appendChild(el.inner);
                    cmp.el.appendChild(el.l);
                    cmp.el.appendChild(el.r);
                    resize();
                }
            });
        }
    };
};