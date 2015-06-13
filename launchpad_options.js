/**
 * Copyright 2015 Alan Drees
 *
 * Purpose:
 *  Implements options structure for the stealthascope-launchpad object
 *
 * Dependencies:
 */

var Launchpad = Launchpad || {};

/*
The layout order option describes the physical layout of the novation launchpad units.

Each of the array pairs are a mapping of input/outputs in the format of [in,out].  This specifies the location for the i/o in the grid.

If you only have one unit, the layout_order parameter will only have the [1,1] unit specified.

Some examples:

single:
'layout_order'      : [[[1,1]]]

one below:
'layout_order'      : [[[1,1],[2,2]]]

one right:
'layout_order'      : [[[1,1]],
		       [[2,2]]]

group of 4:
'layout_order'      : [[[1,1],[2,2]],
		       [[3,3],[4,4]]]
*/

Launchpad.options = {'devices'           : 1,
		     'tracks'            : 8,
		     'channels'          : 8,
		     'scenes'            : 8,
		     'startupmode'       : true,
		     'shared_navigation' : true,
		     'layout_order'      : [[[1,1]]]};
