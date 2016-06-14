"use strict";

angular.module('Ditto.BlueMix').service('Twitter', ['$http', function($http) {

  // api url. Verify the domain matches credentials
  this.api_url = 'https://publish.twitter.com/oembed?callback=JSON_CALLBACK&omit_script=true&hide_thread=true&url=';

  // Retrieve results for the specified (Ditto) photo object.
  // The photo object will be extended with the html.
  this.load_html = function(photo) {
    // photo.image_url is the original url of the image posted in social as returned by ditto
    var url = this.api_url + encodeURI(photo.expanded_post_url),
        self = this;

    $http.jsonp(url)

    .success(function(data) {
			photo.html = data.html;
    })

		.error(function(data) {
			console.error('Error retrieving oembed data from twitter ', data);
		});
	}
}]);

