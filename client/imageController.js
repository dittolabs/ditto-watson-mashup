"use strict";

function ImageController($scope, Global, Ditto, IBM, Twitter, $timeout) {

  $scope.clear_option_classes = function() {
  	var all_brands = $scope.brands,
        all_genders = $scope.genders,
        all_ages = $scope.ages;
        all_index = 0,
        option;

  	for (all_index=0; all_index<all_brands.length; all_index++) {
  	    option = all_brands[all_index];
  	    option.class = "option-not-visible";
  	}
  	for (all_index=0; all_index<all_genders.length; all_index++) {
  	    option = all_genders[all_index];
  	    option.class = "option-not-visible";
  	}
  	for (all_index=0; all_index<all_ages.length; all_index++) {
  	    option = all_ages[all_index];
  	    option.class = "option-not-visible";
  	}
  }

  $scope.photo_match_options = function(photo_attributes, options_attributes, not_available_value) {

  	if (photo_attributes && photo_attributes.length > 0) {
	    var found = false;

	    for (var index=0; index<photo_attributes.length; index++) {
    		var photo_attribute = photo_attributes[index];

    		for (var option_index=0; option_index<options_attributes.length; option_index++) {
			    var option = options_attributes[option_index];
			    if (option.shown) {
    				if (photo_attribute == option.name) {
    				    found = true;
    				    break;
    				}
          }
        }
		    if (found) break;
      }

	    if (!found) {
		    return false;
	    }

    } else if (not_available_value) {
	    var na_element = options_attributes.filter(function(option) { return option.name == not_available_value; })[0];
	    if (!na_element.shown) {
		    return false;
      }
    }

    return true;
  }

  $scope.update_option_counts = function(photo_list, attribute_name, options_attributes, not_available_value) {
    for (var option_index=0; option_index<options_attributes.length; option_index++) {
      var option = options_attributes[option_index];
	    option.match_count = 0;
    }

    for (var photo_index=0; photo_index<photo_list.length; photo_index++) {
	    var photo = photo_list[photo_index],
          photo_attributes = photo[attribute_name],
          any_option_found = false;

	    if (photo_attributes) {
    		for (var option_index=0; option_index<options_attributes.length; option_index++) {
  		    var option = options_attributes[option_index],
              option_found = false;
  		    for (var index=0; index<photo_attributes.length; index++) {
      			var photo_attribute = photo_attributes[index];
      			if (photo_attribute == option.name) {
      			    option_found = true;
      			    any_option_found = true;
      			    option.match_count += 1;
      			    break;
      			}
  		    }
    		}
      }

      if (!any_option_found && not_available_value) {
  		  var na_element = options_attributes.filter(function(option) { return option.name == not_available_value; })[0];
        na_element.match_count += 1;
      }
  	}
  }

  $scope.update_options_counts = function(photo_list) {
  	$scope.update_option_counts(photo_list, 'brands', $scope.brands, false);
  	$scope.update_option_counts(photo_list, 'ages', $scope.ages, "N.A.");
  	$scope.update_option_counts(photo_list, 'genders', $scope.genders, "N.A.");
  	$scope.update_option_counts(photo_list, 'labels', $scope.labels, "no label");
  }


  // Return the photos to display on the page
  $scope.photolist = function() {
    var photos = [];
    // $scope.clear_option_classes();

    for (var i=0; i<Ditto.photos.length; i++) {
    	var photo = Ditto.photos[i],
          show = true;

    	// Any of the options can filter out this photo.
    	// This is equivalent to the options being ANDed.
    	if (!$scope.photo_match_options(photo.brands, $scope.brands, false)) { show = false; }
    	if (!$scope.photo_match_options(photo.ages, $scope.ages, "N.A.")) { show = false; }
    	if (!$scope.photo_match_options(photo.genders, $scope.genders, "N.A.")) { show = false; }
    	if (!$scope.photo_match_options(photo.labels, $scope.labels, "no label")) { show = false; }

    	if (show) { photos.push(photo); }

    }

    // Give the twitter widget support the chance to notice the new tweets and update them.
    // This should be moved to a directive and out of the controller.
    $timeout(function () {
	    if (twttr && twttr.widgets) {
		    twttr.widgets.load(document.getElementById("all-tweets"));
	    }
    }, 0, false);

    $scope.update_options_counts(photos);
    return photos;
  }

	// Load images from Ditto API
	$scope.photos = Ditto.photos;
	$scope.brands = Ditto.photo_brands;
	$scope.labels = Ditto.photo_labels;
	$scope.ages = IBM.photo_ages;
	$scope.genders = IBM.photo_genders;

	Ditto.load(Global.client_ids());
}

angular.module('Ditto.BlueMix').directive("showOnLoad", function() {
	return {
    link: function(scope, element) {
      element.on("load", function() {
  			scope.$apply(function() {
  				scope.photo.loadable = true;
        });
      });
    }
  };
})
.directive("hideAllShowAll", function() {

  var controller = ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {

    $scope.show_all = function() {
    	var items = $scope.data;
    	for (var all_index=0; all_index<items.length; all_index++) {
  	    var option = items[all_index];
        $scope.reload_masonry();
  	    option.shown = true;
    	}
    }

    $scope.hide_all = function() {
    	var items = $scope.data;
    	for (var all_index=0; all_index<items.length; all_index++) {
  	    var option = items[all_index];
        $scope.reload_masonry();
  	    option.shown = false;
    	}
    }

    $scope.some_off = function() {
    	var items = $scope.data;
    	for (var all_index=0; all_index<items.length; all_index++) {
  	    var option = items[all_index];
  	    if (!option.shown) {
        $scope.reload_masonry();
          return true;
        }
      }
      return false;
    }

    $scope.any_on = function() {
    	var items = $scope.data;
    	for (var all_index=0; all_index<items.length; all_index++) {
  	    var option = items[all_index];
  	    if (option.shown) {
          $scope.reload_masonry();
    		  return true;
        }
    	}
      return false;
    }

    $scope.change_one = function() {
      $scope.reload_masonry();
      return false;
    }

    var timer;
    $scope.reload_masonry = function(){
      $timeout.cancel(timer);
      timer = $timeout(function(){
        $rootScope.$broadcast("masonry.reload");
      }, 5000);
    }

  }];

  return {
    restrict: 'E',
    scope: {
      pretty: '@pretty',
      data: '=data'
  	},
    templateUrl: 'options_template.html',
    controller: controller
  }
})
.controller('ImageController', ['$scope', 'Global', 'Ditto', 'IBM', 'Twitter', '$timeout', ImageController]);
