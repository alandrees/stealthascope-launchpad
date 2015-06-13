/**
 * Copyright 2014-2015 Alan Drees
 *
 * Purpose:
 *  Stripped-down core implementation of the Launchpad script.
 *
 * Dependencies:
 *  launchpad_constants.js
 *  launchpad_grid.js
 */

var Launchpad = Launchpad || {};

/**\fn Launchpad.LaunchpadController
 *
 * LaunchpadController consutructor
 *
 * @param options options object to set the options of the controller for
 * @param instance controller instance
 *
 * @returns None
 */

Launchpad.LaunchpadController = function(options, instance)
{
    var self = this;

    this.set_options(options);
    this.instance = instance;

    this.arm = initArray(0, this.options.tracks);
    this.trackExists = initArray(0, this.options.tracks);

    this.isSelected = initArray(0, this.options.tracks);

    this.hasContent = initArray(0, this.options.channels * this.options.scenes);

    this.isPlaying = initArray(0, this.options.channels * this.options.scenes);

    this.isRecording = initArray(0, this.options.channels * this.options.scenes);

    this.isQueued = initArray(0, this.options.channels * this.options.scenes);

    this.launchpad_io = Array(this.options.devices);

    this.io_grid_array = Launchpad.create_2d_array(this.options.layout_order.length,
						   this.options.layout_order[0].length);

    this.gridPage = new Launchpad.GridPage(this);

    var lp_io;

    var lp_io_counter = 0;

    for(var x = 0; x < this.options.layout_order.length; x++)
    {
	for(var y = 0; y < this.options.layout_order[0].length; y++)
	{
	    lp_io = new Launchpad.LaunchpadIO(this.options,
					      x,
					      y,
					      lp_io_counter);

	    this.launchpad_io[lp_io_counter++] = lp_io;

	    this.io_grid_array[x][y] = lp_io;
	}
    }

    //these coordinates correspond to the top left corner of the highlighting section
    this.activePage = {};

    this.logoPhase = 0;
    this.showStealthascopeLogo = false;

    this.force_optimized_flush = false;
}

/**\fn Launchpad.LaunchpadController.prototype.init
 *
 * Initalization function
 *
 * @param banks banks object generated externally
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.init = function(banks)
{
    var self = this;

    this.banks = {};

    if(typeof banks === 'undefined')
    {
	this.banks.transport = host.createTransport();
	this.banks.application = host.createApplication();
	this.banks.trackbank = host.createMainTrackBank(this.options.tracks,
							0,
							this.options.scenes);
    }
    else
    {
	this.banks = banks;
    }

    for(var c = 0; c < this.options.channels; c++)
    {
	var track = this.banks.trackbank.getChannel(c);

	track.getArm().addValueObserver(this.getChannelObserverFunc(c, this.arm));
	track.exists().addValueObserver(this.getChannelObserverFunc(c, this.trackExists));
	track.addIsSelectedInEditorObserver(this.getChannelObserverFunc(c, this.isSelected));

	var cliplauncher = track.getClipLauncherSlots();

	cliplauncher.addHasContentObserver(this.getGridObserverFunc(c, this.options.channels, this.hasContent));
	cliplauncher.addIsPlayingObserver(this.getGridObserverFunc(c, this.options.channels, this.isPlaying));
	cliplauncher.addIsRecordingObserver(this.getGridObserverFunc(c, this.options.channels, this.isRecording));
	cliplauncher.addIsPlaybackQueuedObserver(this.getGridObserverFunc(c, this.options.channels, this.isQueued));
    }

    this.banks.trackbank.addCanScrollChannelsUpObserver(function(canScroll)
							{
							    self.gridPage.canScrollTracksUp = canScroll;
							});


    this.banks.trackbank.addCanScrollChannelsDownObserver(function(canScroll)
							  {
							      self.gridPage.canScrollTracksDown = canScroll;
							  });

    this.banks.trackbank.addCanScrollScenesUpObserver(function(canScroll)
						      {
							  self.gridPage.canScrollScenesUp = canScroll;
						      });

    this.banks.trackbank.addCanScrollScenesDownObserver(function(canScroll)
							{
							    self.gridPage.canScrollScenesDown = canScroll;
							});

    for(var i = 0; i < this.launchpad_io.length; i++)
    {
	this.launchpad_io[i].init(self);
    }

    if(this.showStealthascopeLogo)
    {
	this.animateLogo();
    }

    this.setActivePage(this.gridPage);
}


/**\fn Launchpad.LaunchpadController.prototype.setActivePage
 *
 * This function takes a page object, and makes it the currently active page
 *
 * @param page new page to change to
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setActivePage = function(page)
{
    var isInit = this.activePage == null;

    if (page != this.activePage)
    {
	this.activePage = page;

	// Update indications in the app
	for(var p = 0; p < this.options.channels; p++)
	{
	    var track = this.banks.trackbank.getChannel(p);
	    track.getClipLauncherSlots().setIndication(this.activePage == this.gridPage);
	}
    }
}


/**\fn Launchpad.LaunchpadController.prototype.getChannelObserverFunc
 *
 * Creates a closure for the channel observer functions
 *
 * @param channel (integer) track with which to run the callback on
 * @param varToStore (array) variable to reference with respect to the track
 *
 * @returns (function) function which will be passed to the channel observer function
 */

Launchpad.LaunchpadController.prototype.getChannelObserverFunc = function(channel, varToStore)
{
    return function(value)
    {
	varToStore[channel] = value;
    }
}


/**\fn Launchpad.LaunchpadController.prototype.getGridObserverFunc
 *
 * Creates a closure for the grid observer functions
 *
 * @param track (integer) track with which to run the callback on
 * @param width (integer) width of the controller in grid units
 * @param varToStore (array) array to store the value in
 *
 * @returns (function) function which will be passed to the grid observer function
 */

Launchpad.LaunchpadController.prototype.getGridObserverFunc = function(track, width, varToStore)
{
    return function(scene, value)
    {

	varToStore[scene * width + track ] = value;
    }
}


/**\fn Launchpad.LaunchpadController.prototype.animateLogo
 *
 * Animation callback function for the startup animation passed to the task scheduler
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.animateLogo = function()
{
    var self = this;

    if (this.logoPhase > 7)
    {
	this.setDutyCycle(2, 6);
	return;
    }
    else if (this.logoPhase > 6)
    {
	this.showStealthascopeLogo = false;
	var i = 0.5 - 0.5 * Math.cos(this.logoPhase * Math.PI);
	this.setDutyCycle(Math.floor(1 + 5 * i), 18);
    }
    else
    {
	var i = 0.5 - 0.5 * Math.cos(this.logoPhase * Math.PI);
	this.setDutyCycle(Math.floor(1 + 15 * i), 18);
    }

    this.logoPhase += 0.2;

    host.scheduleTask(function(){self.animateLogo()}, null, 90);
}


/**\fn Launchpad.LaunchpadController.prototype.exit
 *
 * Exit function for the controller
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.exit = function()
{
    for(var i = 0; i < this.launchpad_io.length; i++)
    {
	this.launchpad_io[i].resetDevice();
    }
}

/**\fn Launchpad.LaunchpadController.prototype.flush
 *
 * Updates the controller with new data
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.flush = function()
{
    if (this.showStealthascopeLogo)
    {
	this.drawStealthascopeLogo();
    }
    else
    {
	if(typeof this.activePage.updateOutputState === 'function')
	{
	    this.activePage.updateOutputState();
	}
    }

    /*TODO: ADD LOGIC TO DETERMINE IF ONLY ONE CONTROLLER REQUIRES UPDATING*/

    for(var i = 0; i < this.launchpad_io.length; i++)
    {
	this.launchpad_io[i].flushLEDs();
    }
}


 *
 *
 *
 * @returns None
 */

{


}


/**\fn Launchpad.LaunchpadController.prototype.setGridMappingMode
 *
 * This sets the grid mapping mode between the drum pad mode or the grid mode (in this case the grid mode
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setDrumMappingMode = function()
{
    this.send_midi(0xB0,
		   0,
		   1);
}


/**\fn Launchpad.LaunchpadController.prototype.setDutyCycle
 *
 * Sets the LED duty cycle by passing a numerator and denominator
 *
 * @param numerator duty cycle numerator
 * @param denominator duty cycle denominator
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setDutyCycle = function(numerator, denominator)
{
    if (numerator < 9)
    {
	this.send_midi(0xB0,
		       0x1E,
		       16 * (numerator - 1) + (denominator - 3));
    }
    else
    {
	this.send_midi(0xB0,
		       0x1F,
		       16 * (numerator - 9) + (denominator - 3));
    }
}


/**\fn Launchpad.LaunchpadController.prototype.onMidi
 *
 * Callback function to be called when midi input is detected
 *
 * @param status (integer) status byte (type/channel) of incoming message
 * @param data1 (integer) data1 byte of incoming message
 * @param data2 (integer) data2 byte of incoming message
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.onMidi = function(status, data1, data2)
{
    if (MIDIChannel(status) != 0) return;

    if (isChannelController(status))
    {
	var isPressed = data2 > 0;

	switch(data1)
	{
	case Launchpad.TopButton.SESSION:
	    if (isPressed)
	    {
		if(this.activePage.name !== "grid"){
		    this.setActivePage(this.gridPage);
		}
		else
		{
		    this.gridPage.setTempMode(Launchpad.TEMPMODE.TRACK);
		}
	    }
	    else
	    {
		this.gridPage.setTempMode(Launchpad.TEMPMODE.OFF);
	    }

	    break;

        case Launchpad.TopButton.USER1:
	    if (isPressed)
	    {
		this.gridPage.setTempMode(Launchpad.TEMPMODE.STOP);
	    }
	    else
	    {
		this.gridPage.setTempMode(Launchpad.TEMPMODE.OFF);
	    }

	    break;

        case Launchpad.TopButton.USER2:
            break;

        case Launchpad.TopButton.MIXER:
	    this.activePage.onMixerButton(isPressed);
            break;

        case Launchpad.TopButton.CURSOR_LEFT:
            this.activePage.onLeft(isPressed);
            break;

        case Launchpad.TopButton.CURSOR_RIGHT:
            this.activePage.onRight(isPressed);
            break;

        case Launchpad.TopButton.CURSOR_UP:
            this.activePage.onUp(isPressed);
            break;

        case Launchpad.TopButton.CURSOR_DOWN:
            this.activePage.onDown(isPressed);
            break;
	}
    }

    if (isNoteOn(status) || isNoteOff(status, data2))
    {
	var row = data1 >> 4;
	var column = data1 & 0xF;

	if (column < 8)
	{
	    this.activePage.onGridButton(row, column, data2 > 0);
	}
	else
	{
	    this.activePage.onSceneButton(row, data2 > 0);
	}
    }
}


/**\fn Launchpad.LaunchpadController.prototype.clear
 *
 * Clear all the LEDs
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.clear = function()
{
    for(var i=0; i<80; i++)
    {
	this.pendingLEDs[i] = Launchpad.Colour.OFF;
    }
}


/**\fn Launchpad.LaunchpadController.prototype.flush
 *
 * Updates the controller with new data
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.flush = function()
{
    if (this.showStealthascopeLogo)
    {
	this.drawStealthascopeLogo();
    }
    else
    {
	this.activePage.updateOutputState();
    }

    this.flushLEDs();

}


/**\fn Launchpad.LaunchpadController.prototype.drawStealthascopeLogo
 *
 * Draws the Stealthascope logo
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.drawStealthascopeLogo = function()
{
    var left_offset = 1;
    var right_limit = 6;

    var c = Launchpad.mixColour(7, 1, false);

    //vertical
    for(var i = left_offset; i < right_limit - 1; i++){
	this.setCellLED(i, 1, c);
    }

    //left
    for(var i = 2; i < 4; i++){
	this.setCellLED(left_offset,i,c)
    }

    //vertical
    for(var i = left_offset; i < right_limit -1 ; i++){
	this.setCellLED(i, 4, c);
    }

    //right
    for(var i = 5; i < 7; i++){
	this.setCellLED(right_limit - 2,i,c);
    }

    //bottom
    for(var i = left_offset; i < right_limit - 1; i++){
	this.setCellLED(i, 7, c);
    }
}


/**\fn Launchpad.LaunchpadController.prototype.setTopLED
 *
 * Set one of the top LEDs (navigation or mode LEDs)
 *
 * @param index (integer) top led index
 * @param colour (integer) color to set the LED to
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setTopLED = function(index, colour)
{
    this.pendingLEDs[Launchpad.LED.TOP + index] = colour;
}


/**\fn Launchpad.LaunchpadController.prototype.setRightLED
 *
 * Sets the scene-firing LEDs on the far right
 *
 * @param index index to send to
 * @param colour colour to set the LED to
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setRightLED = function(index, colour)
{
    this.pendingLEDs[Launchpad.LED.SCENE + index] = colour;
}


/**\fn Launchpad.LaunchpadController.prototype.setCellLED
 *
 * Set one of the grid LEDs
 *
 * @param column (integer) track of the grid LED
 * @param row (integer) scene of the grid LED
 * @param colour (integer) color to set the LED to
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setCellLED = function(column, row, colour)
{
    this.pendingLEDs[row * 8 + column] = colour;
}


/**\fn Launchpad.LaunchpadController.prototype.flushLEDs
 *
 * Flush all the output to the controller, updating the LEDs
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.flushLEDs = function()
{
    if(typeof this.flushcount === 'undefined')
    {
	for(var x in this.pendingLEDs)
	{
	    if(typeof this.pendingLEDs[x] === 'object')
	    {
		dump(this.pendingLEDs[x]);
	    }
	}
	this.flushcount = true;
    }


    var changedCount = 0;

    for(var i=0; i<80; i++)
    {
	if (this.pendingLEDs[i] != this.activeLEDs[i])
	{
	    changedCount++;
	}
    }

    if (changedCount == 0)
    {
	return;
    }

    if (changedCount > 30)
    {
	for(var i = 0; i<80; i+=2)
	{
            this.send_midi(0x92,
		     this.pendingLEDs[i],
		     this.pendingLEDs[i+1])
            this.activeLEDs[i] = this.pendingLEDs[i];
            this.activeLEDs[i+1] = this.pendingLEDs[i+1];
	}

	this.send_midi(0xB0,
		       104 + 7,
		       this.activeLEDs[79]); // send dummy message to leave optimized mode
    }
    else
    {
	for(var i = 0; i<80; i++)
	{
            if (this.pendingLEDs[i] != this.activeLEDs[i])
            {
		this.activeLEDs[i] = this.pendingLEDs[i];

		var colour = this.activeLEDs[i];

		if (i < 64) // Main Grid
		{
		    var column = i & 0x7;
		    var row = i >> 3;

		    this.send_midi(0x90,
			     row*16 + column,
			     colour);
		}
		else if (i < 72)    // Right buttons
		{
		    this.send_midi(0x90,
			     8 + (i - 64) * 16,
			     colour);
		}
		else    // Top buttons
		{
		    this.send_midi(0xB0,
			     104 + (i - 72),
			     colour);
		}
            }
	}
    }
}

/**\fn Launchpad.LaunchpadController.prototype.textToPattern
 *
 * Format text into a bit pattern that can be displayed on 4-pixels height
 *
 * @param text to convert to a pattern
 *
 * @returns array containing a list of grid patterns to be executed
 */

Launchpad.LaunchpadController.prototype.textToPattern = function(text)
{
    var result = [];

    for(var i=0; i< text.length; i++)
    {
	if (i != 0) result.push(0x0); // mandatory spacing

	switch (text.charAt(i))
	{
        case '0':
            result.push(0x6, 0x9, 0x6);
            break;

        case '1':
            result.push(0x4, 0xF);
            break;

        case '2':
            result.push(0x5, 0xB, 0x5);
            break;

        case '3':
            result.push(0x9, 0x9, 0x6);
            break;

        case '4':
            result.push(0xE, 0x3, 0x2);
            break;
	}
    }

    return result;
}

/**\fn Launchpad.LaunchpadController.prototype.set_options
 *
 * Sets controller options
 *
 * @param options options with which to set (use defaults if not set)
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.set_options = function(options)
{
    this.options = { 'tracks'   : Launchpad.NUM_TRACKS,
		     'scenes'   : Launchpad.NUM_SCENES,
		     'instance' : 1 };

    if(typeof options === 'object')
    {
	for(var option in options)
	{
	    this.options[option] = options[option];
	}
    }
}

/**\fn Launchpad.LaunchpadController.prototype.send_midi
 *
 * Sends midi to the midi output defined at midi_instance
 *
 * @param status status byte
 * @param data1 first data byte
 * @param data2 second data byte
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.send_midi = function(status, data1, data2)
{
    try
    {
	host.getMidiOutPort(this.midi_instance).sendMidi(status, data1, data2);
    }
    catch(e)
    {

    }

}
