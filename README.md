# pi-cam

This is a simple pure-JS raspberry pi web-accessible webcam, using [Resin.io](https://resin.io) for deployment.

Tested with:

* Raspberry Pi 3B
* [Pi cam v2.1](https://shop.pimoroni.com/products/raspberry-pi-camera-module-v2-1-with-mount)

## Getting started

- Set up your device and camera
- Sign up for free on [resin.io](https://dashboard.resin.io/signup), create an application for your device, and provision it. You should see the new device appear on the dashboard after a couple of minutes.
- Set the following environmental variables for your Resin application:
    * RESIN_HOST_CONFIG_gpu_mem: 128 // Sets the GPU memory for the device
    * RESIN_HOST_CONFIG_start_x: 1 // Enable the camera
- Push the contents of this repo to your Resin.io application
- Enable the device URL on your dashboard (it's the chain icon in the top right on the device's page)
- Open the devices URL (it's in the dropdown under the previous button).