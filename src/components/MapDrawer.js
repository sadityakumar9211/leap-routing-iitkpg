import { useState, useEffect } from 'react'
import useInput from './useInput.js'
import prettyMilliseconds from 'pretty-ms'
import Instruction from './Instruction.js'
const prettyMetric = require('pretty-metric')
const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js')

export default function MapDrawer() {
    // Drawer
    const [isExpanded, setIsExpanded] = useState(false)
    const handleExpand = () => {
        setIsExpanded(!isExpanded)
    }

    // Form
    const source = useInput('')
    const destination = useInput('')
    const [mode, setMode] = useState('none')
    const [routePreference, setRoutePreference] = useState('none')
    const [distance, setDistance] = useState(0)
    const [time, setTime] = useState(0)
    const [instructions, setInstructions] = useState([])

    useEffect(() => {}, [source, destination, mode, routePreference])

    // Map
    // Initial Location

    function getRouteColor(mode) {
        if (routePreference == 'fastest') return '#f15bb5'
        else if (routePreference == 'shortest') return '#00bbf9'
        else if (mode == 'walking') return '#00f5d4'
        else if (mode == 'cycling') return '#9b5de5'
    }

    const [position, setPosition] = useState([0,0])   //initial position
    let currentMarker = ''
    useEffect(() => {
        if (process.env.MAPBOX_API_KEY === 'undefined') {
            console.log(
                'Mapbox API Key is not set. Please set it in .env file.'
            )
            return
        } else {
            console.log(process.env.MAPBOX_API_KEY)
        }

        setupMap({ position, placeName: 'Default Location' })
    }, [])

    //--------------- Initializes the map object globally-------------------

    //updates the map-ads the marker and popups

    //Initializes the map
    function setupMap({ position, placeName, locationType="default"}) {
        mapboxgl.accessToken =
            'pk.eyJ1Ijoic2FkaXR5YTkyMTEiLCJhIjoiY2xidzNvcWQ2MXlrazNucW5rcGxnc2RncCJ9.1GMKNUsQUmXSxvrOqlDnsw'
        console.log(`Position inside the setupMap is: ${position}`)
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
                [67.77384991, 10.27430903],
                [98.44100523, 36.45878352],
            ],
            {
                padding: 20,
            }
        )
        // navigation control
        if (locationType == "source" || locationType=="destination") {
            //add marker
            console.log("Add Marker at " + `${locationType}`)
            new mapboxgl.Marker({
                color: '#b32d2d',
                // draggable: true,
            })
                .setLngLat(position)
                .addTo(window.$map)
                .setPopup(
                    new mapboxgl.Popup().setHTML(
                        `<p>${position}</p><p>(${placeName})</p>`
                    ), {
                        closeOnClick: true
                    }
                )
            
            
        }

        window.$map.addControl(
            new mapboxgl.NavigationControl({
                visualizePitch: true,
            }),
            'bottom-right'
        )

        // Adding Geolocation Marker
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
            unit: 'imperial',
        })
        window.$map.addControl(scale, 'bottom-left')

        scale.setUnit('metric')

        // Set marker options.
    }
    function displayRoute(geojson, start, end, route) {
        //Just displays the route on the map without removing any other route.

        console.log({
            geojson,
            start,
            end,
        })

        window.$map.addLayer({
            id: 'route',
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
                'line-color': getRouteColor(mode),
                'line-width': 6,
                'line-opacity': 1,
            },
        })
        //adding the source and destination markers found in the route
        //start marker
        new mapboxgl.Marker({
            color: '#b32d2d',
            // draggable: true,
        })
            .setLngLat(start.position)
            .addTo(window.$map)
            // add popup
            .setPopup(
                new mapboxgl.Popup().setHTML(
                    `<p>${start.value}</p><p>(${start.position})</p>`
                )
            )
        //end marker
        new mapboxgl.Marker({
            color: '#b32d2d',
            // draggable: true,
        })
            .setLngLat(end.position)
            .addTo(window.$map)
            .setPopup(
                new mapboxgl.Popup().setHTML(
                    `<p>${end.value}</p><p>(${end.position})</p>`
                )
            )

        // Add bound box for the map - to fit the route map to screen

        let bbox
        if (mode !== 'driving-traffic') {
            bbox = route.bbox
        } else {
            const minLng = Math.min(start.position[0], end.position[0])
            const maxLng = Math.max(start.position[0], end.position[0])
            const minLat = Math.min(start.position[1], end.position[1])
            const maxLat = Math.max(start.position[1], end.position[1])
            bbox = [minLng, minLat, maxLng, maxLat]
        }
        window.$map.fitBounds(
            [
                [bbox[0], bbox[1]], // Southwest coordinates
                [bbox[2], bbox[3]], // Northeast coordinates
            ],
            {
                padding: 300,
            }
        )
    }

    // Fetches the route and displays it in the map
    const getRoutes = async (start, end) => {
        console.log('getRoutes', start.position, end.position)
        try {
            console.log('Before query...')
            let routes
            if (mode === 'driving-traffic') {
                const query = await fetch(
                    `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${start.position[0]},${start.position[1]};${end.position[0]},${end.position[1]}?steps=true&geometries=geojson&alternatives=true&access_token=${mapboxgl.accessToken}`,
                    { method: 'GET' }
                )
                const json = await query.json()
                routes = json.routes
            } else {
                const query = await fetch(
                    `https://graphhopper.com/api/1/route?point=${start.position[1]},${start.position[0]}&point=${end.position[1]},${end.position[0]}&vehicle=${mode}&debug=true&key=9720b98f-be36-41e3-b202-e20a55e5924f&type=json&points_encoded=false&algorithm=alternative_route&alternative_route.max_paths=3`,
                    { method: 'GET' }
                )

                const json = await query.json()
                console.log(json)
                routes = json.paths // Two routes
            }
            console.log(routes)
            const geojson = {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: '',
                },
            }

            console.log('Route Preference: ', routePreference)
            switch (routePreference) {
                case 'shortest':
                    console.log('Shortest Path...')
                    routes.sort((a, b) => a.distance - b.distance)
                    setDistance(routes[0].distance)
                    if (mode === 'driving-traffic') {
                        geojson.geometry.coordinates =
                            routes[0].geometry.coordinates
                        setTime(routes[0].duration)
                        setInstructions(routes[0].legs[0].steps)
                    } else {
                        geojson.geometry.coordinates =
                            routes[0].points.coordinates
                        setTime(routes[0].time)
                        setInstructions(routes[0].instructions)
                    }

                    console.log({ geojson })
                    if (window.$map.getSource('route')) {
                        window.$map.getSource('route').setData(geojson)
                    } else {
                        displayRoute(geojson, start, end, routes[0])
                    }
                    break

                case 'fastest':
                    console.log('Fastest Path...')
                    routes.sort((a, b) => a.time - b.time)
                    setDistance(routes[0].distance)
                    if (mode === 'driving-traffic') {
                        geojson.geometry.coordinates =
                            routes[0].geometry.coordinates
                        setTime(routes[0].duration)
                        setInstructions(routes[0].legs[0].steps)
                    } else {
                        geojson.geometry.coordinates =
                            routes[0].points.coordinates
                        setTime(routes[0].time)
                        setInstructions(routes[0].instructions)
                    }
                    console.log({ geojson })
                    if (window.$map.getSource('route')) {
                        window.$map.getSource('route').setData(geojson)
                    } else {
                        displayRoute(geojson, start, end, routes[0])
                    }
                    break

                case 'greenest':
                    console.log('Greenest Path...')
                    console.log('Greenest Route to be displayed here')
                    break

                case 'balanced':
                    console.log('Balanced Path...')
                    console.log('Balanced Route to be displayed here')
                    break
                default:
                    break
            }

            if (routePreference === 'all') {
                //Handle the all routes cases
                //Display all the routes one by one
            }
        } catch (e) {
            console.log(e)
        }
    }

    return (
        <div className="drawer">
            <input
                id="my-drawer"
                type="checkbox"
                className="drawer-toggle"
                onClick={handleExpand}
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
                <div className={"menu p-4 bg-base-100 text-base-content w-1/3" } >
                    <h1 className="text-xl font-semibold title-font text-center border-b-2 pb-2 mx-auto mb-4">
                        Air Polllution Routing
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
                                        className="bg-gray-600 text-white absolute w-11/12 border rounded-md z-50"
                                    >
                                        {source.suggestions.map(
                                            (suggestion, index) => {
                                                return (
                                                    <div
                                                        key={index}
                                                        className="hover:cursor-pointer max-w-sm"
                                                        onClick={() => {
                                                            console.log(
                                                                suggestion.center
                                                            )
                                                            source.setValue(
                                                                suggestion.place_name
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
                                                                    suggestion.place_name,
                                                                locationType: "source",
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
                                        className="bg-gray-600 text-white absolute w-11/12 border rounded-md z-50"
                                    >
                                        {destination.suggestions.map(
                                            (suggestion, index) => {
                                                return (
                                                    <div
                                                        key={index}
                                                        className="hover:cursor-pointer max-w-sm"
                                                        onClick={() => {
                                                            console.log(
                                                                suggestion.center
                                                            )
                                                            destination.setValue(
                                                                suggestion.place_name
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
                                                                    suggestion.place_name,
                                                                locationType: "destination",
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
                                <option value="driving-traffic">
                                    Car - Traffic
                                </option>
                                <option value="car">Car - Driving</option>
                                <option value="truck">Truck</option>
                                <option value="Scooter">Motorbike</option>
                                <option value="bike">Cycling</option>
                                <option value="foot">Walking</option>
                            </select>

                            <select
                                className="select select-sm select-bordered w-full max-w-xs"
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
                                <option value="fastest">Fastest (Time)</option>
                                <option value="leap">LEAP (exposure)</option>
                                <option value="safe">
                                    Safe (Crime/Accidents)
                                </option>
                                <option value="emission">
                                    LCE(CO<sub>2</sub>)
                                </option>
                                <option value="balanced">
                                    Balanced (recommended)
                                </option>
                                <option value="all">All</option>
                            </select>
                            <button
                                className="btn btn-wide"
                                onClick={(e) => {
                                    e.preventDefault()
                                    //Fetch the routes and display on the map
                                    console.log({ source, destination })
                                    getRoutes(source, destination)
                                }}
                            >
                                Find
                            </button>
                        </div>
                    </form>
                    <div>
                        <div className="text-center text-xl">
                            <span className="text-green-400">
                                {mode === 'driving-traffic'
                                    ? prettyMilliseconds(time * 1000)
                                    : prettyMilliseconds(time)}{' '}
                            </span>
                            <span className="text-white">|</span>{' '}
                            <span className="text-orange-500">
                                {prettyMetric(distance).humanize()}
                            </span>
                        </div>
                        <div className="mt-1">
                            <div className="text-xl text-center">
                                Instructions
                            </div>
                            {instructions.length > 0 ? (
                                <div className="overflow-scroll h-80">
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
                </div>
            </div>
        </div>
    )
}
