"use strict";

angular.module('Ditto.BlueMix').service('Global', [function() {

	    this. ditto_client_id = '<your ditto client id here>';
	    this. ibm_api_key = '<your ibm api key here>';
	    this.client_ids = function() {
		    return {ditto: this.ditto_client_id, ibm: this.ibm_api_key};
	    }
	}]);