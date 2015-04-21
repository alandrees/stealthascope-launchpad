novation-launchpad
==================

Support for Novation Launchpad controller series in Bitwig Studio.

This stripped-down version has been designed for my aleph controller.

There are underpinnings here which help facilitate multiple launchpads.

The branching system works like this:

Anything ending in master is part of the standalone branch.  Whereas anything ending in component-controller is designed to be used as part of another (compound script, like https://github.com/alandrees/stealthascope)

The version branches represent the latest versions for a given version of Bitwig Studio's controller API, for example:

1.0-master - standalone controller script for Bitwig Studio 1.0-1.0.15

1.0-component-controller - component controller script for Bitwig Studio 1.0-1.0.15

The master and component-controller branches are the current most recent stable versions.
