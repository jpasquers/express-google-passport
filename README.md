# express-google-passport
A (mandatorily locally run) google auth with passport and express tester

To run, run the following:
1) npm install
2) npm start

Then go to localhost:8082/ 

NOTE: This must be run locally, as the google callback url must be an absolute path, and must either be a registered hostname or 'localhost'. Aka simply declaring an IP address wouldn't work.
