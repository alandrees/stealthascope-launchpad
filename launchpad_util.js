/**
 * Copyright 2015 Alan Drees
 *
 * Purpose:
 *  Implement utility functions for use with the Launchpad objects
 *
 * Dependencies:
 */

var Launchpad = Launchpad || {};


/**\fn Launchpad.create_2d_array
 *
 * Create an empty 2d array of a given size
 *
 * @param width (integer) width of the array
 * @param height (integer) height of the array
 * @param init (variable) function or value/object to initialize the array with
 *
 * @returns (array) 2d array built and initialized
 */

Launchpad.create_2d_array = function (width, height, init) {
    if(typeof init === 'undefined'){var init = 0;}

    var arr = new Array(width);

    var i = 0;
    var j = 0;

    for(i = 0; i < width; i++)
    {
	arr[i] = new Array(height);
    }

    for(i = 0;i < width; i++)
    {
	for(j = 0;j < height; j++)
	{
	    if(typeof init === 'function')
	    {
		arr[i][j] = init.call(init, i, j);
	    }
	    else
	    {
		arr[i][j] = init;
	    }
	}
    }

    return arr;
}
