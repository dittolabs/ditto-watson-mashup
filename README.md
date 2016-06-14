# [Ditto](ditto.us.com) / [IBM Watson](http://www.ibm.com/smarterplanet/us/en/ibmwatson/) Mashup Demo

## Getting started
To run this application you will: 

1. need to obtain API keys for [Ditto API](http://info.ditto.us.com/get-dittos-api) and [Watson API](https://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/getting_started/gs-credentials.shtml).
1. have [nodejs](http://nodejs.org) installed
1. have [bower](https://bower.io/) installed

  ```
  $ npm install -g bower
  ```

## Install and run the application locally

1. Clone this repository and ```cd``` into this directory.
1. Install node modules (listed in `package.json`): 

  ```
  $ npm install
  ```
1. Install client libraries (listed in `bower.json`):

  ```
  $ bower install
  ```
1. Modify `client/ditto.js` with the `client_id` supplied by Ditto
1. Modify `client/ibm.js` with the `apikey` supplied by IBM.
1. Start the node server: 

  ```
  $ node server.js
  ```
1. In a browser visit [http://localhost:3000](http://localhost:3000)


## Options

- To reduce API requests to Visual Recognition API during development, you can simulate the Watson data by setting the `simulate` parameter to `true` in `client/ibm.js`. When running in this mode, no requests are made to the Watson service.
- You can modify how many images are retrieved from Ditto by adjusting the `nimages` parameter in `client/ditto.js`


## Complete API documentation
- Ditto's [Social Stream](http://dev.startditto.com/doc/social-stream-api-v2/)
- IBM Watson's [Visual Recognition](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/visual-recognition/api/v3/)