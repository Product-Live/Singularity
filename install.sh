#!/bin/bash

apt-get purge -y nodejs npm
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
apt-get install -y nodejs

node main.js --deploy ubuntu