/**
 * Copyright 2015 Alan Drees
 *
 * Purpose:
 *  Implementation of the LaunchpadIO object for handling the
 *  interfacing with the launchpads themselves
 *
 * Dependencies:
 */

var Launchpad = Launchpad || {};


/**\fn Launchpad.LaunchpadIO
 *
 * LaunchpadIO constructor object
 *
 * @param options (object) options object to set the options of the controller for
 * @param grid_x (integer) physical launchpad position horizontally
 * @param grid_y (integer) physical launchpad position vertically
 * @param midi_in (integer) midi IO input to use (OPTIONAL)
 * @param midi_out (integer) midi IO output to use (OPTIONAL)
 *
 * @returns None
 */


Launchpad.LaunchpadIO = function(options, grid_x, grid_y, lmidi_in, midi_out )
{
    if(typeof midi_in === 'undefined'){var midi_in = options.layout_order[grid_x][grid_y][0];}

    if(typeof midi_out === 'undefined'){var midi_out = options.layout_order[grid_x][grid_y][1];}

    this.set_options(options);

    this.midi_in = midi_in -1;
    this.midi_out = midi_out - 1;
    this.grid_x = grid_x;
    this.grid_y = grid_y;

    this.ctrl = {};


    /**
     * Cache for LEDs needing to be updated, which is used so we can determine if we want to send the LEDs using the
     * optimized approach or not, and to send only the LEDs that has changed.
     */

    this.pendingLEDs = new Array(80);
    this.activeLEDs = new Array(80);

    this.force_optimized_flush = false;
}


/**\fn Launchpad.LaunchpadIO.prototype.init
 *
 * Initialization function
 *
 * @param launchpad_controller (LaunchpadControlObject) launchpad controller object which implements a midi in function
 *
 * @Returns None
 */

Launchpad.LaunchpadIO.prototype.init = function(launchpad_controller)
{
    var self = this;

    this.ctrl = launchpad_controller

    host.getMidiInPort(this.midi_in).setMidiCallback(function(status, data1, data2){self.midi_callback(status, data1, data2);});

    this.resetDevice();

    this.setGridMappingMode();

    this.enableAutoFlashing();
}


/**\fn Launchpad.LaunchpadIO.prototype.clear
 *
 * Clear all the LEDs
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadIO.prototype.clear = function()
{
    for(var i=0; i < 80; i++)
    {
	this.pendingLEDs[i] = Launchpad.Colour.OFF;
    }
}


/**\fn Launchpad.LaunchpadController.prototype.resetDevice
 *
 * send a message to the device to reset the whole unit
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadIO.prototype.resetDevice = function()
{
    this.send_midi(0xB0,
		   0,
		   0);

    this.clear();

    this.flushLEDs();
}


/**\fn Launchpad.LaunchpadIO.prototype.enableAutoFlashing
 *
 * Enable device-handled flashing (minimizes the MIDI traffic on the bus)
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadIO.prototype.enableAutoFlashing = function()
{
    this.send_midi(0xB0,
		   0,
		   0x28);
}


/**\fn Launchpad.LaunchpadIO.prototype.setGridMappingMode
 *
 * This sets the grid mapping mode between the drum pad mode or the grid mode (in this case the grid mode
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadIO.prototype.setGridMappingMode = function()
{
    this.send_midi(0xB0,
		   0,
		   1);
}


/**\fn Launchpad.LaunchpadIO.prototype.setGridMappingMode
 *
 * This sets the grid mapping mode between the drum pad mode or the grid mode (in this case the grid mode
 *
 * @param None
 *
 * @returns None
 */

Launchpad.LaunchpadIO.prototype.setDrumMappingMode = function()
{
    this.send_midi(0xB0,
		   0,
		   1);
}


/**\fn Launchpad.LaunchpadIO.prototype.setDutyCycle
 *
 * Sets the LED duty cycle by passing a numerator and denominator
 *
 * @param numerator duty cycle numerator
 * @param denominator duty cycle denominator
 *
 * @returns None
 */

Launchpad.LaunchpadIO.prototype.setDutyCycle = function(numerator, denominator)
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


/**\fn Launchpad.LaunchpadIO.prototype.midi_callback
 *
 * Midi callback wrapper to handle midi input to be passed to handler function
 *
 * @param status (integer) MIDI status byte
 * @param data1 (integer) MIDI data1 byte
 * @param data2 (integer) MIDI data2 byte
 *
 * @returns None
 */

Launchpad.LaunchpadIO.prototype.midi_callback = function(status, data1, data2)
{
    if(typeof this.ctrl.onMidi === 'function')
    {
	this.ctrl.onMidi(status,
			 data1,
			 data2,
			 this.grid_x,
			 this.grid_y);
    }
}


/**\fn Launchpad.LaunchpadIO.prototype.send_midi
 *
 * Sends midi to the designated midi_out
 *
 * @param status (integer) status byte
 * @param data1 (integer) first data byte
 * @param data2 (integer) second data byte
 *
 * @returns None
 */

Launchpad.LaunchpadIO.prototype.send_midi = function(status, data1, data2)
{
    try
    {
	host.getMidiOutPort(this.midi_out).sendMidi(status, data1, data2);
    }
    catch(e)
    {

    }
}
