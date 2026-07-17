#!/bin/bash
cd /home/z/my-project
PORT=3000 node .next/standalone/server.js >> /home/z/my-project/dev.log 2>&1
