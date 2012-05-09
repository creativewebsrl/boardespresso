#!/bin/bash

# DEPENDENCIES
# On UBUNTU run
# sudo apt-get install git-core build-essential curl openssl libssl-dev 

function usage
{
    echo "Usage: $0 newProjectDir nodejsGitTag"
    echo "e.g. $0 fooProj v0.6.9"
}

if [ $# -ne 2 -o $# -eq 0 -o "$1" == "-h" ]; then
usage
  exit 1
fi

ORIG_DIR=`pwd`
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_PATH=$1
NODE_VERSION=$2

if [ ! -e $PROJECT_PATH ]; then
    mkdir $PROJECT_PATH
fi

cd $PROJECT_PATH

echo "Installing latest nvm (Node Version Manager)"
git clone git://github.com/creationix/nvm.git .nvm
source .nvm/nvm.sh

echo "Installing Node.js $NODE_VERSION"
nvm install $NODE_VERSION
nvm use $NODE_VERSION
nvm alias default $NODE_VERSION

echo "Installing local dependencies"
npm install

nvm deactivate

cd $ORIG_DIR

echo 
echo "############################################################"
echo 
echo "Done. You can enter your virtual environment with"
echo "=> cd $1 && source .nvm/nvm.sh"
echo 
echo "You can then start the server with"
echo "=> node app/app.js"
echo 
echo "Before you do that, go to app/config/, find each file ending"
echo "with .example.js, copy them to a non .example counterpart"
echo "and change the configurations found inside."
echo 
echo "Notice that you need a running mongodb database"
echo "See http://www.mongodb.org/display/DOCS/Quickstart"
echo
echo "############################################################"
