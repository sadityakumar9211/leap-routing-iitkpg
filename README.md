# Functionalities / Flow of the application:

1. User enters the source and destination ✅
2. Using forward geocoding the text is converted to coordinates ✅
3. These coordinates are then used to mark the location - source and destination - When source is entered create a marker for the source. - When destination is entered fetch and display the route. ✅
    > Till here it will be same in all applications
4. When user enters the submit button, we make call to directions API of mapbox and get the result.

    - In alternate case, we can make the api call to the hosted OSRM server (theirs or ours)

5. We get the directions in a specific format (waypoints or vectors).
6. Among multiple options of directions, we choose the the final result based on the preference.
7. We display the results in the map using mapbox functions.

# Non-Functional Requirements: -

-   The `transport mode` is car(car), foot(walk), bike(motorbike), traffic

Brainstorming:

-   Depending upon various modes of transportation, we will get geojson line (maybe 1 or more) and we will display these lines(directions) into the map.

# Additional Features:

-   Adding various types of controls so that the application looks great. [Various Controls](https://github.com/korywka/mapbox-gl-controls)
-   [Traffic Overlay layers](https://github.com/mapbox/mapbox-gl-traffic)
-   Mapbox atmosphere style - feature

# Make a complete application using just MapBox and a MabBox Wrapper .

-   It is easy to read a well documented documentation.
-   Next and Mapbox and well reputated companies have very good documentation.
-   Documentation is the key to the success of a good product for use in public development.

## Useful Links

-   [Traffic integration in OSRM](https://blog.mapbox.com/traffic-data-supports-here-and-tomtom-with-real-time-and-historic-data-using-openlr-f6af26081a04)

-   bbox India: 66, 5, 98, 37,

### Things to do

1.  Display all the details of a particular path

-   routing instructions
-   route details

    -   time
    -   distance
    -   marker depending on teh route
    -   how much better than other routes (a percentage information)

-   Alternate Paths
-   add the things

## Questions:

1.  How do I decide which route should be the greenest on the routes based on the AQI data?

-   This can be tweaked...even later on.
-   the route must not have very high aqi for substantial period of time. (Not Very important factor)
-   The route must have the least cumulative exposure in ug/m^3
-   exposure = aqi \* time
-   this time is the time for which the person lies in the location for which the aqi is not changing.

### Finding the exposure for a route:

-   find the aqi for every 3 km of the route (assuming that) the aqi will not significantly change in the context of our study. - did that (there can also be scope of optimisation here - or it may already be optimal hesre.)

### Logic of finding the Optimal Route

Approach 1:

1.  finding all possible routes
2.  selecting the best possible route based on the estimated index determined by adjusting various traffic and aqi weights.
3.  this will give me the best possible balanced path.

Approach 2:

-   different way of determining the balanced route - it depends on us. - optimising time first then the greenest route - this is also different. - optimising the time (hence less time in the polluted air outside and less chances of exposure). - logically very sound. This is the best. Can be improved, but then everything can be improved.

-   the person should take less time (we don't want him to go out for a longer route).
-   only two routes are taken because of the performance(33% more time will be taken, which with present rosources was not feasible).
    -   fetch the two routes based on the traffic, - find out the coordinates for which we want to fetch the aqi - fetch the aqi data for those coordinates (around 150 coordinates per route for around 300km distance) - calculate the total exposure (for each route) - compare the route and display the result

1. getting the best two routes based on the traffic - these routes are fastest and second fastest (considering the traffic) way to reach the destination.
2. Determining the route which produces less exposure to air pollution.

3. 3rd best fastest route may be considered when these two routes have aqi not significantly different. - Let's hope, the routes have very different AQI.
