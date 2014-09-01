/**
 * Copyright 2014 Alan Drees
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
 * LaunchpadController consutructor.
 * 
 * @param options options object to set the options of the controller for
 *
 * @returns None
 */

Launchpad.LaunchpadController = function(options)
{
    if(typeof options === 'object')
    {
	//this.set_options(options);
    }

    this.options = {};

    this.options.tracks = 8;
    this.options.sends  = 8;
    this.options.scenes = 8;

    this.arm = initArray(0, 8);
    this.isSelected = initArray(0, 8);
    this.trackExists = initArray(0, 8);
    
    this.gridPage = new Launchpad.GridPage(this);

    this.hasContent = initArray(0, 64);
    this.isPlaying = initArray(0, 64);
    this.isRecording = initArray(0, 64);
    this.isQueued = initArray(0, 64);

    this.activePage = {};

    this.logoPhase = 0;
    this.showStealthascopeLogo = true;

    this.noteOn = initArray(false, 128);

    /** Cache for LEDs needing to be updated, which is used so we can determine if we want to send the LEDs using the
     *  optimized approach or not, and to send only the LEDs that has changed.
     */

    this.pendingLEDs = new Array(80);
    this.activeLEDs = new Array(80);

    console.log("Launchpad object created");
}


/**\fn Launchpad.LaunchpadController.prototype.init
 * 
 * Initalization function
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.init = function()
{
    var self = this;

    host.getMidiInPort(0).setMidiCallback(function(status, data1, data2){self.onMidi(status, data1, data2);});

    noteInput = host.getMidiInPort(0).createNoteInput("Launchpad", "80????", "90????");
    noteInput.setShouldConsumeEvents(false);

    transport = host.createTransportSection();

    trackBank = host.createMainTrackBankSection(this.options.tracks, this.options.sends, this.options.scenes);

    for(var t = 0; t < Launchpad.NUM_TRACKS; t++)
    {
	var track = trackBank.getTrack(t);

	var clipLauncher = track.getClipLauncher();

	clipLauncher.addHasContentObserver(this.getGridObserverFunc(t, self.hasContent));
	clipLauncher.addIsPlayingObserver(this.getGridObserverFunc(t, self.isPlaying));
	clipLauncher.addIsRecordingObserver(this.getGridObserverFunc(t, self.isRecording));
	clipLauncher.addIsQueuedObserver(this.getGridObserverFunc(t, self.isQueued));

	track.addIsSelectedObserver(this.getTrackObserverFunc(t, self.isSelected));
    }

    trackBank.addCanScrollTracksUpObserver(function(canScroll)
					   {
					       self.gridPage.canScrollTracksUp = canScroll;
					   });
    

    trackBank.addCanScrollTracksDownObserver(function(canScroll)
					     {
						 self.gridPage.canScrollTracksDown = canScroll;
					     });

    trackBank.addCanScrollScenesUpObserver(function(canScroll)
					   {
					       self.gridPage.canScrollScenesUp = canScroll;
					   });

    trackBank.addCanScrollScenesDownObserver(function(canScroll)
					     {
						 self.gridPage.canScrollScenesDown = canScroll;
					     });

    cursorTrack = host.createCursorTrackSection(0, 0);

    this.resetDevice();
    this.setGridMappingMode();
    this.enableAutoFlashing();
    this.animateLogo();
    this.setActivePage(this.gridPage);

    this.updateNoteTranlationTable();

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
	this.updateNoteTranlationTable();

	// Update indications in the app
	for(var p=0; p<8; p++)
	{
            var track = trackBank.getTrack(p);
            track.getClipLauncher().setIndication(this.activePage == this.gridPage);
	}
    }
}


/**\fn Launchpad.LaunchpadController.prototype.getTrackObserverFunc
 * 
 * 
 *
 * @param track
 * @param varToStore
 * 
 * @returns None
 */

Launchpad.LaunchpadController.prototype.getTrackObserverFunc = function(track, varToStore)
{
    return function(value)
    {
	varToStore[track] = value;
    }
}


/**\fn Launchpad.LaunchpadController.prototype.getGridObserverFunc
 * 
 *
 *
 * @param track
 * @param varToStore
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.getGridObserverFunc = function(track, varToStore)
{
    return function(scene, value)
    {
	varToStore[scene*8 + track] = value;
    }
}


/**\fn Launchpad.LaunchpadController.prototype.animateLogo
 * 
 * 
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

    host.scheduleTask(function(){self.animateLogo()}, null, 30);
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
    this.resetDevice();
}


/**\fn Launchpad.LaunchpadController.prototype.resetDevice
 * 
 * 
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.resetDevice = function()
{
    sendMidi(0xB0, 0, 0);

    for(var i=0; i<80; i++)
    {
	this.pendingLEDs[i] = 0;
    }

    this.flushLEDs();
}


/**\fn Launchpad.LaunchpadController.prototype.enableAutoFlashing
 * 
 *
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.enableAutoFlashing = function()
{
    sendMidi(0xB0, 0, 0x28);
}


/**\fn Launchpad.LaunchpadController.prototype.setGridMappingMode
 * 
 *
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setGridMappingMode = function()
{
    sendMidi(0xB0, 0, 1);
}


/**\fn Launchpad.LaunchpadController.prototype.setDutyCycle
 * 
 *
 *
 * @param numerator
 * @param denominator
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setDutyCycle = function(numerator, denominator)
{
    if (numerator < 9)
    {
	sendMidi(0xB0, 0x1E, 16 * (numerator - 1) + (denominator - 3));
    }
    else
    {
	sendMidi(0xB0, 0x1F, 16 * (numerator - 9) + (denominator - 3));
    }
}


/**\fn Launchpad.LaunchpadController.prototype.updateNoteTranlationTable
 * 
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.updateNoteTranlationTable = function()
{

    var table = initArray(-1, 128);

    for(var i=0; i<128; i++)
    {
	var y = i >> 4;
	var x = i & 0xF;

	if (x < 8 && this.activePage.shouldKeyBeUsedForNoteInport(x, y))
	{
            table[i] = activeNoteMap.cellToKey(x, y);
	}
    }

    noteInput.setKeyTranslationTable(table);

}


/**\fn Launchpad.LaunchpadController.prototype.onMidi
 * 
 * Callback function to be called when midi input is detected
 *
 * @param status
 * @param data1
 * @param data2
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
		this.setActivePage(this.gridPage);
		this.gridPage.setTempMode(Launchpad.TEMPMODE.SCENE);
            }
            else 
	    {
		this.gridPage.setTempMode(Launchpad.TEMPMODE.OFF);
	    }

            break;

        case Launchpad.TopButton.USER1:
	    console.log("USER1");
            break;

        case Launchpad.TopButton.USER2:
	    console.log("USER2");
            break;

        case Launchpad.TopButton.MIXER:
	    console.log("MIXER");
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
    this.clear();

    var left_offset = 2;
    var right_limit = 7;

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
	this.setCellLED(right_limit - left_offset,i,c);
    }

    //bottom
    for(var i = left_offset; i < right_limit - 1; i++){
	this.setCellLED(i, 7, c);
    }
}


/**\fn Launchpad.LaunchpadController.prototype.setTopLED
 * 
 *
 * @param index
 * @param colour
 * 
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setTopLED = function(index, colour)
{
    this.pendingLEDs[Launchpad.LED.TOP + index] = colour;
}


/**\fn Launchpad.LaunchpadController.prototype.setRightLED
 * 
 *
 *
 * @param index
 * @param colour
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setRightLED = function(index, colour)
{
    this.pendingLEDs[Launchpad.LED.SCENE + index] = colour;
}


/**\fn Launchpad.LaunchpadController.prototype.setCellLED
 * 
 *
 *
 * @param column
 * @param row
 * @param colour
 *
 * @returns None
 */

Launchpad.LaunchpadController.prototype.setCellLED = function(column, row, colour)
{
    var key = row * 8 + column;

    this.pendingLEDs[key] = colour;
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
	// send using channel 3 optimized mode
	for(var i = 0; i<80; i+=2)
	{
	    sendMidi(0x92, this.pendingLEDs[i], this.pendingLEDs[i+1]);
	    this.activeLEDs[i] = this.pendingLEDs[i];
	    this.activeLEDs[i+1] = this.pendingLEDs[i+1];
	}
	
	sendMidi(0xB0, 104 + 7, this.activeLEDs[79]); // send dummy message to leave optimized mode
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
		    sendMidi(0x90, row*16 + column, colour);
		}
		else if (i < 72)    // Right buttons
		{
		    sendMidi(0x90, 8 + (i - 64) * 16, colour);
		}
		else    // Top buttons
		{
		    sendMidi(0xB0, 104 + (i - 72), colour);
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

    for(var i=0; i<text.length; i++)
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
