
/*
*  GRID PAGE
*
* */
if(typeof Launchpad.Page === 'undefined')
{
    load('launchpad_page.js');
}

Launchpad.GridPage = function(launchpad)
{
    Launchpad.Page.apply(this, [launchpad]);
    this.mixerAlignedGrid = true;
    this.canScrollTracksUp = false;
    this.canScrollTracksDown = false;
    this.canScrollScenesUp = false;
    this.canScrollScenesDown = false;
    this.title = "Clip Launcher";
    this.temp_mode = Launchpad.TEMPMODE.OFF;
    this.isRecordPressed = false;
    this.isEditPressed = false;

    console.log("GridPage Object Created");
}

Launchpad.GridPage.prototype = Launchpad.Page.prototype;
Launchpad.GridPage.prototype.constructor = Launchpad.GridPage;

Launchpad.GridPage.prototype.updateOutputState = function()
{
    this.controller.clear();

    this.canScrollUp = this.mixerAlignedGrid ? this.canScrollScenesUp : this.canScrollTracksUp;
    this.canScrollDown = this.mixerAlignedGrid ? this.canScrollScenesDown : this.canScrollTracksDown;
    this.canScrollLeft = !this.mixerAlignedGrid ? this.canScrollScenesUp : this.canScrollTracksUp;
    this.canScrollRight = !this.mixerAlignedGrid ? this.canScrollScenesDown : this.canScrollTracksDown;

    this.updateScrollButtons();
    this.updateGrid();

    this.controller.setTopLED(4,
			      this.temp_mode == Launchpad.TEMPMODE.SCENE
			      ? Launchpad.Colour.GREEN_FULL
			      : (this.temp_mode == Launchpad.TEMPMODE.OFF
				 ? Launchpad.Colour.YELLOW_FULL
				 : Launchpad.Colour.OFF));
    
    this.controller.setTopLED(7, 
			      this.mixerAlignedGrid ? Launchpad.Colour.RED_FULL : Launchpad.Colour.RED_LOW);
};

Launchpad.GridPage.prototype.onSceneButton = function(row, isPressed)
{
   if (isPressed)
   {
      switch(row)
      {
         case MixerButton.VOLUME:
            this.setTempMode(Launchpad.TEMPMODE.VOLUME);
            break;

         case MixerButton.PAN:
            this.setTempMode(Launchpad.TEMPMODE.PAN);
            break;

         case MixerButton.SEND_A:
            this.setTempMode(Launchpad.TEMPMODE.SEND_A);
            break;

         case MixerButton.SEND_B:
            this.setTempMode(Launchpad.TEMPMODE.SEND_B);
            break;

         case MixerButton.STOP:
            this.setTempMode(Launchpad.TEMPMODE.USER1);
            break;

         case MixerButton.TRK_ON:
            this.setTempMode(Launchpad.TEMPMODE.USER2);
            break;

         case MixerButton.SOLO:
            this.setTempMode(Launchpad.TEMPMODE.USER3);
            break;

         case MixerButton.ARM:
            this.setTempMode(Launchpad.TEMPMODE.TRACK);
            break;
      }
   }
   else
   {
      this.setTempMode(Launchpad.TEMPMODE.OFF);
   }
};

Launchpad.GridPage.prototype.onLeft = function(isPressed)
{
   if (isPressed)
   {
      if (this.mixerAlignedGrid) trackBank.scrollTracksUp();
      else trackBank.scrollScenesUp();
   }
};

Launchpad.GridPage.prototype.onRight = function(isPressed)
{
   if (isPressed)
   {
      if (this.mixerAlignedGrid) trackBank.scrollTracksDown();
      else trackBank.scrollScenesDown();
   }
};

Launchpad.GridPage.prototype.onUp = function(isPressed)
{
   if (isPressed)
   {
      if (this.mixerAlignedGrid) trackBank.scrollScenesUp();
      else trackBank.scrollTracksUp();
   }
};

Launchpad.GridPage.prototype.onDown = function(isPressed)
{
   if (isPressed)
   {
      if (this.mixerAlignedGrid) trackBank.scrollScenesDown();
      else trackBank.scrollTracksDown();
   }
};

Launchpad.GridPage.prototype.onGridButton = function(row, column, pressed)
{
   if (!pressed) return;

   if (this.temp_mode === Launchpad.TEMPMODE.SCENE)
   {
      trackBank.launchScene(column);
   }
   else if (this.temp_mode === Launchpad.TEMPMODE.OFF)
   {
      var track = this.mixerAlignedGrid ? column : row;
      var scene = this.mixerAlignedGrid ? row : column;

      if (this.is_record_pressed)
      {
         trackBank.getTrack(track).getClipLauncher().record(scene);
      }
      else if (this.is_edit_pressed)
      {
         trackBank.getTrack(track).getClipLauncher().showInEditor(scene);
      }
      else
      {
         trackBank.getTrack(track).getClipLauncher().launch(scene);
      }
   }
   else if (this.temp_mode === Launchpad.TEMPMODE.TRACK)
   {
      switch(column)
      {
         case TrackModeColumn.STOP:
            trackBank.getTrack(row).getClipLauncher().stop();
            break;

         case TrackModeColumn.SELECT:
            trackBank.getTrack(row).select();
            break;

         case TrackModeColumn.MUTE:
            trackBank.getTrack(row).getMute().toggle();
            break;

         case TrackModeColumn.SOLO:
            trackBank.getTrack(row).getSolo().toggle();
            break;

         case TrackModeColumn.ARM:
            trackBank.getTrack(row).getArm().toggle();
            break;

         case TrackModeColumn.RETURN_TO_ARRANGEMENT:
            trackBank.getTrack(row).getClipLauncher().returnToArrangement();
            break;
      }
   }
   else
   {
      switch(this.temp_mode)
      {
         case Launchpad.TEMPMODE.VOLUME:
            trackBank.getTrack(row).getVolume().set(column, 8);
            break;

         case Launchpad.TEMPMODE.PAN:
            trackBank.getTrack(row).getPan().set(column, 8);
            break;

         case Launchpad.TEMPMODE.SEND_A:
            trackBank.getTrack(row).getSend(0).set(column, 8);
            break;

         case Launchpad.TEMPMODE.SEND_B:
            trackBank.getTrack(row).getSend(1).set(column, 8);
            break;

         case Launchpad.TEMPMODE.USER1:
            userControls.getControl(row).set(column, 8);
            break;

         case Launchpad.TEMPMODE.USER2:
            userControls.getControl(row + 8).set(column, 8);
            break;

         case Launchpad.TEMPMODE.USER3:
            userControls.getControl(row + 16).set(column, 8);
            break;
      }
   }
};

Launchpad.GridPage.prototype.updateGrid = function()
{
   for(var t=0; t<8; t++)
   {
      this.updateTrackValue(t);
   }
};

Launchpad.GridPage.vuLevelColor = function(level)
{
   switch (level)
   {
      case 1:
         return mixColour(0, 1, false);

      case 2:
         return mixColour(0, 2, false);

      case 3:
         return mixColour(0, 3, false);

      case 4:
         return mixColour(2, 3, false);

      case 5:
         return mixColour(3, 3, false);

      case 6:
         return mixColour(3, 2, false);

      case 7:
         return mixColour(3, 0, false);
   }

   return Colour.OFF;
}

Launchpad.GridPage.prototype.updateTrackValue = function(track)
{
    if (this.temp_mode == Launchpad.TEMPMODE.TRACK)
    {
	for(var scene=5; scene<8; scene++)
	{
            this.controller.setCellLED(scene, track, Launchpad.Colour.OFF);
	}

	if (this.controller.trackExists[track])
	{
            this.controller.setCellLED(TrackModeColumn.SELECT, track, this.controller.isSelected[track] ?  Launchpad.Colour.AMBER_FLASHING : Launchpad.Colour.AMBER_LOW);
            this.controller.setCellLED(TrackModeColumn.MUTE, track, this.controller.mute[track] ? Launchpad.Colour.GREEN_LOW : Launchpad.Colour.GREEN_FULL);
            this.controller.setCellLED(TrackModeColumn.SOLO, track, this.controller.solo[track] ? Launchpad.Colour.YELLOW_FULL : Launchpad.Colour.YELLOW_LOW);
            this.controller.setCellLED(TrackModeColumn.ARM, track, this.controller.arm[track] ? Launchpad.Colour.RED_FULL : Launchpad.Colour.RED_LOW);
            this.controller.setCellLED(TrackModeColumn.STOP, track, Launchpad.Colour.OFF);
            this.controller.setCellLED(TrackModeColumn.RETURN_TO_ARRANGEMENT, track, Launchpad.Colour.OFF);
	}
	else
	{
            for(var scene=0; scene<5; scene++)
            {
		this.controller.setCellLED(scene, track, Launchpad.Colour.OFF);
            }
	}
    }
    else if (this.temp_mode == Launchpad.TEMPMODE.VOLUME)
    {
	for(var scene=0; scene<8; scene++)
	{
            var c = (this.controller.volume[track] == scene)
		? Launchpad.Colour.GREEN_FULL
		: ((this.controller.vuMeter[track] > scene))
		? Launchpad.Colour.GREEN_LOW
		: Launchpad.Colour.OFF;

            this.controller.setCellLED(scene, track, c);
	}
    }
    else
    {
	var value = 0;
	var oncolor = Launchpad.Colour.GREEN_FULL;
	var offcolor = Launchpad.Colour.OFF;

	switch (this.temp_mode)
	{
        case Launchpad.TEMPMODE.PAN:
            value = this.controller.pan[track];
            oncolor = Launchpad.Colour.AMBER_FULL;
            break;

        case Launchpad.TEMPMODE.SEND_A:
            value = this.controller.sendA[track];
            break;

        case Launchpad.TEMPMODE.SEND_B:
            value = this.controller.sendB[track];
            break;

        case Launchpad.TEMPMODE.USER1:
            value = this.controller.userValue[track];
            break;

        case Launchpad.TEMPMODE.USER2:
            value = this.controller.userValue[track + 8];
            break;
        case Launchpad.TEMPMODE.USER3:
            value = this.controller.userValue[track + 16];
            break;
	}

	var drawVal = (value > 0) ? (value + 1) : 0;

	for(var scene=0; scene<8; scene++)
	{
            this.controller.setCellLED(scene, track, (scene < drawVal) ? oncolor : offcolor);
	}
    }
};

Launchpad.GridPage.prototype.setTempMode = function(mode)
{
   if (mode == this.temp_mode) return;

   this.temp_mode = mode;

   // Update indications in the app
   for(var p=0; p<8; p++)
   {
      var track = trackBank.getTrack(p);
      track.getVolume().setIndication(mode == Launchpad.TEMPMODE.VOLUME);
      track.getPan().setIndication(mode == Launchpad.TEMPMODE.PAN);
      track.getSend(0).setIndication(mode == Launchpad.TEMPMODE.SEND_A);
      track.getSend(1).setIndication(mode == Launchpad.TEMPMODE.SEND_B);
   }
};
