
loadAPI(1);

var console = {};

console.log = function(string)
{
    println(string);
}

load("launchpad_controller_object.js");
load("launchpad_constants.js");
load("launchpad_grid.js");
load("launchpad_options.js");

host.defineController("Stealthascope", "Launchpad", "0.2", "91EC79C0-402F-45D1-B89D-863984C2419D");
host.defineMidiPorts(Launchpad.options.devices, Launchpad.options.devices);
host.addDeviceNameBasedDiscoveryPair(["Launchpad"], ["Launchpad"]);
host.addDeviceNameBasedDiscoveryPair(["Launchpad S"], ["Launchpad S"]);

for(var i = 1; i < Launchpad.options.devices; i++)
{
   var name = i.toString() + "- Launchpad";
   host.addDeviceNameBasedDiscoveryPair([name], [name]);
   host.addDeviceNameBasedDiscoveryPair(["Launchpad MIDI " + i.toString()], ["Launchpad MIDI " + i.toString()]);
   host.addDeviceNameBasedDiscoveryPair(["Launchpad S " + i.toString()], ["Launchpad S " + i.toString()]);
   host.addDeviceNameBasedDiscoveryPair(["Launchpad S MIDI " + i.toString()], ["Launchpad S MIDI " + i.toString()]);
}

if(host.platformIsLinux())
{
	for(var i = 1; i < Launchpad.options.devices; i++)
	{
	   host.addDeviceNameBasedDiscoveryPair(["Launchpad S " + + i.toString() + " MIDI 1"], ["Launchpad S " + + i.toString() + " MIDI 1"]);
	}
}

var controllers = new Array();
var icc_network = new Array();

icc_network.push(ICC.create_new_icc_network['launchpad']);


for(var i = 0; i < Launchpad.options.devices; i++)
{
    controllers[i] = new Launchpad.LaunchpadController(Launchpad.options, i + 1);
}

function init()
{
    for(var controller in controllers)
    {
	controllers[controller].init();
    }
}

function exit()
{
    for(var controller in controllers)
    {
	controllers[controller].exit();
    }
}

function flush()
{
    for(var controller in controllers)
    {
	controllers[controller].flush();
    }
}
