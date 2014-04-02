
function Page()
{
   this.canScrollLeft = false;
   this.canScrollRight = false;
   this.canScrollUp = false;
   this.canScrollDown = false;
}

Page.prototype.updateOutputState = function()
{
};

Page.prototype.updateScrollButtons = function()
{
   setTopLED(0, this.canScrollUp ? Colour.GREEN_FULL : Colour.GREEN_LOW);
   setTopLED(1, this.canScrollDown ? Colour.GREEN_FULL : Colour.GREEN_LOW);
   setTopLED(2, this.canScrollLeft ? Colour.GREEN_FULL : Colour.GREEN_LOW);
   setTopLED(3, this.canScrollRight ? Colour.GREEN_FULL : Colour.GREEN_LOW);
};

Page.prototype.shouldKeyBeUsedForNoteInport = function(x,y)
{
   return false;
}