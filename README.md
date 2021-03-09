# DRL-tools



## Setup Raspberry Pi

### Install OS

* install Raspberry Pi OS Lite from https://www.raspberrypi.org/software/operating-systems/#raspberry-pi-os-32-bit (Version from 11-01-21)

* For headless setup:

  * For headless setup: add `wpa_supplicant.conf`to boot partition including wifi credentials

    ```
    ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
    update_config=1
    country=DE
    
    network={
        ssid="«your_SSID»"
        psk="«your_PSK»"
        key_mgmt=WPA-PSK
    }
    ```

  * place empty file name `ssh` in boot partition

  * connect with ssh: `ssh pi@raspberrypi.local`

### Setup Reseed 2 Mic Microphone Hat

* update apt: `sudo apt-get update` and `sudo apt-get upgrade`. (kernel 5.10)

* `sudo reboot`

* install git: `sudo apt-get install git`

* see https://github.com/HinTak/seeed-voicecard/

  ```
  git clone https://github.com/HinTak/seeed-voicecard/
  cd seeed-voicecard
  git checkout v5.9
  sudo ./install.sh
  sudo reboot
  ```

### Setup Raspiaudio Microphone hat

* update apt: `sudo apt-get update` then install git: `sudo apt-get install git`

* Reboot `sudo reboot`

* see https://forum.raspiaudio.com/t/ultra-installation-guide/21

  ```
  git clone https://github.com/RASPIAUDIO/WM8960-Audio-HAT.git
  cd WM8960-Audio-HAT
  sudo ./install.sh
  sudo reboot
  # if installation failed, try it again after reboot
  ```

## Install Software

* install portaudio:

  * `sudo apt-get install libasound-dev`

  * download and build portaudio:

    ```
    > wget http://files.portaudio.com/archives/pa_stable_v190600_20161030.tgz
    > tar -xvzf pa_stable_v190600_20161030.tgz 
    > cd portaudio
    > ./configure
    > make
    ```

  * install dev package: `sudo apt-get install portaudio19-dev python3-all-dev`

* install pipx:

  * uninstall previous version `sudo apt-get remove pipx`
  * install pip: `sudo apt-get install python3-pip python3-venv`
  *  then pipx:`python3 -m pip install --user pipx`
  * then `python3 -m pipx ensurepath`

* install speech to text:

  * clone tools repo: `git clone https://github.com/lutzer/drl-tools`

  * install speech to text module: `pipx install ./drl-tools/modules/speech-to-text/`

  * copy redential file to home dir

  * set ENV VAR, edit `nano .bash_profile`, add:

    ```
    export GOOGLE_APPLICATION_CREDENTIALS="/home/pi/credentials.json"
    ```

* install node-red: 

  ```
  bash <(curl -sL https://raw.githubusercontent.com/node-red/linux-installers/master/deb/update-nodejs-and-nodered)
  ```

  * install speech synthesis: `sudo apt-get install festival`
  * enable projects in node-red: `cat ~/.node-red/settings.js`: set `projects.enabled = true`
  * put node-red in autostart: `sudo systemctl enable nodered.service`
  * visit browser on http://raspberrypi.local:1880 and clone project from ` https://github.com/lutzer/drl-tools-flows.git`

