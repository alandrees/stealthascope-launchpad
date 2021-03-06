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


/**\fn Launchpad.LaunchpadController.prototype.setCellLED
 *
 * Interface method for the controller IO subsystem to manipulate the state
 * of the grid cell LEDs
 *
 * @param column (integer) column index of LED
 * @param row (integer) row index of LED
 * @param value (integer) LED value to set
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setCellLED = function(column, row, value)
{
    var output = this._map_io_object(column, row);

    column = column % Launchpad.NUM_SCENES;
    row = row % Launchpad.NUM_CHANNELS;

    output.setCellLED(column,
		      row,
		      value);
}


/**\fn Launchpad.LaunchpadController.prototype.setTopLED
 *
 * Interface method for the controller IO subsystem to manipulate the state
 * of the top (mode) LEDs
 *
 * @param index (integer) index of top-row CC to set
 * @param value (integer) value to set the LED to
 * @param ctrl (integer) controller to output to [OPTIONAL]
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setTopLED = function(index, value, ctrl)
{
    if(typeof ctrl === 'undefined'){var ctrl = 0;}

    if(this.options.shared_navigation)
    {
	for(var i = 0; i < this.launchpad_io.length; i++)
	{
	    this.launchpad_io[i].setTopLED(index, value);
	}
    }
    else
    {
	this.launchpad_io[ctrl].setTopLED(index, value);
    }
}


/**\fn Launchpad.LaunchpadController.prototype.setRightLED
 *
 * Interface method for the controller IO subsystem to manipulate the state
 * of the right-side LEDs
 *
 * @param index (integer) control index to update on the controller
 * @param value (integer) value to set the control to
 * @param ctrl (integer) controller
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setRightLED = function(index, value, ctrl)
{
    if(typeof ctrl === 'integer')
    {
	this.launchpad_io[ctrl].setRightLED(index, value);
    }
    else
    {
	for(var i = 0; i < this.launchpad_io.length; i++)
	{
	    this.launchpad_io[i].setRightLED(index, value);
	}
    }
}


/**\fn Launchpad.LaunchpadController.prototype.clear
 *
 * Interface method for the controller IO subsystem to clear an entire controller grid of values
 *
 * @param index (integer) controller index to clear [OPTIONAL]
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.clear = function(index)
{
    if(typeof index === 'undefined')
    {
	for(var i = 0; i < this.launchpad_io.length; i++)
	{
	    this.launchpad_io[i].clear();
	}
    }
    else
    {
	this.launchpad_io[i].clear();
    }
}


/**\fn Launchpad.LaunchpadController.prototype._map_io_object
 *
 * Maps grid coordinates to a particularly underlying physical controller object
 *
 * @param grid_x (integer) x-coordinate of the vector pair
 * @param grid_y (integer) y-coordinate of the vector pair
 *
 * @returns (LaunchpadIO) LaunchpadIO object representing a physical controller
 */

Launchpad.LaunchpadController.prototype._map_io_object = function(grid_x, grid_y)
{
    var ctrl_x = 0;
    var ctrl_y = 0;

    if(this.launchpad_io.length === 1)
    {
	return this.launchpad_io[0];
    }
    else
    {
	if((grid_x) % Launchpad.NUM_TRACKS == 0)
	{
	    ctrl_x = grid_x / Launchpad.NUM_TRACKS;
	}
	else
	{
	    ctrl_x = ( grid_x - ((grid_x) % Launchpad.NUM_TRACKS) ) / Launchpad.NUM_TRACKS
	}

	if((grid_y) % Launchpad.NUM_SCENES == 0)
	{
	    ctrl_y = grid_y / Launchpad.NUM_SCENES;
	}
	else
	{
	    ctrl_y = ( grid_y - ((grid_y) % Launchpad.NUM_SCENES) ) / Launchpad.NUM_SCENES
	}

	return this.io_grid_array[ctrl_x][ctrl_y];
    }
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


/**\fn Launchpad.LaunchpadController.prototype.onMidi
 *
 * Callback function to be called when midi input is detected
 *
 * @param status (integer) status byte (type/channel) of incoming message
 * @param data1 (integer) data1 byte of incoming message
 * @param data2 (integer) data2 byte of incoming message
 * @param grid_x (integer) x-index of hardware component
 * @param grid_y (integer) y-index of hardware component
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.onMidi = function(status, data1, data2, grid_x, grid_y)
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

	if (column < Launchpad.NUM_TRACKS)
	{
	    row = (row + (grid_y * Launchpad.NUM_SCENES));
	    column = (column + (grid_x * Launchpad.NUM_TRACKS));
	    this.activePage.onGridButton(row, column, data2 > 0);
	}
	else
	{
	    this.activePage.onSceneButton(row + (grid_x * Launchpad.NUM_TRACKS), data2 > 0);
	}
    }
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
