"use strict";

angular.module('Ditto.BlueMix').service('Ditto', ['$http', 'IBM', 'Twitter', function($http, IBM, Twitter) {

	this.nimages = 2000;               // Maximum number of images to retrieve from Ditto
	this.safe_for_work_threshold = 0.6;
	this.label_threshold = 0.4;
	this.start_days_back = 1;

	this.photos = [];                  // Photo storage, as an array. Each element is described in the Ditto API.
	this.photo_brands = [];            // List of brands found - will be used for generating filtering options
	this.photo_brands_hash = {};       // Used to track which brands we have already seen.
	this.brands_requested = false;     // Map of brand_id to brand name.
	this.brand_hash = {};
	this.photo_labels = [{
                        shown: true,
            			      pretty_name: "no label",
            			      name: "no label"
                      }];

  this.photo_labels_hash = {"Safe for Work": true};

	this.brand_name = function(brand_id) {
	    return this.brand_hash[brand_id];
	}

	this.photo_ids_hash = {};           // Track ids of the images returned by Ditto for de-duping.
	this.photo_urls_hash = {};          // Track urls of the images returned by Ditto for de-duping.

	this.update_options = function(brands, labels) {
    // If we actually add the photo, then update the overall lists of active brands
    // and active labels.  These lists are used to generate the options.
    for (var index=0; index<brands.length; index++) {
	    var brand_name = brands[index];
	    if (!this.photo_brands_hash.hasOwnProperty(brand_name)) {
	      var brand_option =  {
          name: brand_name,
          pretty_name: brand_name,
          sort_name: brand_name,
          shown: true
        };

        this.photo_brands.push(brand_option);
	      this.photo_brands_hash[brand_name] = true;
	    }
    }

    for (var index=0; index<labels.length; index++) {
	    var label_name = labels[index];

  		if (!this.photo_labels_hash.hasOwnProperty(label_name)) {
		    var label_option = {
          name: label_name,
					pretty_name: label_name,
          sort_name: label_name,
          shown: true
        };
  		    this.photo_labels.push(label_option);
  		    this.photo_labels_hash[label_name] = true;
  		}
    }
  }

	// Extract the important fields from the data ditto returned for the photo.
	// Also filter out some of the photos that don't have anything interesting
	// e.g. no high quality brand match.  This also filters out photos that score
	// too low on Safe for Work.  "Safe for Work" is one of the labels that the
	// Ditto APIs return.
	this.add_photo = function(photo) {
    var safe_for_work_threshold = this.safe_for_work_threshold,
        label_threshold = this.label_threshold,
        safe_for_work = true,
        labels = [],
        brands = [],
        add_this_photo = false;

    // Each photo may have several brand matches, so iterate over them.
    for (var match_index=0; match_index<photo.matches.length; match_index++) {
  		var match = photo.matches[match_index];
  		// We only want to display "High" quality brand matches.
  		// Lower quality matches are not as reliable.
  		if (match.match_quality.indexOf('High') >= 0) {
  		    // convert brand_ids to brand names
  		    brands.push(this.brand_name(match.brand));
  		    // Only add this photo to the list, if it has at least one High quality brand match.
  		    add_this_photo = true;
  		}
    }

    // Each photo has zero or more labels.  These are things like objects in the photo or
    // labels of the overall context of the photo e.g. "bar scene".
    if (photo.attributes && photo.attributes.labels) {
  		var photo_labels = photo.attributes.labels;
  		for (var index=0; index<photo_labels.length; index++) {
  		    var label = photo_labels[index];
  		    if (label.label == "Safe for Work") {
      			if (label.confidence < safe_for_work_threshold) {
      			    // If this photo is labeled as not Safe for Work, then don't add the photo to
      			    // the list.
      			    add_this_photo = false;
      			}
		    } else if (label.confidence > label_threshold) {
    			labels.push(label.label);
		    }
		  }
    }

    if (add_this_photo) {
  		this.update_options(brands, labels);

  		// Add some fields to the photo.
  		photo.has_faces = ((typeof photo.nfaces === "number") && photo.nfaces > 0) || ((typeof photo.nmoods === "number") && photo.nmoods > 0)
  		photo.brands = brands;
  		photo.labels = labels;

  		// Add the photo to the hashes used for de-duping.
  		this.photo_ids_hash[photo.id] = photo;
  		this.photo_urls_hash[photo.image_url] = photo;

  		// Finally, add the photo to the list for display.
  		this.photos.push(photo);
    }

	 return add_this_photo;
	} // end add_photo


	// Use this to filter out duplicates.  A duplicate has either the same photo.id or the same image_url.
	this.photo_seen = function(photo) {
    if (this.photo_ids_hash.hasOwnProperty(photo.id)) {
		  return true;
    } else if (this.photo_urls_hash.hasOwnProperty(photo.image_url)) {
      return true;
    }

    return false;
  }

	// Use the ditto brands endpoint to get the full list of available brands for this api account.
	// This gives us the mapping from brand id to brand name.
	this.load_brands_list = function(api_keys, offset) {

    // Use a proxy (/pditto) to startditto
    var client_id = api_keys.ditto,
        api_brands_url = '/pditto/v2/brands?client_id=' + client_id,
        self = this;

    $http.get(api_brands_url).success(function(data) {
      if (data) {
        for (var index=0; index<data.length; index++) {
          var brand_entry = data[index];

  		    // Save the mapping from id to name for this brand.
          self.brand_hash[brand_entry["id"]] = brand_entry["name"];
        }
      }

      // Now that the brands are loaded, load the photos data.
	    // Note: we wait until after the brands are loaded, since we translate
	    // the brand id to brand name as we load the photos.
	    self.load(api_keys, offset);
    });

    // Make sure we don't do two brands requests
    this.brands_requested = true;
  }


	this.load_images = function(api_keys, offset) {

    var client_id = api_keys.ditto,
        api_stream_url = '/pditto/v2/stream?client_id=' + client_id,
        stream_url = api_stream_url;

    if (offset) {
  		stream_url += '&offset=' + offset;
    } else {
  		// First call to the Ditto API, so pass the min_time we are interested in.
      var start_date = new Date();
      start_date.setDate(start_date.getDate() - this.start_days_back);

      // pass the min_time as Epoch seconds
		  stream_url += '&min_time=' + (start_date.getTime() / 1000);
    }

    var self = this;

    // Retrieve a page of results
    $http.get(stream_url)

  		.success(function(data) {

  			// Store the photos.
  			if ((data.status == "OK") && data.photos && data.photos.length) {

          for (var i=0; i<data.photos.length; i++) {
    				var photo = data.photos[i];

    				if (!self.photo_seen(photo)) {
  				    var added_photo = self.add_photo(photo);

  				    if (added_photo) {
      					// And pass to ibm to face/age detection
      					IBM.identify(api_keys, photo);
      					Twitter.load_html(photo);
  				    }
    				}
          }

			    // Recursively call load to retrieve more images. Stop if we have
			    // enough images, or no more images are available
			    if (self.photos.length < self.nimages && data.photos.length > 0) {
    				var offset = data.next_offset;
    				self.load(api_keys, offset);
			    }

  			} else if (data.status != "OK") {
			    console.error('Error (status: ' + data.status + ') retrieving photos from Ditto', data);
        }

		  })

    .error(function(data) {
			console.error('Error retrieving photos from Ditto', data);
		});
	}

	// Load a page of results, using the max_time to page through the data.
	// This is recursively called to populate the photo storage.
	this.load = function(api_keys, offset) {
	    var self = this;

	    // If we haven't requested them, lookup all of the brands, so we can map brand_id to brand name.
	    if (!this.brands_requested) {
        // When the brands load, they will call load again to load the rest.
        self.load_brands_list(api_keys, offset);

    		// If we haven't loaded the brands, don't load the photos data, just return.
    		// This serializes the two steps, but it means we will have the mapping to convert
    		// the brand_ids to brand names when we load the photos.
    		return;
	    }
    this.load_images(api_keys, offset);
	}
}]);

