#!/usr/bin/env bash

# contains code to zip lambda function and push to aws

# function name is hardcoded
# assumes aws cli is set up and that lambda function exists
# assumes that you are running this from same directory as index.js and that storing zip in parent
# directory is ok

# need to run chmod +x publish.sh
# invoke using ./publish.sh

rm ../RollCall.zip

zip -r ../RollCall.zip . -x "*.git*" "*.idea*"

aws lambda update-function-code --function-name RollCall --zip-file fileb://../rollcall.zip