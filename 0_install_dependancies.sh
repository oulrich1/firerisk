#! /bin/bash

echo "Installing Front-End depedancies"
echo "================================"
npm install -g http-server 

echo ""
echo "Installing Back-End depedancies"
echo "==============================="
pip3 install xgboost
pip3 install flask
pip3 install pandas
pip3 install sklearn
pip3 install flask-cors

