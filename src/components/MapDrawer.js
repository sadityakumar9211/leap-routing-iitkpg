import { useState, useEffect } from 'react'
import useInput from './useInput.js'
import prettyMilliseconds from 'pretty-ms'
import Instruction from './Instruction.js'
import getRouteColor from '../utils/getRouteColor.js'
import getIconFromMode from '../utils/getIconFromMode.js'
import getShortestRoute from '../controllers/getShortestRoute.js'
import getFastestRoute from '../controllers/getFastestRoute.js'
import getLeapRoute from '../controllers/getLeapRoute.js'
import getBalancedRoute from '../controllers/getBalancedRoute.js'
const prettyMetric = require('pretty-metric')
const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js')

export default function MapDrawer() {
    // Drawer
    const [isExpanded, setIsExpanded] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showColorInfo, setShowColorInfo] = useState(false)

    // Form
    const source = useInput('') //custom hook
    const destination = useInput('')
    const [mode, setMode] = useState('None')
    const [routePreference, setRoutePreference] = useState('None')
    const [distance, setDistance] = useState(0)
    const [time, setTime] = useState(0)
    const [instructions, setInstructions] = useState([])


    // Type of Routes
    const [shortestRoute, setShortestRoute] = useState({})
    const [fastestRoute, setFastestRoute] = useState({})
    const [leapRoute, setLeapRoute] = useState({})
    const [balancedRoute, setBalancedRoute] = useState({})

    // Map
    // Initial Location

    let position = [0, 0] // map start location.
    useEffect(() => {
        if (process.env.MAPBOX_API_KEY === 'undefined') {
            console.error(
                'Mapbox API Key is not set. Please set it in .env file.'
            )
            return
        }
        setupMap({ position: position, placeName: 'Default Location' })
    }, [])

    //--------------- Initializes the map object globally-------------------
    // Renders the map on the screen
    function setupMap({ position, placeName, locationType = 'default' }) {
        mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_API_KEY
        // console.log(`Position inside the setupMap is: ${position}`)
        window.$map = new mapboxgl.Map({
            container: 'map-container',
            style: 'mapbox://styles/saditya9211/clbw1qkuo000u15o2afjcpknz',
            center: position,
            zoom: 9,
            // boxZoom: true,
            // doubleClickZoom: true,
            // hash: true,
        }).fitBounds(
            [
                [67.77384991, 10.27430903], // southwest coordinates for india
                [98.44100523, 36.45878352], // northeast coordinates for india
            ],
            {
                padding: 10, // padding around the map area - extra area of map around fitBounds in some units
            }
        )
        //adding the marker to the map if the location is source or destination
        if (locationType == 'source') {
            addMarkerToMap({ position, placeName, locationType })
        } else if (locationType == 'destination') {
            addMarkerToMap({ position, placeName, locationType })
        }

        //add navigation control
        window.$map.addControl(
            new mapboxgl.NavigationControl({
                visualizePitch: true,
            }),
            'bottom-right'
        )

        // Adding Geolocation Marker - to show the user's location
        window.$map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true,
                },
                trackUserLocation: true,
                showUserHeading: true,
            })
        )
        //Scale Control
        const scale = new mapboxgl.ScaleControl({
            maxWidth: 80,
            unit: 'metric',
        })
        window.$map.addControl(scale, 'bottom-left')

        // Set marker options.
    }

    // adding marker to the map
    function addMarkerToMap({ position, placeName, locationType = 'default' }) {
        // if the marker at that location already exists
        if (
            window.$map.getLayer(
                `${position[0]}-${position[1]}-${locationType}-marker`
            )
        ) {
            // remove the marker layer
            // window.$map.removeLayer(`${position[0]}-${position[1]}-${locationType}-marker`)
            console.log('Removing the layer as it exits..')
        }
        console.log('coming out alive')
        window.$map.on('style.load', function () {
            console.log('not entering here...')
            const icon = getIconFromMode({ mode, locationType })
            icon.onload = function () {
                try {
                    window.$map.addImage(
                        `${mode}-${routePreference}-${position[0]}-${position[1]}`,
                        icon
                    )
                } catch (e) {
                    console.error(e)
                }
                window.$map.addLayer({
                    id: `${position[0]}-${position[1]}-${locationType}-marker`,
                    type: 'symbol',
                    source: {
                        type: 'geojson',
                        data: {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: position,
                            },
                            properties: {
                                title: `${placeName}`,
                            },
                        },
                    },

                    layout: {
                        'icon-image': `${mode}-${routePreference}-${position[0]}-${position[1]}`,
                        'icon-size': 0.12,
                    },
                })
            }
        })

        //popup is by default open
        new mapboxgl.Popup()
            .setLngLat(position)
            .setHTML(`<h3 color: "black"><strong>${placeName}</strong></h3>`)
            .addTo(window.$map)

        //popup on clicking the marker
        window.$map.on(
            'click',
            `${position[0]}-${position[1]}-${locationType}-marker`,
            function (e) {
                const coordinates = e.features[0].geometry.coordinates.slice()
                // var description = e.features[0].properties.description
                const title = e.features[0].properties.title
                console.log(title)
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
                }
                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(title)
                    .addTo(window.$map)
            }
        )
    }

    function displayRoute(geojson, start, end, routeId, tempRoutePreference) {
        //adding the source and destination markers found in the route
        //start marker

        //Just displays a route on the map without removing any other route.
        window.$map.addLayer({
            id: routeId,
            // id: 'route',
            type: 'line',
            source: {
                type: 'geojson',
                data: geojson,
            },
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
            },
            paint: {
                'line-color': getRouteColor(tempRoutePreference),
                'line-width': 6,
                'line-opacity': 0.65,
            },
        })

        const minLng = Math.min(start.position[0], end.position[0])
        const maxLng = Math.max(start.position[0], end.position[0])
        const minLat = Math.min(start.position[1], end.position[1])
        const maxLat = Math.max(start.position[1], end.position[1])

        window.$map.fitBounds(
            [
                [minLng, minLat], // Southwest coordinates
                [minLng, maxLat], // Northeast coordinates
            ],
            {
                padding: 100,
            }
        )
    }

    async function getMapboxRoutes() {
        console.log('Calling Mapbox API...')
        const query = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${source.position[0]},${source.position[1]};${destination.position[0]},${destination.position[1]}?steps=true&geometries=geojson&alternatives=true&access_token=${mapboxgl.accessToken}`,
            { method: 'GET' }
        )
        const json = await query.json()
        const routes = json.routes
        return routes
    }

    async function getGraphhopperRoutes(temp_mode) {
        console.log('Calling Graphhopper API...')
        const query = await fetch(
            `https://graphhopper.com/api/1/route?point=${source.position[1]},${source.position[0]}&point=${destination.position[1]},${destination.position[0]}&vehicle=${temp_mode}&debug=true&key=${process.env.REACT_APP_GRAPHHOPPER_API_KEY}&type=json&points_encoded=false&algorithm=alternative_route&alternative_route.max_paths=4&alternative_route.max_weight_factor=1.6&alternative_route.max_share_factor=0.7`,
            { method: 'GET' }
        )
        const json = await query.json()
        const routes = json.paths // Two routes
        return routes
    }

    async function getAllRoutes(start, end) {
        //Handle the all routes cases - default case
        //display the shortest route in the given mode

        console.log('Inside getAllRoutes...')
        let temp_mode = mode
        let temp_routePreference = routePreference //intially - all

        // removing all the other routes
        let layers = window.$map.getStyle().layers
        console.log({ layers })
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].id.includes('-route')) {
                window.$map.removeLayer(layers[i].id)
                window.$map.removeSource(layers[i].id)
            }
        }

        //Shortest Path
        temp_routePreference = 'shortest'

        console.log('Shortest Path...')
        if (temp_mode == 'truck-traffic') temp_mode = 'truck'
        else if (temp_mode == 'driving-traffic') temp_mode = 'car'

        let geojson
        let routes = await getGraphhopperRoutes(temp_mode)
        ;({ geojson, routes } = getShortestRoute(routes, temp_mode))

        let routeId = `${temp_mode}-${temp_routePreference}-${start.position[0]}-${start.position[1]}-${end.position[0]}-${end.position[1]}-route-all`
        if (window.$map.getSource(routeId)) {
            console.log('changing the route source data...')
            setShortestRoute(routes[0])
            window.$map.getSource(routeId).setData(geojson)
        } else {
            console.log('displaying a new route...')
            setShortestRoute(routes[0])
            displayRoute(geojson, start, end, routeId, 'shortest')
        }

        //Fastest
        //display the fastest route in the given mode
        temp_routePreference = 'fastest'
        console.log('Fastest Path...')
        if (temp_mode == 'car') temp_mode = 'driving-traffic'
        else if (temp_mode == 'truck') temp_mode = 'truck-traffic'

        if (temp_mode.includes('traffic')) {
            routes = await getMapboxRoutes()
        } else {
            routes = await getGraphhopperRoutes(temp_mode)
        }
        ;({ geojson, routes } = getFastestRoute(routes, temp_mode))

        routeId = `${temp_mode}-${temp_routePreference}-${start.position[0]}-${start.position[1]}-${end.position[0]}-${end.position[1]}-route-all`
        if (window.$map.getSource(routeId)) {
            window.$map.getSource(routeId).setData(geojson)
            setFastestRoute(routes[0])
            console.log('changing the route source data...')
        } else {
            console.log('displaying a new route...')
            setFastestRoute(routes[0])
            displayRoute(geojson, start, end, routeId, 'fastest')
        }

        //Leap Route
        console.log('Leap Path...')
        //display the leap route in the given mode
        temp_routePreference = 'leap'

        if (temp_mode == 'truck-traffic') temp_mode = 'truck'
        else if (temp_mode == 'driving-traffic') temp_mode = 'car'

        routes = await getGraphhopperRoutes(temp_mode)
        console.log('The graphhopper routes is, ', { routes })
        ;({ geojson, routes } = await getLeapRoute(routes))

        routeId = `${temp_mode}-${temp_routePreference}-${start.position[0]}-${start.position[1]}-${end.position[0]}-${end.position[1]}-route-all`
        if (window.$map.getSource(routeId)) {
            console.log('changing the route source data...')
            setLeapRoute(routes[0])
            window.$map.getSource(routeId).setData(geojson)
        } else {
            console.log('displaying a new route...')
            console.log({ geojson })
            console.log({ routes })
            setLeapRoute(routes[0])
            displayRoute(geojson, start, end, routeId, 'leap')
        }

        //Balanced Route
        //display the balanced route in the given mode
        console.log('Balanced Path...')

        temp_routePreference = 'balanced'

        if (temp_mode == 'car') temp_mode = 'driving-traffic'
        else if (temp_mode == 'truck') temp_mode = 'truck-traffic'

        if (
            temp_mode === 'foot' ||
            temp_mode === 'bike' ||
            temp_mode === 'scooter'
        ) {
            routes = await getGraphhopperRoutes(temp_mode)
        } else {
            routes = await getMapboxRoutes()
        }

        ;({ geojson, routes } = await getBalancedRoute(routes, temp_mode))

        routeId = `${temp_mode}-${temp_routePreference}-${start.position[0]}-${start.position[1]}-${end.position[0]}-${end.position[1]}-route-all`
        if (window.$map.getSource(routeId)) {
            console.log('changing the current source data...')
            window.$map.getSource(routeId).setData(geojson)
            setBalancedRoute(routes[0])
            setIsLoading(false)
        } else {
            console.log('Displaying a new route...')
            displayRoute(geojson, start, end, routeId, 'balanced')
            setBalancedRoute(routes[0])
            setIsLoading(false)
        }
    }

    // Fetches the route and displays it in the map
    const getRoutes = async (start, end) => {
        if (start != '' && end != '') {
            console.log(
                'Running getRoutes... with mode: ' +
                    mode +
                    ' and routePreference: ' +
                    routePreference
            )
            try {
                console.log('Before query...')

                let temp_mode = `${mode}` + ''
                let temp_routePreference = `${routePreference}` + ''

                //modifies the mode and routePreference
                function adjustModeRoutePreference(temp_routePreference) {
                    if (temp_routePreference == 'balanced') {
                        if (temp_mode == 'car') {
                            setMode('driving-traffic')
                            temp_mode = 'driving-traffic'
                        } else if (temp_mode == 'truck') {
                            setMode('truck-traffic')
                            temp_mode = 'truck-traffic'
                        }
                    } else if (temp_routePreference == 'leap') {
                        if (temp_mode == 'driving-traffic') {
                            setMode('car')
                            temp_mode = 'car'
                        } else if (temp_mode == 'truck-traffic') {
                            setMode('truck')
                            temp_mode = 'truck'
                        }
                    } else if (temp_routePreference == 'shortest') {
                        if (temp_mode == 'truck-traffic') {
                            setMode('truck')
                            temp_mode = 'truck'
                        } else if (temp_mode == 'driving-traffic') {
                            setMode('car')
                            temp_mode = 'car'
                        }
                    } else if (temp_routePreference == 'fastest') {
                        if (temp_mode == 'truck') {
                            setMode('truck-traffic')
                            temp_mode = 'truck-traffic'
                        } else if (temp_mode == 'car') {
                            setMode('driving-traffic')
                            temp_mode = 'driving-traffic'
                        }
                    }
                }

                // adjusting the mode and routePreference
                adjustModeRoutePreference(temp_routePreference)

                console.log({ mode, routePreference })
                console.log({ temp_mode, temp_routePreference })

                let routes
                if (temp_mode.includes('traffic')) {
                    routes = await getMapboxRoutes()
                    console.log('Route from Mapbox: ', routes)
                } else {
                    routes = await getGraphhopperRoutes(temp_mode)
                    console.log('Route from Graphhoperr: ', routes)
                }
                console.log({ routes })
                // const geojson = {
                //     type: 'Feature',
                //     properties: {},
                //     geometry: {
                //         type: 'LineString',
                //         coordinates: '',
                //     },
                // }

                let geojson
                let layers
                let returnVal
                let routeId = `${temp_mode}-${temp_routePreference}-${start.position[0]}-${start.position[1]}-${end.position[0]}-${end.position[1]}-route`
                switch (temp_routePreference) {
                    case 'shortest':
                        console.log('Shortest Path...')
                        ;({ geojson, routes } = getShortestRoute(
                            routes,
                            temp_mode
                        ))

                        setDistance(routes[0].distance)
                        if (temp_mode.includes('traffic')) {
                            setTime(routes[0].duration)
                            setInstructions(routes[0].legs[0].steps)
                        } else {
                            setTime(routes[0].time)
                            setInstructions(routes[0].instructions)
                        }

                        // display this map
                        // removing all the layers and sources from the map before adding the shortest route
                        //we can also make the visibility property - 'none'
                        layers = window.$map.getStyle().layers
                        console.log({ layers })
                        for (let i = 0; i < layers.length; i++) {
                            if (layers[i].id.includes('-route')) {
                                window.$map.removeLayer(layers[i].id)
                                window.$map.removeSource(layers[i].id)
                            }
                        }
                        routeId = `${temp_mode}-${temp_routePreference}-${start.position[0]}-${start.position[1]}-${end.position[0]}-${end.position[1]}-route`
                        if (window.$map.getSource(routeId)) {
                            window.$map.getSource(routeId).setData(geojson)
                            setShortestRoute(routes[0])
                            setIsLoading(false)
                        } else {
                            // This is how we define the id of the route.
                            setShortestRoute(routes[0])
                            displayRoute(
                                geojson,
                                start,
                                end,
                                routeId,
                                'shortest'
                            )
                            setIsLoading(false)
                        }
                        break

                    case 'fastest':
                        console.log('Fastest Path...')
                        ;({ geojson, routes } = getFastestRoute(
                            routes,
                            temp_mode
                        ))

                        setDistance(routes[0].distance)

                        if (temp_mode.includes('traffic')) {
                            setTime(routes[0].duration)
                            setInstructions(routes[0].legs[0].steps)
                        } else {
                            setTime(routes[0].time)
                            setInstructions(routes[0].instructions)
                        }

                        //removing all the routes from map
                        layers = window.$map.getStyle().layers
                        for (let i = 0; i < layers.length; i++) {
                            if (layers[i].id.includes('-route')) {
                                window.$map.removeLayer(layers[i].id)
                                window.$map.removeSource(layers[i].id)
                            }
                        }

                        routeId = `${temp_mode}-${temp_routePreference}-${start.position[0]}-${start.position[1]}-${end.position[0]}-${end.position[1]}-route`
                        if (window.$map.getSource(routeId)) {
                            window.$map.getSource(routeId).setData(geojson)
                            setFastestRoute(routes[0])
                            setIsLoading(false)
                        } else {
                            setFastestRoute(routes[0])
                            displayRoute(
                                geojson,
                                start,
                                end,
                                routeId,
                                'fastest'
                            )
                            setIsLoading(false)
                        }
                        break

                    case 'leap':
                        console.log('LEAP Path...') //get the routes from the graphhopper api  ✅
                        //get the aqi values for the routes from waqi api ✅
                        //and then sort them based on the aqi values ✅

                        // if the mode is driving traffic or truck traffic then ignore the leap path
                        // otherwise find the leap path and display it.

                        //ignoring the traffic in case of the greenest route.
                        ;({ geojson, routes } = await getLeapRoute(routes))

                        setDistance(routes[0].distance)

                        if (temp_mode.includes('traffic')) {
                            setTime(routes[0].duration)
                            setInstructions(routes[0].legs[0].steps)
                        } else {
                            setTime(routes[0].time)
                            setInstructions(routes[0].instructions)
                        }

                        //removing all the other routes
                        layers = window.$map.getStyle().layers
                        console.log({ layers })
                        for (let i = 0; i < layers.length; i++) {
                            if (layers[i].id.includes('-route')) {
                                window.$map.removeLayer(layers[i].id)
                                window.$map.removeSource(layers[i].id)
                            }
                        }

                        routeId = `${temp_mode}-${temp_routePreference}-${start.position[0]}-${start.position[1]}-${end.position[0]}-${end.position[1]}-route`
                        //if same route is present - then we modify its source
                        if (window.$map.getSource(routeId)) {
                            window.$map.getSource(routeId).setData(geojson)
                            setLeapRoute(routes[0])
                            setIsLoading(false)
                        } else {
                            displayRoute(geojson, start, end, routeId, 'leap')
                            setLeapRoute(routes[0])
                            setIsLoading(false)
                        }
                        console.log('Leap Route displayed...')
                        break

                    case 'balanced':
                        console.log('Balanced Path...')
                        ;({ geojson, routes } = await getBalancedRoute(
                            routes,
                            mode
                        ))

                        setDistance(routes[0].distance)

                        if (temp_mode.includes('traffic')) {
                            setTime(routes[0].duration)
                            setInstructions(routes[0].legs[0].steps)
                        } else {
                            setTime(routes[0].time)
                            setInstructions(routes[0].instructions)
                        }

                        //removing all the other routes
                        layers = window.$map.getStyle().layers
                        console.log({ layers })
                        for (let i = 0; i < layers.length; i++) {
                            if (layers[i].id.includes('-route')) {
                                window.$map.removeLayer(layers[i].id)
                                window.$map.removeSource(layers[i].id)
                            }
                        }

                        routeId = `${temp_mode}-${temp_routePreference}-${start.position[0]}-${start.position[1]}-${end.position[0]}-${end.position[1]}-route`
                        if (window.$map.getSource(routeId)) {
                            window.$map.getSource(routeId).setData(geojson)
                            setBalancedRoute(routes[0])
                            setIsLoading(false)
                        } else {
                            setBalancedRoute(routes[0])
                            displayRoute(
                                geojson,
                                start,
                                end,
                                routeId,
                                'balanced'
                            )
                            setIsLoading(false)
                        }
                        console.log('Balanced Route displayed...')
                        break
                }
            } catch (e) {
                setIsLoading(false)
                console.log(e)
            }
        }
    }
    return (
        <div className="drawer">
            <input
                id="my-drawer"
                type="checkbox"
                className="drawer-toggle"
                onClick={() => {
                    setIsExpanded(!isExpanded)
                }}
            />

            <div className="drawer-content">
                <label
                    htmlFor="my-drawer"
                    className="btn drawer-button btn-secondary btn-sm right-12 top-2  absolute z-40"
                >
                    {isExpanded ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
                            />
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5"
                            />
                        </svg>
                    )}
                </label>
                <div>
                    <div className="w-screen abosolute -z-30 mr-5">
                        <div
                            id="map-container"
                            className="h-screen w-full"
                        ></div>
                    </div>
                </div>
            </div>
            <div className="drawer-side">
                <label htmlFor="my-drawer" className="drawer-overlay"></label>
                <div
                    className={'menu p-4 bg-base-100 w-10/12 md:w-1/3 lg:w-1/4'}
                >
                    <h1 className="text-lg font-semibold title-font text-center border-b-2 pb-2 mx-auto mb-4">
                        Air Pollution Routing - IIT KGP
                    </h1>
                    <form>
                        <div className="flex flex-col space-y-3 items-center">
                            <input
                                type="text"
                                placeholder="Enter Source"
                                className="input input-sm input-bordered mt-0 w-full max-w-xs"
                                required
                                {...source}
                                value={source.value}
                            />
                            <div>
                                {source.suggestions?.length > 0 && (
                                    <div
                                        name="suggestion-wrapper"
                                        className="bg-gray-600 text-white absolute right-0 w-11/12 border rounded-md z-50"
                                    >
                                        {source.suggestions.map(
                                            (suggestion, index) => {
                                                return (
                                                    <div
                                                        key={index}
                                                        className="hover:cursor-pointer max-w-sm border-b-2 border-gray-400 p-2"
                                                        onClick={() => {
                                                            console.log(
                                                                suggestion.center
                                                            )
                                                            source.setValue(
                                                                suggestion.text
                                                            )
                                                            source.setPosition(
                                                                suggestion.center
                                                            )
                                                            source.setSuggestions(
                                                                []
                                                            )
                                                            console.log({
                                                                suggestion,
                                                            })
                                                            setupMap({
                                                                position:
                                                                    suggestion.center,
                                                                placeName:
                                                                    suggestion.text,
                                                                locationType:
                                                                    'source',
                                                            })
                                                        }}
                                                    >
                                                        {suggestion.place_name}
                                                    </div>
                                                )
                                            }
                                        )}
                                    </div>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="Enter Destination"
                                className="input input-sm input-bordered w-full max-w-xs"
                                required
                                {...destination}
                                value={destination.value}
                            />
                            <div>
                                {destination.suggestions?.length > 0 && (
                                    <div
                                        name="suggestion-wrapper"
                                        className="bg-gray-600 text-white absolute right-0 w-11/12 border rounded-md z-50"
                                    >
                                        {destination.suggestions.map(
                                            (suggestion, index) => {
                                                return (
                                                    <div
                                                        key={index}
                                                        className="hover:cursor-pointer max-w-sm border-b-2 border-gray-400 p-2"
                                                        onClick={() => {
                                                            console.log(
                                                                suggestion.center
                                                            )
                                                            destination.setValue(
                                                                suggestion.text
                                                            )
                                                            destination.setPosition(
                                                                suggestion.center
                                                            )
                                                            destination.setSuggestions(
                                                                []
                                                            )
                                                            console.log({
                                                                suggestion,
                                                            })
                                                            setupMap({
                                                                position:
                                                                    suggestion.center,
                                                                placeName:
                                                                    suggestion.text,
                                                                locationType:
                                                                    'destination',
                                                            })
                                                            addMarkerToMap({
                                                                position:
                                                                    source.position,
                                                                placeName:
                                                                    source.value,
                                                                locationType:
                                                                    'source',
                                                            })
                                                        }}
                                                    >
                                                        {suggestion.place_name}
                                                    </div>
                                                )
                                            }
                                        )}
                                    </div>
                                )}
                            </div>
                            <select
                                className="select select-sm select-bordered w-full max-w-xs"
                                required
                                value={mode}
                                onChange={(e) => {
                                    setMode(e.target.value)
                                    console.log(e.target.value)
                                }}
                            >
                                <option disabled value="none">
                                    Select Mode of Transport
                                </option>
                                <option value="driving-traffic">Car</option>
                                <option value="truck-traffic">Bus</option>
                                {/* <option value="car">Car - Driving</option> */}
                                <option value="scooter">Motorbike</option>
                                <option value="bike">Cycling</option>
                                <option value="foot">Walking</option>
                            </select>

                            <div className="flex flex-row justify-evenly items-center">
                                <select
                                    className="select select-sm select-bordered max-w-xs"
                                    required
                                    value={routePreference}
                                    onChange={(e) => {
                                        setRoutePreference(e.target.value)
                                        console.log(e.target.value)
                                    }}
                                >
                                    <option disabled value="none">
                                        Select Route Preference
                                    </option>
                                    <option value="shortest">
                                        Shortest (Distance)
                                    </option>
                                    <option value="fastest">
                                        Fastest (Time)
                                    </option>
                                    <option value="leap">
                                        LEAP (exposure)
                                    </option>
                                    <option value="safest">Safe (Crime)</option>
                                    <option value="emission">
                                        Least Carbon Emission(CO<sub>2</sub>)
                                    </option>
                                    <option value="balanced">
                                        Optimal (recommended)
                                    </option>
                                    <option value="all">All</option>
                                </select>
                                <div className="ml-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-6 h-6"
                                        onClick={() => {
                                            setShowColorInfo(!showColorInfo)
                                            console.log('click registered')
                                        }}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <div className={showColorInfo ? 'block' : 'hidden'}>
                                <div className="flex flex-row space-x-6 items-center">
                                    <div className="flex flex-col justify-center items-center">
                                        <div className="w-6 h-6 bg-shortest rounded-full"></div>
                                        <div className="text-xs">Shortest</div>
                                    </div>
                                    <div className="flex flex-col justify-center items-center">
                                        <div className="w-6 h-6 bg-fastest rounded-full"></div>
                                        <div className="text-xs">Fastest</div>
                                    </div>
                                    <div className="flex flex-col justify-center items-center">
                                        <div className="w-6 h-6 bg-leap rounded-full"></div>
                                        <div className="text-xs">LEAP</div>
                                    </div>
                                    <div className="flex flex-col justify-center items-center">
                                        <div className="w-6 h-6 bg-balanced rounded-full"></div>
                                        <div className="text-xs">Optimal</div>
                                    </div>
                                </div>
                            </div>
                            <button
                                className="btn btn-wide"
                                onClick={(e) => {
                                    e.preventDefault()
                                    //Fetch the routes and display on the map
                                    if (routePreference == 'all') {
                                        getAllRoutes(source, destination)
                                    } else {
                                        getRoutes(source, destination)
                                    }
                                    setupMap({
                                        position: destination.position,
                                        placeName: destination.value,
                                        locationType: 'destination',
                                    })
                                    addMarkerToMap({
                                        position: source.position,
                                        placeName: source.value,
                                        locationType: 'source',
                                    })
                                    setIsLoading(true)
                                }}
                            >
                                Find
                            </button>
                        </div>
                    </form>
                    <div>
                        <div className="text-center text-xl">
                            <span className="text-green-400">
                                {isLoading
                                    ? prettyMilliseconds(0)
                                    : mode.includes('traffic') //we have an error here...
                                    ? prettyMilliseconds(time * 1000)
                                    : prettyMilliseconds(time)}{' '}
                            </span>
                            <span className="text-white">|</span>{' '}
                            <span className="text-orange-500">
                                {isLoading
                                    ? prettyMetric(0).humanize()
                                    : prettyMetric(distance).humanize()}
                            </span>
                        </div>
                        <div className="collapse mt-1">
                            <input type="checkbox" />
                            <div className="collapse-title text-xl font-medium text-center underline">
                                Instructions
                            </div>
                            <div className="collapse-content">
                                {instructions.length > 0 && !isLoading ? (
                                    <div className="overflow-auto h-80">
                                        <ol>
                                            {instructions.map(
                                                (instruction, index) => {
                                                    return (
                                                        <li key={index}>
                                                            <Instruction
                                                                key={index}
                                                                index={index}
                                                                instruction={
                                                                    instruction
                                                                }
                                                                mode={mode}
                                                            />
                                                        </li>
                                                    )
                                                }
                                            )}
                                        </ol>
                                    </div>
                                ) : isLoading ? (
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm mb-2">
                                            Fetching Data...
                                        </span>
                                        <progress className="progress w-11/12 progress-info"></progress>
                                    </div>
                                ) : (
                                    <div className="flex flex-row justify-center">
                                        <span>Wow Such Empty!!</span>
                                        <span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-6 h-6 ml-2"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
                                                />
                                            </svg>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="collapse mt-2">
                            <input type="checkbox" />
                            <div className="collapse-title text-xl font-medium text-center underline">
                                Route Details
                            </div>
                            <div className="collapse-content">
                                {routePreference == 'all' ? (
                                    <div>Details of all the routes one-by-one</div>
                                ) : (
                                    <ul>
                                        <li>Vehicle Profile: {mode}</li>
                                        <li>
                                            Route Preference: {routePreference}
                                        </li>
                                        

                                        { routePreference == 'shortest'? (
                                            <li>Distance: {prettyMetric(shortestRoute.distance).humanize()}</li>
                                        ): (
                                            routePreference == 'fastest'? (
                                                <li>Distance: {prettyMetric(fastestRoute.distance).humanize()}</li>
                                            ) : (
                                                routePreference == 'leap'? (
                                                    <li>Distance: {prettyMetric(leapRoute.distance).humanize()}</li>
                                                ) : (
                                                    routePreference == 'balanced'? (
                                                        <li>Distance: {prettyMetric(balancedRoute.distance).humanize()}</li>
                                                    ):(
                                                        <li>Distance: {`No Route Selected`}</li>
                                                    )
                                                )
                                            )
                                        )}
                                        { routePreference == 'shortest'? (
                                            <li>Time Taken: {shortestRoute.time}</li>
                                        ): (
                                            routePreference == 'fastest'? (
                                                <li>Time Taken: {fastestRoute.duration}</li>
                                            ) : (
                                                routePreference == 'leap'? (
                                                    <li>Time Taken: {leapRoute.time}</li>
                                                ) : (
                                                    routePreference == 'balanced'? (
                                                        <li>Time Taken: {balancedRoute.duration}</li>
                                                    ):(
                                                        <li>Time Taken: {`No Route Selected`}</li>
                                                    )
                                                )
                                            )
                                        )}

                                        { routePreference == 'shortest'? (
                                            <li>Exposure: {shortestRoute.totalExposure}</li>
                                        ): (
                                            routePreference == 'fastest'? (
                                                <li>Exposure: {fastestRoute.totalExposure}</li>
                                            ) : (
                                                routePreference == 'leap'? (
                                                    <li>Exposure: {leapRoute.totalExposure}</li>
                                                ) : (
                                                    routePreference == 'balanced'? (
                                                        <li>Exposure: {balancedRoute.totalExposure}</li>
                                                    ):(
                                                        <li>Exposure: {`No Route Selected`}</li>
                                                    )
                                                )
                                            )
                                        )}
                                        
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
