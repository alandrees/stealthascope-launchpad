/**
 * Copyright 2014-2015 Alan Drees
 *
 * Purpose:
 *  Implement the Grid Page mode for the launchpad (the only mode implemented in the 
 *
 * Dependencies:
 *
 *
 */

if(typeof Launchpad.Page === 'undefined')
{
    load('launchpad_page.js');
}


/**\fn Launchpad.GridPage
 *
 * GridPage constructor
 *
 * @param None
 *
 * @returns None
 */

Launchpad.GridPage = function(launchpad)
{
    Launchpad.Page.apply(this, [launchpad, 'grid']);
    this.mixerAlignedGrid = true;
    this.canScrollTracksUp = false;
    this.canScrollTracksDown = false;
    this.canScrollScenesUp = false;
    this.canScrollScenesDown = false;
    this.title = "Clip Launcher";
    this.temp_mode = Launchpad.TEMPMODE.OFF;
    this.isRecordPressed = false;
    this.isEditPressed = false;
}

//this implements the inheritance from the Launchpad.Page object

Launchpad.GridPage.prototype = Launchpad.Page.prototype;
Launchpad.GridPage.prototype.constructor = Launchpad.GridPage;

/**\fn Launchpad.GridPage.prototype.updateOutputState
 *
 * Handles updating the controller LEDs
 *
 * @param None
 *
 * @returns None
 */

Launchpad.GridPage.prototype.updateOutputState = function()
{
    this.controller.clear();

    this.canScrollUp    = this.mixerAlignedGrid ? this.canScrollScenesUp : this.canScrollTracksUp;
    this.canScrollDown  = this.mixerAlignedGrid ? this.canScrollScenesDown : this.canScrollTracksDown;
    this.canScrollLeft  = !this.mixerAlignedGrid ? this.canScrollScenesUp : this.canScrollTracksUp;
    this.canScrollRight = !this.mixerAlignedGrid ? this.canScrollScenesDown : this.canScrollTracksDown;

    this.updateScrollButtons();
    this.updateGrid();

    this.controller.setTopLED(Launchpad.LED.SESSION,
			      this.temp_mode == Launchpad.TEMPMODE.OFF
			      ? Launchpad.Colour.GREEN_FULL
			      : (this.temp_mode == Launchpad.TEMPMODE.TRACK
				 ? Launchpad.Colour.YELLOW_FULL
				 : Launchpad.Colour.GREEN_FULL));
    this.controller.setTopLED(Launchpad.LED.USER1,
			      this.temp_mode === Launchpad.TEMPMODE.STOP
			      ? Launchpad.Colour.RED_FULL
			      : Launchpad.Colour.OFF);

/*    this.controller.setTopLED(Launchpad.LED.MIXER,
      this.mixerAlignedGrid ? Launchpad.Colour.RED_FULL : Launchpad.Colour.RED_LOW);*/
};

/**\fn Launchpad.GridPage.prototype.onMixerButton
 *
 * Callback function called when the mixer button is pressed
 *
 * @param isPressed
 *
 * @returns None
 */

Launchpad.GridPage.prototype.onMixerButton = function(isPressed)
{
    if(isPressed)
    {
	//this.mixerAlignGrid = !this.mixerAlignGrid;
	//this.updateOutputState();
    }
}

/**\fn Launchpad.GridPage.prototype.onSceneButton
 *
 * Callback function called when a scene button (far right buttons)
 *
 * @param row
 * @param isPressed
 *
 * @returns None
 */

Launchpad.GridPage.prototype.onSceneButton = function(row, isPressed)
{
    if (isPressed)
    {
	this.controller.setRightLED(row, Launchpad.Colour.GREEN_FULL);
	//this.controller.banks.trackbank.launchScene(row);
    }
    else
    {
	this.controller.setRightLED(row, Launchpad.Colour.OFF);
    }
};


/**\fn Launchpad.GridPage.prototype.onLeft
 *
 * Callback function called when the navigate-left button is pressed
 *
 * @param isPressed
 *
 * @returns None
 */

Launchpad.GridPage.prototype.onLeft = function(isPressed)
{
    if (isPressed)
    {
	if (this.mixerAlignedGrid)
	{
	    this.controller.banks.trackbank.scrollChannelsUp();
	}
	else
	{
	    this.controller.banks.trackbank.scrollScenesUp();
	}
    }
};


/**\fn Launchpad.GridPage.prototype.onRight
 *
 * Callback function called when the navigate-right button is pressed
 *
 * @param isPressed
 *
 * @returns None
 */

Launchpad.GridPage.prototype.onRight = function(isPressed)
{
    if (isPressed)
    {
	if (this.mixerAlignedGrid)
	{
	    this.controller.banks.trackbank.scrollChannelsDown();
	}
	else
	{
	    this.controller.banks.trackbank.scrollScenesDown();
	}
    }
};


/**\fn Launchpad.GridPage.prototype.onUp
 *
 * Callback function called when the navigate-up button is pressed
 *
 * @param isPressed
 *
 * @returns None
 */

Launchpad.GridPage.prototype.onUp = function(isPressed)
{
    if (isPressed)
    {
	if (this.mixerAlignedGrid)
	{
	    this.controller.banks.trackbank.scrollScenesUp();
	}
	else
	{
	    this.controller.banks.trackbank.scrollChannelsUp();
	}
    }
};


/**\fn Launchpad.GridPage.prototype.onDown
 *
 * Callback function called when the navigate-down button is pressed
 *
 * @param isPressed
 *
 * @returns None
 */

Launchpad.GridPage.prototype.onDown = function(isPressed)
{
    if (isPressed)
    {
	if (this.mixerAlignedGrid)
	{
	    this.controller.banks.trackbank.scrollScenesDown();
	}
	else
	{
	    this.controller.banks.trackbank.scrollChannelsDown();
	}
    }
};


/**\fn Launchpad.GridPage.prototype.onGridButton
 *
 * Callback function to handle when a grid button is pressed
 *
 * @param row
 * @param column
 * @param pressed
 *
 * @returns None
 */

Launchpad.GridPage.prototype.onGridButton = function(row, column, pressed)
{
    if (!pressed) return;

    if (this.temp_mode === Launchpad.TEMPMODE.OFF)
    {
	var channel = this.mixerAlignedGrid ? column : row;
	var scene = this.mixerAlignedGrid ? row : column;

	if (this.is_record_pressed)
	{
            this.controller.banks.trackbank.getChannel(channel).getClipLauncherSlots().record(scene);
	}
	else if (this.is_edit_pressed)
	{
            this.controller.banks.trackbank.getChannel(channel).getClipLauncherSlots().showInEditor(scene);
	}
	else
	{
            this.controller.banks.trackbank.getChannel(channel).getClipLauncherSlots().launch(scene);
	}
    }
    else if (this.temp_mode === Launchpad.TEMPMODE.TRACK)
    {
	var channel = this.mixerAlignedGrid ? column : row;
	var scene = this.mixerAlignedGrid ? row : column;

	this.controller.banks.trackbank.getChannel(channel).selectInEditor();
    }
    else if (this.temp_mode === Launchpad.TEMPMODE.STOP)
    {
	var channel = this.mixerAlignedGrid ? column : row;
	var scene = this.mixerAlignedGrid ? row : column;

	this.controller.banks.trackbank.getChannel(channel).getClipLauncherSlots().stop();
    }

};

/**\fn Launchpad.GridPage.prototype.updateGrid
 *
 * Updates the grid
 *
 * @param None
 *
 * @returns None
 */

Launchpad.GridPage.prototype.updateGrid = function()
{
   for(var t=0; t < this.controller.options.tracks; t++)
   {
      this.updateTrackValue(t);
   }
};


/**\fn Launchpad.GridPage.prototype.updateTrackValue
 *
 *
 *
 * @param track
 *
 * @returns None
 */

Launchpad.GridPage.prototype.updateTrackValue = function(track)
{
    if(this.temp_mode === Launchpad.TEMPMODE.OFF){

	var armed = this.controller.arm[track];
	var selected = this.controller.isSelected[track];

	for(var scene = 0; scene < 8; scene++)
	{

	    var row = this.mixerAlignedGrid ? scene : track;
	    var column = this.mixerAlignedGrid ? track : scene;

	    var index = track + scene * 8;

	    if(!armed)
	    {
		if(this.controller.hasContent[index]){
		    if(this.controller.isPlaying[index]){
			this.controller.setCellLED(column, row, Launchpad.Colour.GREEN_FULL);
		    }
		    else if(this.controller.isQueued[index]){
			this.controller.setCellLED(column, row, Launchpad.Colour.GREEN_FLASHING);
		    }else{
			this.controller.setCellLED(column, row, Launchpad.Colour.AMBER_FULL);
		    }
		}
	    }
	    else
	    {
		if(this.controller.isPlaying[index]){
		    this.controller.setCellLED(column,
					       row,
					       Launchpad.Colour.GREEN_FULL);
		}else if(this.controller.isRecording[index]){
		    this.controller.setCellLED(column,
					       row,
					       Launchpad.Colour.RED_FLASHING);

		}else if(this.controller.isQueued[index]){
		    this.controller.setCellLED(column,
					       row,
					       Launchpad.Colour.GREEN_FLASHING);
		}else{
		    if(this.controller.hasContent[index]){
			this.controller.setCellLED(column,
						   row,
						   Launchpad.Colour.AMBER_LOW);
		    }
		    else
		    {
			this.controller.setCellLED(column,
						   row,
						   Launchpad.Colour.RED_LOW);
		    }
		}
	    }
	}
    }
    else if(this.temp_mode === Launchpad.TEMPMODE.TRACK)
    {
	if(this.controller.isSelected[track] === true)
	{
	    this.setColumn(this.mixerAlignedGrid ? track : scene,
			   Launchpad.Colour.GREEN_FLASHING);
	}
    }
};

/**\fn Launchpad.GridPage.prototype.setColumn
 *
 * Sets a column of LED buttons
 * 
 * @param column column to illuminate
 * @param colour colour to illuminate the column
 *
 * @returns None
 */

Launchpad.GridPage.prototype.setColumn = function(column, colour)
{
    for(var scene = 0; scene < this.controller.options.scenes; scene++)
    {
	var row = this.mixerAlignedGrid ? scene : column;

	this.controller.setCellLED(column, row, colour);
    }
}



/**\fn Launchpad.GridPage.prototype.setTempMode
 *
 * Set the momentary/instantanous/temporary mode for the page
 *
 * @param None
 *
 * @returns None
 */

Launchpad.GridPage.prototype.setTempMode = function(mode)
{
    if (mode == this.temp_mode){
	return;
    }

    this.temp_mode = mode;

    // Update indications in the app
    for(var p = 0; p < 8; p++)
    {
	var track = this.controller.banks.trackbank.getChannel(p);
    }
};
