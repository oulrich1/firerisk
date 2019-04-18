#! /bin/bash

echo "Installing Front-End depedancies"
echo "================================"
npm install -g http-server 

echo ""
echo "Installing Back-End depedancies"
echo "==============================="
pip install xgboost
pip install flask
pip install flask-cors

