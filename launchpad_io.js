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
