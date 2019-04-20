## Make sure to install dependancies
1) nodejs
2) npm
3) python
4) pip

finally, run ./0_install_dependancies.sh
when attempting to run and there are errors:
'cannot find package <such and such>' try installing
that package

## To Run

what you'll have to do is open one window and start `1_run_backend_server.sh`, leave that open
then in another window start `2_run_frontend_server.sh`, and leave that open.
by this point a tab should have opened in your browser. if not, try : `127.0.0.1:8080`

- start backend prediction server:
    > 1_run_backend_server.sh
- start frontend interface server:
    > 2_run_frontend_server.sh

## What does it do
- Default year selected is 2017
- Can pan/zoom map of California
- Can Select zipcode-boundary:
  + exposes details on right hand side
  + can adjust sliders to experiment with 
    different landcover% and see result
  + can view weather information
  + can view #years and %prob-fire predictions
  + can view histogram of fire occurances
    throughout the years for the selected zipcode

## Final Product data backing this
./assembled-data

## Raw data not included, too big
./data-processing/*

