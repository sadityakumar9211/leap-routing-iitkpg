/*
 ==>  ----- PM2.5 (µg/m3) = (AQI/500) x (Ih - Il) x (Ch - Cl) + Cl ----- <==
where 
- AQI is the Air Quality Index value
- Ih and Il are the breakpoints immediately above and below the AQI value, respectively
- Ch and Cl are the PM2.5 concentration values corresponding to Ih and Il, respectively
*/

export default function convertAQIToPM25(aqiValue) {
    const breakpoints = [
        { aqi: 0, ih: 50, il: 0, ch: 12.0, cl: 0.0 },
        { aqi: 51, ih: 100, il: 51, ch: 35.4, cl: 12.1 },
        { aqi: 101, ih: 150, il: 101, ch: 55.4, cl: 35.5 },
        { aqi: 151, ih: 200, il: 151, ch: 150.4, cl: 55.5 },
        { aqi: 201, ih: 300, il: 201, ch: 250.4, cl: 150.5 },
        { aqi: 301, ih: 400, il: 301, ch: 350.4, cl: 250.5 },
        { aqi: 401, ih: 500, il: 401, ch: 500.4, cl: 350.5 },
    ]

    for (let i = 0; i < breakpoints.length; i++) {
        if (aqiValue >= breakpoints[i].il && aqiValue <= breakpoints[i].ih) {
            return (
                (aqiValue / 500) *
                    (breakpoints[i].ih - breakpoints[i].il) *
                    (breakpoints[i].ch - breakpoints[i].cl) +
                breakpoints[i].cl
            )
        }
    }

    return null
}


