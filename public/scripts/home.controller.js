angular.module('blueWatchApp')
    .controller('HomeController', HomeController);

function HomeController($http, $location, $scope, ResourcesService, LogoutService, ReviewsService) {


    console.log('Home controller');
    var controller = this;
    LogoutService.status = false;
    controller.reviewsService = ReviewsService;
    controller.resourceService = ResourcesService;
    //array of all the markers
    controller.markers = [];
    controller.resources;
    controller.selectedCategoryArray;
    controller.resourcesToSearch = [];
    controller.markersToSearch = [];
    controller.reviewsToSearch = [];



    controller.categoryListToggle = function() {
        controller.changeCategoryList = true;
        controller.changeSelectedCategory = false;
        controller.changeCheckedCategory = false;
        controller.changeSingleResource = false;
        controller.changeBackButton = false;
        controller.changeBackButton2 = false;
        controller.filterAddress = false;
    };

    controller.selectedCategoryToggle = function() {
        controller.changeCategoryList = false;
        controller.changeSelectedCategory = true;
        controller.changeCheckedCategory = false;
        controller.changeSingleResource = false;
        controller.changeBackButton = true;
        controller.changeBackButton2 = false;
        controller.filterAddress = false;
    };

    controller.checkedCategoryToggle = function() {
        controller.changeCategoryList = false;
        controller.changeSelectedCategory = false;
        controller.changeCheckedCategory = true;
        controller.changeSingleResource = false;
        controller.changeBackButton = false;
        controller.changeBackButton2 = true;
        controller.filterAddress = false;
    };

    controller.singleResourceToggle = function() {
        controller.changeCategoryList = false;
        controller.changeSelectedCategory = false;
        controller.changeCheckedCategory = false;
        controller.changeSingleResource = true;
        controller.changeBackButton = !controller.changeBackButton2;
        controller.changeBackButton2 = !controller.changeBackButton;
        controller.filterAddress = true;
    };


    controller.categoryListToggle();

    //sets where the map is located, type and zoom

    var mapOptions = {
        center: new google.maps.LatLng(44.9778,-93.2650),
        zoom: 5,
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

        controller.resourceService.getResources().then(function(response) {

            controller.resources = response.data;

            controller.resources.forEach(function(info) {
                var id = info._id;

                controller.reviewsService.getPublicReviews(id).then(function(response) {
                    var totalRating = 0;
                    info.review = response.data;
                    info.numberOfReviews = info.review.length;

                    //make function to create average Rating
                    if (info.numberOfReviews > 0) {
                        info.review.forEach(function(review) {
                            totalRating += review.rating;
                            info.averageRating = totalRating / info.numberOfReviews;
                        });
                    } else {
                        info.averageRating = 0;
                    }
                });

                controller.createMarker(parseFloat(info.lat), parseFloat(info.long), info);

            }); //End of for each

            controller.showVisible(controller.markers); //show all markers

        }); //end of http get resource

    }; //End of getResources

    var icons = ResourcesService.icons;

    //create marker
    controller.createMarker = function(latinfo, lnginfo, info) {

        info.marker = new google.maps.Marker({
            map: controller.map,
            position: new google.maps.LatLng(latinfo, lnginfo),
            title: info.company,
            category: info.category.categoryName,
            visible: true,
            icon: icons[info.category.color].icon
        });

        info.marker.content = '<div class="infoWindowContent">' + info.description + '</div> Contact: ' + info.contact + '</div></div>';

        info.marker.infoWindow = new google.maps.InfoWindow();

        //event listener for marker click
        google.maps.event.addListener(info.marker, 'click', function() {
            controller.closeInfoWindow();

            controller.showSingleResource(info);
            controller.singleResourceToggle();

            info.marker.infoWindow.setContent('<p><strong>' + info.marker.title + '</strong>' +
                info.marker.content + '</p>');
            info.marker.infoWindow.open(controller.map, info.marker);


        });
        //close infoWindow when clicked anywhere on map
        google.maps.event.addListener(controller.map, 'click', controller.closeInfoWindow);
        //listen for bounds status
        google.maps.event.addListener(controller.map, 'idle', function() {
            info.marker.boundsStatus = controller.map.getBounds().contains(info.marker.getPosition());
            //apply changes on the DOM
            $scope.$apply();

        });
        controller.markers.push(info.marker);

    }; //End of createMarker

    controller.showSingleResource = function(resource) {

        controller.selectedResource = resource;

        //get review ratings and comments
        controller.getSelectedRating(resource);
        //hide all markers
        controller.hideMarkers(controller.markers);

        //show markers of selected category
        controller.showVisible([controller.selectedResource.marker]);


    };

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

        if (controllerMarkers.length > 1) {
            controllerMarkers.forEach(function(marker) {
                marker.setVisible(true);
                controller.closeInfoWindow();
                // extending bounds to contain this visible marker position
                bounds.extend(marker.getPosition());
            });

            // setting new bounds to visible markers of
            controller.map.fitBounds(bounds);
        } else {
            controllerMarkers[0].setVisible(true);
            controller.closeInfoWindow();
            controller.map.setCenter(controllerMarkers[0].position);
        }
    }
    controller.getResources(); //run getResources function


    //show marker when company name is clicked
    controller.openInfoWindow = function($event, selectedMarker, resource) {
        event.preventDefault();
        google.maps.event.trigger(selectedMarker, 'click');
    }

    controller.expandCategory = function(category) {
        controller.slide = 'fadeRight';
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
        controller.selectedCategoryToggle();
    }

    controller.expandCheckedCategory = function(category) {
        controller.slide = 'fadeRight';

        if (category == undefined || category == false) {
            alert('Please select a category');
            return;
        }

        //markers to show based on selected category
        controller.showMarkers = [];
        controller.vals = [];
        controller.categoryColors = [];
        getValues(category);

        function getValues(category) {
            for (var key in category) {
                if (category.hasOwnProperty(key)) {
                    //we only want selected vales in our array
                    if (category[key] !== false) {
                        controller.vals.push(category[key]);
                    }
                }
            }
            return controller.vals;
        }

        controller.checkedCategory = [];

        controller.vals.forEach(function(checkedCategory) {
            var selectedCategoryArray = [];
            controller.resources.forEach(function(resource) {
                if (resource.category.categoryName === checkedCategory) {
                    selectedCategoryArray.push(resource);
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
        controller.checkedCategoryToggle();
    }
    controller.backCategories = function(category) {

        controller.slide = 'fadeLeft';
        //refreshes the map and show all
        controller.showVisible(controller.markers);
        controller.search = "";
        controller.checked = false;

        controller.categoryListToggle();

    }

    controller.backToSelectedcategories = function(category) {

        controller.slide = 'fadeLeft';
        if (angular.isObject(category) == true) {
            controller.expandCheckedCategory(category);
        } else {
            controller.expandCategory(category);
        }

    }
    controller.searchData = [];
    controller.searchMarkersToshow = [];
    controller.emptySearchResult = false;

    controller.searchResources = function(search) {
        controller.searchData.length = 0;
        controller.searchMarkersToshow.length = 0;
        search = search.toString();
        controller.resourceService.getSearchedResource(search).then(function(response) {
            controller.searchData = response.data;
            if (controller.searchData.length == 0) {
                var el = angular.element(document.querySelector('#emptySearch'));
                el.empty();
                el.append('<p>Sorry your search found empty result. Please try another keyword!</p>');
                controller.emptySearchResult = true;
            } else {
                controller.searchData.forEach(function(searchedresource) {

                    controller.resources.forEach(function(resource) {
                        if (searchedresource._id == resource._id) {
                            controller.searchData.push(resource);
                            console.log(resource);
                            controller.searchMarkersToshow.push(resource.marker);
                        }
                    })
                }); //End of searchData forEach

                //hide all markers
                controller.hideMarkers(controller.markers);
                //show markers of selected category
                controller.showVisible(controller.searchMarkersToshow);
                controller.selectedCategoryToggle();
            };

        }, function(error) {
            console.log('error getting searched resource', error);
        }); //End of getSearchedResource
    }; //End of searchResources


    controller.searchAddress = function() {
        var addressInput = document.getElementById('address-input').value;
        var distance = parseFloat(controller.distance);
        var geocoder = new google.maps.Geocoder();

        geocoder.geocode({
            address: addressInput
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {

                var myResult = results[0].geometry.location;

                controller.map.setCenter(myResult);

                controller.map.setZoom(distance);

            } else { // if status value is not equal to "google.maps.GeocoderStatus.OK"

                // warning message
                alert("The Geocode was not successful for the following reason: " + status);

            }
            controller.searchForAddress = "";
            controller.distance = "";
            // controller.data-toggle.dropdown = false;
        });
    }

    controller.getId = function(id) {
        controller.id = id;
    };


    // target element
    var el = document.querySelector('#el');

    // current rating, or initial rating
    var currentRating = 0;

    // max rating, i.e. number of stars you want
    var maxRating = 5;

    // callback to run after setting the rating
    var callback = function(rating) {
        controller.starReview = rating
    };

    // rating instance
    var myRating = rating(el, currentRating, maxRating, callback);

    controller.createReview = function(review, id) {

        var body = {
            resource_id: controller.id,
            rating: controller.starReview,
            comments: review
        }
        controller.reviewNotes = '';
        controller.reviewsService.createReview(body).then(function() {
            //Send notification email
            controller.sendMail(body);
            //Empty review form
            myRating.setRating(el, 0, 5, false);
        }, function(error) {
            console.log('error creating review', error);
        });
    }; //End of createReview

    controller.sendMail = function(data) {
        controller.reviewsService.sendEmail(data).then(function(results) {}, function(error) {
            console.log('error sending email', error);
        });
    }; // end sendMail

    //show all ratings for the resource selected
    controller.getSelectedRating = function(resource) {
        //get review array of that id in the .review property
        controller.selectedReviewArrays = resource.review;
    };

} //End of HomeController

angular.module('blueWatchApp')
    .directive('starRating', function() {
        return {
            restrict: 'AE',
            template: '<ul class="rating">' +
                '<li ng-repeat="star in stars" ng-class="star" >' +
                '\u2605' +
                '</li>' +
                '</ul>',
            scope: {
                ratingValue: '=',
                max: '=',
                // onRatingSelected: '&'
            },
            link: function(scope, elem, attrs) {

                var updateStars = function() {
                    scope.stars = [];
                    for (var i = 0; i < scope.max; i++) {
                        scope.stars.push({
                            filled: i < scope.ratingValue,
                            half: scope.ratingValue % 1 > 0 && i === Math.floor(scope.ratingValue)
                        });
                    }
                };
                scope.toggle = function(index) {
                    scope.ratingValue = index + 1;
                    //    scope.onRatingSelected({
                    //        rating: index + 1
                    //    });
                };

                scope.$watch('ratingValue', function(newVal, oldVal) {

                    if (newVal) {
                        updateStars();
                    } else if (newVal == '') {
                        updateStars();
                    }

                });
            }
        }
    });
