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

* make default sound device: `sudo raspi-config`, select System Options > Audio > wm8960-hifi-0
* edit `nano ~/.asoundrc` to allow multiple files playback:
  ```
  pcm.dmixed {
    type dmix
    ipc_key 1024
    ipc_key_add_uid 0
    slave.pcm "output"
  }
  pcm.dsnooped {
      type dsnoop
      ipc_key 1025
      slave.pcm "input"
  }
  
  pcm.!default {
    type asym
    playback.pcm {
      type plug
      slave.pcm "dmixed"
    }
    capture.pcm {
      type plug
      slave.pcm "dsnooped"
    }
  }
  
  pcm.output {
    type hw
    card 1
  }
  
  ctl.!default {
    type hw
    card 1
  }
  ```


## Install Software

* install portaudio:

  * download and build portaudio (with alsapatch):

    ```
    sudo apt-get remove libportaudio2
    sudo apt-get install libasound2-dev
    git clone -b alsapatch https://github.com/gglockner/portaudio
    cd portaudio
    ./configure && make
    sudo make install
    sudo ldconfig
    cd ..
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
  * enable projects in node-red: `nano ~/.node-red/settings.js`: set `projects.enabled = true`
  * put node-red in autostart: `sudo systemctl enable nodered.service`
  * visit browser on http://raspberrypi.local:1880 and clone project from ` https://github.com/lutzer/drl-tools-flows.git`
  * install dependencies from node-red package manager



## Shrink and minimize raspberry pi image

* create image
  ```
  # find out disk name with diskutil
  diskutil list
  # make image, make sure N is replaced by disk number
  dd bs=32m if=/dev/rdiskN of=quasselstrippe_image_v0.1_02-06-2021.dmg
  ```

* shrink image with https://github.com/thhan/Docker-PiShrink
* zip image

