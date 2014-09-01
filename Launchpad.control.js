
loadAPI(1);

host.defineController("loridcon", "Launchpad-stripdown", "0.0", "91EC79C0-402F-45D1-B89D-863984C2419D");
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

var console = {};

console.log = function(string)
{
    println(string);
}

load("launchpad_controller_object.js");
load("launchpad_constants.js");
load("launchpad_grid.js");

var lp = new Launchpad.LaunchpadController({});

function init()
{
    lp.init();
}

function exit()
{
    lp.exit();
}

function flush()
{
    lp.flush();
}

















