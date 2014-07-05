#!/bin/bash
# Script Name: AtoMiC Sick Beard installer
# Author: Anand Subramanian
# Publisher: http://www.htpcBeginner.com
# Version: 1 (October 03, 2013) - Initial Release
# Version: 2 (April 13, 2014) - Update script to work with Trusty Tahr
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
#

# DO NOT EDIT ANYTHING UNLESS YOU KNOW WHAT YOU ARE DOING.
clear
echo 'Version: 2.0 (April 13, 2014)'
echo '--->Sick Beard installation will start soon. Please read the following carefully.'
echo '1. The script has been confirmed to work on Ubuntu and other Ubuntu based distros, including Mint, Kubuntu, Lubuntu, and Xubuntu.'
echo '2. While several testing runs identified no known issues, htpcBeginner.com or the author cannot be held accountable for any problems that might occur due to the script.'
echo '3. If you did not run this script with sudo, you maybe asked for your root password during installation.'
echo '4. If git and python are not installed they will be installed during the process. These packages are required for Sick Beard to run.'

echo

read -p "Press y/Y and enter to AGREE and continue with the installation or any other key to exit : "
RESP=${REPLY,,}
if [ "$RESP" != "y" ]
then
	echo 'So you chickened out. May be you will try again later.'
	echo
	exit 0
fi

echo 

read -p "Enter the username of the user you want to run Sick Beard as. Typically, this is your username (IMPORTANT! Ensure correct spelling and case): "
UNAME=${REPLY,,}

if [ ! -d "/home/$UNAME" ]; then
  echo 'Bummer! You may not have entered your username correctly. Exiting now. Please rerun script.'
  echo
  exit 0
fi

echo
echo '--->Updating Packages. Please wait..'
sudo apt-get update >/dev/null 2>&1
echo

echo '--->Installing git and python...'
sudo apt-get -y install git-core python python-cheetah
echo

echo '--->Checking for previous versions of Sick Beard...'
sleep 2
sudo /etc/init.d/sickbeard* stop >/dev/null 2>&1
sudo killall sickbeard* >/dev/null 2>&1
echo '--->Any running Sick Beard processes killed'
sudo update-rc.d -f sickbeard remove >/dev/null 2>&1
sudo rm /etc/init.d/sickbeard >/dev/null 2>&1
sudo rm /etc/default/sickbeard >/dev/null 2>&1
echo '--->Existing Sick Beard init scripts removed'
sudo update-rc.d -f sickbeard remove >/dev/null 2>&1
mv /home/$UNAME/.sickbeard /home/$UNAME/.sickbeard_`date '+%m-%d-%Y_%H-%M'` >/dev/null 2>&1
echo '--->Any existing Sick Beard files were moved to /home/'$UNAME'/.sickbeard_'`date '+%m-%d-%Y_%H-%M'`
echo

echo '--->Downloading latest Sick Beard...'
sleep 2
cd /home/$UNAME
git clone git://github.com/midgetspy/Sick-Beard.git /home/$UNAME/.sickbeard
chmod 775 -R /home/$UNAME/.sickbeard >/dev/null 2>&1
sudo chown $UNAME: /home/$UNAME/.sickbeard >/dev/null 2>&1

echo 
cd /home/$UNAME/.sickbeard
cp -a autoProcessTV/autoProcessTV.cfg.sample autoProcessTV/autoProcessTV.cfg

echo "# COPY THIS FILE TO /etc/default/sickbeard" >> sickbeard_default
echo '--->Replacing Sick Beard APP_PATH and DATA_DIR...'
sleep 1
echo "SB_HOME=/home/"$UNAME"/.sickbeard/" >> sickbeard_default
echo "SB_DATA=/home/"$UNAME"/.sickbeard/" >> sickbeard_default
echo '--->Enabling current user ('$UNAME') to run Sick Beard...'
echo "SB_USER="$UNAME >> sickbeard_default
sudo mv sickbeard_default /etc/default/sickbeard
sudo chmod +x /etc/default/sickbeard

echo
echo '--->Copying init script...'
sleep 1
sudo cp init.ubuntu /etc/init.d/sickbeard
sudo chown $UNAME: /etc/init.d/sickbeard
sudo chmod +x /etc/init.d/sickbeard

echo '--->Updating rc.d to start Sick Beard at boot time...'
sudo update-rc.d sickbeard defaults
echo
echo '--->All done. '
echo 'Sick Beard should start within 10-20 seconds and your browser should open.'
echo 'If not you can start it using "sudo service sickbeard start" command. '
echo 'Then open http://localhost:8081 in your browser.'
echo
echo '***If this script worked for you, please visit http://www.htpcBeginner.com and like/follow us.'
echo 'Thank you for using the Sick Beard installer script from www.htpcBeginner.com.***'
echo
sudo mkdir /var/run/sickbeard >/dev/null 2>&1
sudo chown $UNAME: /var/run/sickbeard >/dev/null 2>&1
/etc/init.d/sickbeard start