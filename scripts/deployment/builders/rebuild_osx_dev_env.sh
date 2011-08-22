#!/bin/bash

OSX_DIR="$(cd `dirname $0` && pwd)/osx"
CONFIG_DIR="$OSX_DIR/config"
VERIFIERS_DIR="$(cd "$OSX_DIR/../../verifiers" && pwd)"

"$VERIFIERS_DIR/verify_system_packages.py"

# exit if any errors occurred while verifying the system packages
if [ $? -ne 0 ]; then
    printf "\n>> Unable to build virtualenv packages until system package dependencies have been resolved\n"
    exit -1
fi

source "$OSX_DIR/ensure_osx_config_files_exist.sh"

source "$CONFIG_DIR/user.config"

echo $SUDO_PASSWORD | sudo -S "$OSX_DIR/rebuild_osx_system_env.sh"

# continue if no errors occurred while rebuilding the system packages
if [ $? -eq 0 ]; then
    "$OSX_DIR/rebuild_rsr_virtualenv.sh"
else
    printf "\n>> Unable to create virtualenv due to errors above\n"
fi