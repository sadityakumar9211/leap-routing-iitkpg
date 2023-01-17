# Functionalities / Flow of the application:

1. User enters the source and destination ✅
2. Using forward geocoding the text is converted to coordinates ✅
3. These coordinates are then used to mark the location - source and destination - When source is entered create a marker for the source. - When destination is entered fetch and display the route. ✅
   > Till here it will be same in all applications
4. When user enters the submit button, we make call to directions API of mapbox and get the result.

   - In alternate case, we can make the api call to the hosted OSRM server (theirs or ours)
5. We get the directions in a specific format (waypoints or vectors).
6. Among multiple options of directions, we choose the the final result based on the preference.
6. We display the results in the map using mapbox functions.

# Non-Functional Requirements: -

- The `transport mode` is car(car), foot(walk), bike(motorbike), traffic

Brainstorming:

- Depending upon various modes of transportation, we will get geojson line (maybe 1 or more) and we will display these lines(directions) into the map.


# Additional Features: 
- Adding various types of controls so that the application looks great. [Various Controls](https://github.com/korywka/mapbox-gl-controls)
- [Traffic Overlay layers](https://github.com/mapbox/mapbox-gl-traffic)
- Mapbox atmosphere style - feature

# Make a complete application using just MapBox and a MabBox Wrapper .

- It is easy to read a well documented documentation.
- Next and Mapbox and well reputated companies have very good documentation.
- Documentation is the key to the success of a good product for use in public development.

## Useful Links

- [Traffic integration in OSRM](https://blog.mapbox.com/traffic-data-supports-here-and-tomtom-with-real-time-and-historic-data-using-openlr-f6af26081a04)


- bbox India: 66, 5, 98, 37,


### Things to do
 1. Display all the details of a particular path
 - routing instructions
 - route details 
   - time
   - distance
   - marker depending on teh route
   - how much better than other routes (a percentage information)

- Alternate Paths
 - add the things 