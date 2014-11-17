/**
 * Copyright 2014 Alan Drees
 *
 * Purpose:
 *   Define several launchpad controller constants.  Modified from the factory Bitwig script.
 *
 * Requires:
 *
 */

var Launchpad = Launchpad || {};

Launchpad.TopButton =
{
   CURSOR_UP:104,
   CURSOR_DOWN:105,
   CURSOR_LEFT:106,
   CURSOR_RIGHT:107,
   SESSION:108,
   USER1:109,
   USER2:110,
   MIXER:111
};

Launchpad.MixerButton =
{
   VOLUME:0,
   PAN:1,
   SEND_A:2,
   SEND_B:3,
   STOP:4,
   TRK_ON:5,
   SOLO:6,
   ARM:7
};

Launchpad.mixColour = function(red, green, blink)
{
   return (blink ? 8 : 12) | red | (green * 16);
};

Launchpad.Colour = // Novation are from the UK
{
   OFF:12,
   RED_LOW:13,
   RED_FULL:15,
   AMBER_LOW:29,
   AMBER_FULL:63,
   YELLOW_FULL:62,
   YELLOW_LOW: 0x2D,
   ORANGE:39,
   LIME:0x3D,
   HEADER:Launchpad.mixColour(0,1,false),
   GREEN_LOW:28,
   GREEN_FULL:60,
   RED_FLASHING:11,
   AMBER_FLASHING:59,
   YELLOW_FLASHING:58,
   GREEN_FLASHING:56
};

Launchpad.LED =
{
   GRID:0,
   SCENE:64,
   TOP:72,

   CURSOR_UP:0,
   CURSOR_DOWN:1,
   CURSOR_LEFT:2,
   CURSOR_RIGHT:3,
   SESSION:4,
   USER1:5,
   USER2:6,
   MIXER:7,

   VOLUME:0,
   PAN:1,
   SEND_A:2,
   SEND_B:3,
   STOP:4,
   TRK_ON:5,
   SOLO:6,
   ARM:7
};

Launchpad.TEMPMODE =
{
    OFF   : -1,
    TRACK : 1,
    STOP  : 2,
    USER2 : 3,
    MIXER : 4
};

Launchpad.TRACKMODECOLUMN =
{
    STOP:0,
    SELECT:1,
    MUTE:2,
    SOLO:3,
    ARM:4,
    RETURN_TO_ARRANGEMENT:7
};

Launchpad.NUM_TRACKS = 8;
Launchpad.NUM_SENDS = 2;
Launchpad.NUM_SCENES = 8;
