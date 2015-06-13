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
