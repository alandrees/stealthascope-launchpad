
loadAPI(1);

host.defineController("Novation", "Launchpad", "1.0", "DC7C601D-C6D9-4627-875C-D0AA527BA73A");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Launchpad"], ["Launchpad"]);
host.addDeviceNameBasedDiscoveryPair(["Launchpad S"], ["Launchpad S"]);

for(var i=1; i<20; i++)
{
   var name = i.toString() + "- Launchpad";
   host.addDeviceNameBasedDiscoveryPair([name], [name]);
   host.addDeviceNameBasedDiscoveryPair(["Launchpad MIDI " + i.toString()], ["Launchpad MIDI " + i.toString()]);
   host.addDeviceNameBasedDiscoveryPair(["Launchpad S " + i.toString()], ["Launchpad S " + i.toString()]);
   host.addDeviceNameBasedDiscoveryPair(["Launchpad S MIDI " + i.toString()], ["Launchpad S MIDI " + i.toString()]);
}

if(host.platformIsLinux())
{
	for(var i=1; i<16; i++)
	{
	   host.addDeviceNameBasedDiscoveryPair(["Launchpad S " + + i.toString() + " MIDI 1"], ["Launchpad S " + + i.toString() + " MIDI 1"]);
	}
}

var TempMode =
{
   OFF:-1,
   VOLUME:0,
   PAN:1,
   SEND_A:2,
   SEND_B:3,
   TRACK:4,
   SCENE:5,
   USER1:6,
   USER2:7,
   USER3:8
};

load("launchpad_constants.js");
load("launchpad_page.js");
load("launchpad_notemap.js");
load("launchpad_grid.js");
load("launchpad_keys.js");
load("launchpad_step_sequencer.js");

var activePage = null;

function setActivePage(page)
{
   var isInit = activePage == null;

   if (page != activePage)
   {
      activePage = page;
      if (!isInit)
      {
         host.showPopupNotification(page.title);
      }

      updateNoteTranlationTable();
      updateVelocityTranslationTable();

      // Update indications in the app
      for(var p=0; p<8; p++)
      {
         var track = trackBank.getTrack(p);
         track.getClipLauncher().setIndication(activePage == gridPage);
      }
   }
}


var TrackModeColumn =
{
   STOP:0,
   SELECT:1,
   MUTE:2,
   SOLO:3,
   ARM:4,
   RETURN_TO_ARRANGEMENT:7
};

var TEMPMODE = -1;

var IS_EDIT_PRESSED = false;
var IS_RECORD_PRESSED = false;

var volume = initArray(0, 8);
var pan = initArray(0, 8);
var mute = initArray(0, 8);
var solo = initArray(0, 8);
var arm = initArray(0, 8);
var isSelected = initArray(0, 8);
var trackExists = initArray(0, 8);
var sendA = initArray(0, 8);
var sendB = initArray(0, 8);
var vuMeter = initArray(0, 8);
var masterVuMeter = 0;

var userValue = initArray(0, 24);

var hasContent = initArray(0, 64);
var isPlaying = initArray(0, 64);
var isRecording = initArray(0, 64);
var isQueued = initArray(0, 64);

function getTrackObserverFunc(track, varToStore)
{
   return function(value)
   {
      varToStore[track] = value;
   }
}

function getGridObserverFunc(track, varToStore)
{
   return function(scene, value)
   {
      varToStore[scene*8 + track] = value;
   }
}

var noteOn = initArray(false, 128);

function init()
{
   host.getMidiInPort(0).setMidiCallback(onMidi);

   noteInput = host.getMidiInPort(0).createNoteInput("Launchpad", "80????", "90????");
   noteInput.setShouldConsumeEvents(false);

   transport = host.createTransportSection();

   trackBank = host.createMainTrackBankSection(NUM_TRACKS, NUM_SENDS, NUM_SCENES);

   for(var t=0; t<NUM_TRACKS; t++)
   {
      var track = trackBank.getTrack(t);

      track.getVolume().addValueObserver(8, getTrackObserverFunc(t, volume));
      track.getPan().addValueObserver(8, getTrackObserverFunc(t, pan));
      track.getSend(0).addValueObserver(8, getTrackObserverFunc(t, sendA));
      track.getSend(1).addValueObserver(8, getTrackObserverFunc(t, sendB));
      track.getMute().addValueObserver(getTrackObserverFunc(t, mute));
      track.getSolo().addValueObserver(getTrackObserverFunc(t, solo));
      track.getArm().addValueObserver(getTrackObserverFunc(t, arm));
      track.exists().addValueObserver(getTrackObserverFunc(t, trackExists));

      var clipLauncher = track.getClipLauncher();

      clipLauncher.addHasContentObserver(getGridObserverFunc(t, hasContent));
      clipLauncher.addIsPlayingObserver(getGridObserverFunc(t, isPlaying));
      clipLauncher.addIsRecordingObserver(getGridObserverFunc(t, isRecording));
      clipLauncher.addIsQueuedObserver(getGridObserverFunc(t, isQueued));

      track.addVuMeterObserver(7, -1, true, getTrackObserverFunc(t, vuMeter));
      track.addIsSelectedObserver(getTrackObserverFunc(t, isSelected));
   }

   trackBank.addCanScrollTracksUpObserver(function(canScroll)
   {
      gridPage.canScrollTracksUp = canScroll;
   });

   trackBank.addCanScrollTracksDownObserver(function(canScroll)
   {
      gridPage.canScrollTracksDown = canScroll;
   });

   trackBank.addCanScrollScenesUpObserver(function(canScroll)
   {
      gridPage.canScrollScenesUp = canScroll;
   });

   trackBank.addCanScrollScenesDownObserver(function(canScroll)
   {
      gridPage.canScrollScenesDown = canScroll;
   });
   cursorTrack = host.createCursorTrackSection(0, 0);
   cursorTrack.addNoteObserver(seqPage.onNotePlay);

   masterTrack = host.createMasterTrackSection(0);
   masterTrack.addVuMeterObserver(8, -1, true, function(level)
   {
      masterVuMeter = level;
   });

   userControls = host.createUserControlsSection(24);

   for(var u=0; u<24; u++)
   {
      var control = userControls.getControl(u);

      control.addValueObserver(8, getTrackObserverFunc(u, userValue));
      control.setLabel("U" + (u+1));
   }

   cursorClip = host.createCursorClipSection(SEQ_BUFFER_STEPS, 128);
   cursorClip.addStepDataObserver(seqPage.onStepExists);
   cursorClip.addPlayingStepObserver(seqPage.onStepPlay);
   cursorClip.scrollToKey(0);

   resetDevice();
   setGridMappingMode();
   enableAutoFlashing();
   setActivePage(gridPage);

   updateNoteTranlationTable();
   updateVelocityTranslationTable();

   animateLogo();
}

function animateLogo()
{
   if (logoPhase > 7)
   {
      setDutyCycle(2, 6);
      return;
   }
   else if (logoPhase > 6)
   {
      showBitwigLogo = false;
      var i = 0.5 - 0.5 * Math.cos(logoPhase * Math.PI);
      setDutyCycle(Math.floor(1 + 5 * i), 18);
   }
   else
   {
      var i = 0.5 - 0.5 * Math.cos(logoPhase * Math.PI);
      setDutyCycle(Math.floor(1 + 15 * i), 18);
   }

   logoPhase += 0.2;

   host.scheduleTask(animateLogo, null, 30);
}

var logoPhase = 0;
var showBitwigLogo = true;

function exit()
{
   resetDevice();
}

function resetDevice()
{
   sendMidi(0xB0, 0, 0);

   for(var i=0; i<80; i++)
   {
      pendingLEDs[i] = 0;
   }
   flushLEDs();
}

function enableAutoFlashing()
{
   sendMidi(0xB0, 0, 0x28);
}

function setGridMappingMode()
{
   sendMidi(0xB0, 0, 1);
}

function setDutyCycle(numerator, denominator)
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

function updateNoteTranlationTable()
{
   //println("updateNoteTranlationTable");
   var table = initArray(-1, 128);

   for(var i=0; i<128; i++)
   {
      var y = i >> 4;
      var x = i & 0xF;

      if (x < 8 && activePage.shouldKeyBeUsedForNoteInport(x, y))
      {
         table[i] = activeNoteMap.cellToKey(x, y);
      }
   }

   noteInput.setKeyTranslationTable(table);
}

function updateVelocityTranslationTable()
{
   var table = initArray(seqPage.velocity, 128);
   table[0] = 0;

   noteInput.setVelocityTranslationTable(table);
}

function onMidi(status, data1, data2)
{
	 //printMidi(status, data1, data2);

   if (MIDIChannel(status) != 0) return;

   if (isChannelController(status))
   {
      var isPressed = data2 > 0;

      switch(data1)
      {
         case TopButton.SESSION:
            if (isPressed)
            {
               setActivePage(gridPage);
               gridPage.setTempMode(TempMode.SCENE);
            }
            else gridPage.setTempMode(TempMode.OFF);
            break;

         case TopButton.USER1:
            if (isPressed)
            {
               setActivePage(keysPage);
            }
            break;

         case TopButton.USER2:
            if (!isPressed)
            {
               setActivePage(seqPage);
            }

            IS_EDIT_PRESSED = isPressed;

            break;

         case TopButton.MIXER:
            activePage.onShift(isPressed);
            break;

         case TopButton.CURSOR_LEFT:
            activePage.onLeft(isPressed);
            break;

         case TopButton.CURSOR_RIGHT:
            activePage.onRight(isPressed);
            break;

         case TopButton.CURSOR_UP:
            activePage.onUp(isPressed);
            break;

         case TopButton.CURSOR_DOWN:
            activePage.onDown(isPressed);
            break;
      }
   }

   if (isNoteOn(status) || isNoteOff(status, data2))
   {
      var row = data1 >> 4;
      var column = data1 & 0xF;

      if (column < 8)
      {
         activePage.onGridButton(row, column, data2 > 0);
      }
      else
      {
         activePage.onSceneButton(row, data2 > 0);
      }
   }
}

function clear()
{
   for(var i=0; i<80; i++)
   {
      pendingLEDs[i] = Colour.OFF;
   }
}

function flush()
{
   if (showBitwigLogo)
   {
      drawBitwigLogo();
   }
   else
   {
      activePage.updateOutputState();
   }

   flushLEDs();
}

function drawBitwigLogo()
{
   clear();

   var c = mixColour(2, 1, false);

   for(var x=2;x<=5; x++) setCellLED(x, 2, c);
   for(var x=1;x<=6; x++) setCellLED(x, 3, c);

   setCellLED(1, 4, c);
   setCellLED(2, 4, c);
   setCellLED(5, 4, c);
   setCellLED(6, 4, c);
}

function setTopLED(index, colour)
{
   pendingLEDs[LED.TOP + index] = colour;
}

function setRightLED(index, colour)
{
   pendingLEDs[LED.SCENE + index] = colour;
}

function setCellLED(column, row, colour)
{
   var key = row * 8 + column;

   pendingLEDs[key] = colour;
}

/** Cache for LEDs needing to be updated, which is used so we can determine if we want to send the LEDs using the
 * optimized approach or not, and to send only the LEDs that has changed.
 */

var pendingLEDs = new Array(80);
var activeLEDs = new Array(80);

function flushLEDs()
{
   var changedCount = 0;

   for(var i=0; i<80; i++)
   {
      if (pendingLEDs[i] != activeLEDs[i]) changedCount++;
   }

   if (changedCount == 0) return;

   //println("Repaint: " + changedCount + " LEDs");

   if (changedCount > 30)
   {
      // send using channel 3 optimized mode
      for(var i = 0; i<80; i+=2)
      {
         sendMidi(0x92, pendingLEDs[i], pendingLEDs[i+1]);
         activeLEDs[i] = pendingLEDs[i];
         activeLEDs[i+1] = pendingLEDs[i+1];
      }
      sendMidi(0xB0, 104 + 7, activeLEDs[79]); // send dummy message to leave optimized mode
   }
   else
   {
      for(var i = 0; i<80; i++)
      {
         if (pendingLEDs[i] != activeLEDs[i])
         {
            activeLEDs[i] = pendingLEDs[i];

            var colour = activeLEDs[i];

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

/* Format text into a bit pattern that can be displayed on 4-pixels height */

function textToPattern(text)
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
