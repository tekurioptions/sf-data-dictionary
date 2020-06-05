#!/bin/bash

# login

fly --target candoris login --team-name candoris --concourse-url https://concourse.candoris.com/

fly --target main login --concourse-url https://concourse.candoris.com/

fly -t candoris sp -p sf-data-dictionary -c pipeline.yml

fly -t candoris sp -p sf-data-dictionary-deploy -c pipeline_deploy.yml

fly -t candoris sp -p sf-data-dictionary-build-and-deploy -c pipeline_build_and_deploy.yml

fly -t candoris unpause-pipeline -p sf-data-dictionary

# to troubleshoot

fly -t candoris intercept -j sf-data-dictionary-build-and-deploy/build

# set team

fly -t main set-team --team-name candoris --config team_config.yml
