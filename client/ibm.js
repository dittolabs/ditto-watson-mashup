"use strict";

angular.module('Ditto.BlueMix').service('IBM', ['$http', function($http) {
  this.version = '2016-05-20';
  this.api_base_url = 'https://gateway-a.watsonplatform.net/visual-recognition/api/v3/detect_faces?version=' + this.version;

  // Set to true to simulate results from Bluemix
  this.simulate = false;

	// We can use local storage in the browser to cache the results from the API.
	// This is useful when you are debugging and don't want to run up against
	// the API rate limits.
	this.use_local_storage = (typeof(Storage) !== "undefined");

	// Status of ibm api. This will be true if the rate limit has been reached
	this.ratelimit = false;

	this.photos_without_faces = false;

	this.photo_ages = [{
    shown: true,
    pretty_name: "N.A.",
    name: "N.A."
  }];

  this.photo_ages_hash = {};

	this.photo_genders = [{
    shown: true,
    pretty_name: "N.A.",
    name: "N.A."
  }];

  this.photo_genders_hash = {};

	this.age_range_for_sort = function(age_range) {
    if (age_range.substring(0,1) == "<") {
	    age_range = "0" + age_range;
    }

    if (age_range.substring(0,1) == ">") {
	    age_range = "99" + age_range;
    }
    return age_range;
	}

	this.capitalize = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
	}

	this.photo_add_ibm_data = function(photo) {

    if (photo.ibm) {

  		if (photo.ibm.images && photo.ibm.images[0].faces && photo.ibm.images[0].faces.length > 0) {

		    var faces = photo.ibm.images[0].faces;
		    photo.ages = [];
		    photo.genders = [];

		    for (var j=0; j<faces.length; j++) {
    			var face = faces[j];

          if (face.age) {
  			    var age_range = "";

     		    if (face.age.min) {
      				if (face.age.max) {
      				    age_range = face.age.min + "-" + face.age.max;
      				} else {
      				    age_range = ">"   + face.age.min;
      				}
  			    } else if (face.age.max) {
  		        age_range = "<"   + face.age.max;
            }

            photo.ages.push(age_range);
            if (!this.photo_ages_hash.hasOwnProperty(age_range)) {
              this.photo_ages_hash[age_range] = true;
              var age = {
                shown: true,
                pretty_name: age_range,
                name: age_range,
                sort_name: this.age_range_for_sort(age_range)
              }

			        this.photo_ages.push(age);
            }
    			}

    			if (face.gender) {
  			    var gender = face.gender.gender;
  			    photo.genders.push(gender);

  			    if (!this.photo_genders_hash.hasOwnProperty(gender)) {
      				this.photo_genders_hash[gender] = true;

      				var gender_obj = {
                shown: true,
  						  pretty_name: this.capitalize(gender),
  						  sort_name: gender,
  						  name: gender
              };

      				this.photo_genders.push(gender_obj);
  			    }
    			}
	      }
	    } else {
	      this.photos_without_faces = true;
	    }
    }
  }

	// Retrieve results for the specified (Ditto) photo object.
	// The photo object will be extended with the ibm results.
	this.identify = function(api_keys, photo) {
    var api_key = api_keys.ibm;
    // photo.image_url is the original url of the image posted in social as returned by ditto
    var url = this.api_base_url + '&apikey=' + api_key + '&url=' + photo.image_url;

    // TODO change the cache from the watson url to the photo.image_url

    // To save api calls, cache the results in local storage and read them from there.
    if (this.use_local_storage && localStorage.getItem(url)) {
  		photo.ibm = JSON.parse(localStorage.getItem(url));
  		this.photo_add_ibm_data(photo);
  		return;
    }

    // If daily limit is exceeded, skip
    if (this.ratelimit) {
  		console.error('hit ratelimit true');
  		return;
    }

    // Do nothing if there is already a result
    if (photo.ibm)
	    return;

    // If simulate is true, do not contact the bluemix servers.
    if (this.simulate) {
  		this.simulate_data(photo);
  		this.photo_add_ibm_data(photo);
  		return;
    }

    // Retrieve a page of results
    var self = this;

    $http.get(url)

    .success(function(data) {

      photo.ibm = data;

      if (data.error || (data.status && data.status == "ERROR")) {
        var error_string = "";
    		if (data.error) {
    		  error_string = data.error.description;
    		} else if (data.statusInfo) {
    		  error_string = data.statusInfo;
    		}
    		console.error('ibm api error', error_string);

    		// Most likely, the daily transaction limit is exceeded
    		if (data.error && data.error.description && data.error.description.indexOf('limit') >= 0) {
    		  self.ratelimit = true;
    		}

		    return;

      } else {
    		self.photo_add_ibm_data(photo);

    		if (self.use_local_storage) {
    		    localStorage.setItem(url, JSON.stringify(data));
    		}
	    }
    })

    .error(function(data) {
	    console.error('Error retrieving data from IBM', data);
    });
  }

	// Simulate ibm return data. Useful when testing to avoid consuming
	// the daily api limit.
	this.simulate_data = function(photo) {

		// Add simulated data to 25% of the records
		if (Math.random() < 0.75)
			return;

		var min_age,
        max_age,
        gender;

		if (Math.random() < 0.5) {
		    min_age =  "18";
		    max_age = "24";
		} else {
		    min_age =  "25";
		    max_age = "34";
		}
		if (Math.random() < 0.5) {
		    gender = "MALE";
		} else {
		    gender = "FEMALE";
		}
		var data = {images: [{faces: [{age: {min: min_age, max: max_age}, gender: {gender: gender}}]}]};
		photo.ibm = data;
	}

}]);

