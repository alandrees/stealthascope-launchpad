/**
 * Copyright 2014 Alan Drees
 *   
 * Purpose:
 *   
 * Requires:
 *
 */

var Launchpad = Launchpad || {};

Launchpad.Page = function(controller)
{
    this.canScrollLeft = false;
    this.canScrollRight = false;
    this.canScrollUp = false;
    this.canScrollDown = false;
    this.controller = controller;
}

Launchpad.Page.prototype.updateOutputState = function()
{
};

Launchpad.Page.prototype.updateScrollButtons = function()
{
    this.controller.setTopLED(0, this.canScrollUp ?    Launchpad.Colour.GREEN_FULL : Launchpad.Colour.GREEN_LOW);
    this.controller.setTopLED(1, this.canScrollDown ?  Launchpad.Colour.GREEN_FULL : Launchpad.Colour.GREEN_LOW);
    this.controller.setTopLED(2, this.canScrollLeft ?  Launchpad.Colour.GREEN_FULL : Launchpad.Colour.GREEN_LOW);
    this.controller.setTopLED(3, this.canScrollRight ? Launchpad.Colour.GREEN_FULL : Launchpad.Colour.GREEN_LOW);
};

Launchpad.Page.prototype.shouldKeyBeUsedForNoteInport = function(x,y)
{
   return false;
}
