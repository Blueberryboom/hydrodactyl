#!/bin/bash

lerd setup -a
./bin/s3Setup.sh .env
lerd artisan p:user:make -n --email dev@pyro.host --username dev --name-first Developer --name-last User --password dev --admin  > /dev/null
lerd artisan p:location:make -n --short local --long Local > /dev/null
lerd artisan p:node:make -n --name local --description "Development Node" --locationId 1 --fqdn wings.test --public 1 --scheme https --proxy 1 --daemonListeningPort 443 --maxMemory 1024 --maxDisk 10240 --overallocateMemory 0 --overallocateDisk 0 --daemonType wings --backupDisk s3 --bucket 1 > /dev/null

