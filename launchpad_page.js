/**
 * Copyright 2014-2015 Alan Drees
 *
 * Purpose:
 *   Launchpad Page base object
 *
 * Requires:
 *
 */

var Launchpad = Launchpad || {};

/**\fn Launchpad.Page
 *
 * Constructor function for the Launchpad.Page object
 *
 * @param None
 *
 * @returns None
 */

Launchpad.Page = function(controller, name)
{
    this.canScrollLeft = false;
    this.canScrollRight = false;
    this.canScrollUp = false;
    this.canScrollDown = false;
    this.name = name;
    this.controller = controller;
}


/**\fn Launchpad.Page.prototype.updateOutputState
 *
 * Placeholder function for the updateOutputState.  Must be overloaded in the child object.
 *
 * @param None
 *
 * @returns None
 */

Launchpad.Page.prototype.updateOutputState = function()
{
    console.log(this.name + "'s updateOutputState function not overloaded");

};


/**\fn Launchpad.Page.prototype.updateScrollButtons
 *
 * Updates the scroll buttons LED state
 *
 * @param None
 *
 * @returns None
 */

Launchpad.Page.prototype.updateScrollButtons = function()
{
    this.controller.setTopLED(0, this.canScrollUp ?    Launchpad.Colour.GREEN_FULL : Launchpad.Colour.GREEN_LOW);
    this.controller.setTopLED(1, this.canScrollDown ?  Launchpad.Colour.GREEN_FULL : Launchpad.Colour.GREEN_LOW);
    this.controller.setTopLED(2, this.canScrollLeft ?  Launchpad.Colour.GREEN_FULL : Launchpad.Colour.GREEN_LOW);
    this.controller.setTopLED(3, this.canScrollRight ? Launchpad.Colour.GREEN_FULL : Launchpad.Colour.GREEN_LOW);
};


/**\fn Launchpad.Page.prototype.shouldKeyBeUsedForNoteInport
 *
 * Unknown purpose.  Presumed placeholder with no usage in the grid page.
 *
 * @param None
 *
 * @returns None
 */

Launchpad.Page.prototype.shouldKeyBeUsedForNoteInport = function(x,y)
{
   return false;
}
