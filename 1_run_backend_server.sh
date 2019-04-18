#! /bin/bash

# python server.py
pushd ./fire_probability_model/
FLASK_APP=server.py flask run
popd
