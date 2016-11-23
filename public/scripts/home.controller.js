angular.module('blueWatchApp')
    .controller('HomeController', HomeController);

function HomeController($http, $location, $scope) {

    console.log('Home controller');
    var controller = this;

    //array of all the markers
    controller.markers = [];

    controller.globalMarkers;
    controller.resources;
    controller.selectedCategoryArray;
    //sets where the map is located, type and zoom

    var mapOptions = {
        center: new google.maps.LatLng(38.62452, -90.18514),
        // center: new google.maps.LatLng(44.9778, 93.2650), //this lat/long to center of cities - jsm
        zoom: 5, //zoom level to show most - jsm
        mapTypeId: google.maps.MapTypeId.ROADMAP,

        panControl: true,
        mapTypeControl: false,
        panControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
        scaleControl: false,
        streetViewControl: true,
        streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
        }
    };


    //creates the map
    controller.map = new google.maps.Map(document.getElementById('map'), mapOptions);



    //loads all the resources on page load
    controller.getResources = function() {

        $http.get('/resource').then(function(response) {
          console.log('response.data in home controller', response.data);
            controller.resources = response.data;

            controller.resources.forEach(function(info) {

                controller.runGeoCode(info);

            }); //End of for each


        });

    }; //End of getResources

    controller.runGeoCode = function(info) {

        //get address from resource
        var address = info.street + ' ' + info.city + ' ' + info.state + ' ' + info.zip;
        //call geocode to convert to lat/long
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            address: address
        }, function(results, status) {

            if (status == google.maps.GeocoderStatus.OK) {

                info.lat = results[0].geometry.location.lat();
                info.long = results[0].geometry.location.lng();
                //creates markers
                controller.createMarker(info.lat, info.long, info);
            }

        }); //End of geocode

    }; // End of runGeoCode

    //create marker
    controller.createMarker = function(latinfo, lnginfo, info) {

      var icons = {
         Financial: {
           icon: '/assets/img/Green_Marker.png'
         },
         Suicide: {
           icon: '/assets/img/Purple_Marker.png'
         },
         Support: {
           icon: '/assets/img/Yellow_Marker.png'
         },
         Therapy: {
           icon: '/assets/img/Orange_Marker.png'
         },
         Wellness: {
           icon: '/assets/img/Blue_Marker.png'
         },
         'Critical Event': {
           icon: '/assets/img/Red_Marker.png'
         }
       };
      //  Critical Event,red
      //  Financial,green
      //  Suicide,purple
      //  Support,yellow
      //  Therapy,orange
      //  Wellness,blue


        info.marker = new google.maps.Marker({
            map: controller.map,
            position: new google.maps.LatLng(latinfo, lnginfo),
            title: info.company,
            category: info.category.categoryName,
            visible: true,
            icon: icons[info.category.categoryName].icon
        });



        info.marker.content = '<div class="infoWindowContent">' + info.description + '</div>';

        info.marker.infoWindow = new google.maps.InfoWindow();
        //opens bubble on marker click
        google.maps.event.addListener(info.marker, 'click', function() {
            controller.closeInfoWindow();
            info.marker.infoWindow.setContent('<p>' + info.marker.title + ': ' + info.marker.content + '</p>');
            info.marker.infoWindow.open(controller.map, info.marker);
        });
        //close infoWindow when clicked anywhere on map
        google.maps.event.addListener(controller.map, 'click', controller.closeInfoWindow);
        //listen for bounds status
        google.maps.event.addListener(controller.map, 'idle', function() {
            info.marker.boundsStatus = controller.map.getBounds().contains(info.marker.getPosition());
            console.log(info.marker.boundsStatus);
            //apply changes on the DOM
            $scope.$apply();

        });
        controller.markers.push(info.marker);

        controller.showVisible(controller.markers); //show all markers

    }; //End of createMarker

    //close all open window
    controller.closeInfoWindow = function() {
        controller.markers.forEach(function(marker) {
            marker.infoWindow.close();
        });

    };

    controller.hideMarkers = function(markers) {
        markers.forEach(function(marker) {
            marker.setVisible(false);
            controller.closeInfoWindow();
        });
    };

    controller.showVisible = function(controllerMarkers) {
        var bounds = new google.maps.LatLngBounds();
        controllerMarkers.forEach(function(marker) {
            marker.setVisible(true);
            controller.closeInfoWindow();
            // extending bounds to contain this visible marker position
            bounds.extend(marker.getPosition());
        });

        // setting new bounds to visible markers of
        controller.map.fitBounds(bounds);
    }

    controller.getResources(); //run getResources function


    //show marker when company name is clicked
    controller.openInfoWindow = function($event, selectedMarker) {
        event.preventDefault();
        google.maps.event.trigger(selectedMarker, 'click');
    }

    //changes the category list to list of resources from selected category
    controller.change = {
        categoryList: false
    };
    controller.change = {
        selectedCategory: false
    };
    controller.change = {
        checkedCategory: false
    };
    controller.expandCategory = function(category) {
console.log(category);
        //array of markers to show
        controller.showMarkers = [];

        controller.selectedCategoryArray = [];

        //will take in what the user wants so it can be listed on the DOM
        controller.resources.forEach(function(resource) {

            if (resource.category.categoryName == category) {
                controller.selectedCategoryArray.push(resource);
                controller.showMarkers.push(resource.marker);
            }
        });

        //hide all markers
        controller.hideMarkers(controller.markers);


        //show markers of selected category
        controller.showVisible(controller.showMarkers);

        //this hides the categoryList and shows the list of selected categories
        controller.change.categoryList = !controller.change.categoryList;
        controller.change.selectedCategory = !controller.change.selectedCategory;
    }

    controller.expandCheckedCategory = function(category) {
        //markers to show based on selected category
        controller.showMarkers = [];
        var vals = [];
        getValues(category);

        function getValues(category) {
            for (var key in category) {
                if (category.hasOwnProperty(key)) {
                    //we only want selected vales in our array
                    if (category[key] !== false) {
                        vals.push(category[key]);
                    }
                }
            }
            return vals;
        }


        controller.checkedCategory = [];

        vals.forEach(function(checkedCategory) {
            var selectedCategoryArray = [];

            controller.resources.forEach(function(resource) {
                if (resource.category.categoryName === checkedCategory) {
                    selectedCategoryArray.push(resource);
                    //add marker to array of markers to show
                    controller.showMarkers.push(resource.marker);
                }
            });

            var name = controller.resources[0].category.categoryName;
            controller.checkedCategory.push({
                name: checkedCategory,
                resources: selectedCategoryArray
            });

        });
        //hide all markers
        controller.hideMarkers(controller.markers);
        //show markers of selected category
        controller.showVisible(controller.showMarkers);

        //this hides the categoryList and shows the list of selected categories
        controller.change.categoryList = !controller.change.categoryList;
        controller.change.checkedCategory = !controller.change.checkedCategory;
    }
    controller.backCategories = function(category) {
        //refreshes the map and show all
        controller.showVisible(controller.markers);
        controller.search = "";
        controller.change = {
            categoryList: false
        };
        controller.change = {
            selectedCategory: false
        };
        controller.change = {
            checkedCategory: false
        };
    }

    controller.searchAddress = function() {

        var addressInput = document.getElementById('address-input').value;

        var geocoder = new google.maps.Geocoder();

        geocoder.geocode({
            address: addressInput
        }, function(results, status) {

            if (status == google.maps.GeocoderStatus.OK) {

                var myResult = results[0].geometry.location;

                controller.map.setCenter(myResult);

                controller.map.setZoom(8); //this zoom level needs to be changed - was at 15. jsm

            } else { // if status value is not equal to "google.maps.GeocoderStatus.OK"

                // warning message
                alert("The Geocode was not successful for the following reason: " + status);

            }

        });
    }

controller.getId = function(id){
  console.log('here');
  controller.id = id;
  console.log(controller.id);
}


    // target element
    var el = document.querySelector('#el');

    // current rating, or initial rating
    var currentRating = 0;

    // max rating, i.e. number of stars you want
    var maxRating= 5;

    // callback to run after setting the rating
    var callback = function(rating) {
      controller.starReview = rating
      console.log(rating);
     };

    // rating instance
    var myRating = rating(el, currentRating, maxRating, callback);

// sets rating and doesn't run callback
    // myRating.setRating(3, false);
    //
    // myRating.getRating();


    controller.createReview = function(review, id){
      console.log('id', controller.id);
      var body = {
        resource_id: controller.id,
        rating: controller.starReview,
        comments: review
      }
      controller.reviewNotes = '';
      console.log(body);
          $http.post('/reviews', body
        ).then(function(){
        console.log('success posting');
        }, function(error) {
          console.log('error creating review', error);
        });
    }

};
