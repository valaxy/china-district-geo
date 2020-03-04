import * as turf from '@turf/turf'
import fs = require('fs-extra')
import path = require('path')
import { buildGeoJson, scaleByLength } from './geometry'

const settings = [
    {
        level: 'province',
        adcodes: Object.keys(require('../data/adcode/province_object')).map(str => str.slice(0, 6)) // 省
    },
    {
        level: 'city',
        adcodes: Object.keys(require('../data/adcode/city_object')).map(str => str.slice(0, 6)) // 市
    },
    {
        level: 'county',
        adcodes: Object.keys(require('../data/adcode/county_object')).map(str => str.slice(0, 6)) // 县
    }
]



// 这里修改setting
const setting = settings[2]

let targetPath = path.join(__dirname, `../data/adj/${setting.level}.json`)

let adj: number[][] = []

if (fs.existsSync(targetPath)) {
    adj = fs.readJSONSync(targetPath)
}

interface Item {
    adcode: string
    name: string
    poly: turf.helpers.Feature<turf.helpers.MultiPolygon>
    expandPoly: turf.helpers.Feature<turf.helpers.MultiPolygon>
    expandPolyBbox: turf.helpers.Feature<turf.helpers.Polygon>
}


const isAdjacentByBbox = function (a: Item, b: Item) {
    // 如果bbox不相交则跳过
    if (turf.booleanDisjoint(a.expandPolyBbox, b.expandPolyBbox)) {
        // console.log('bbox disjoint')
        return false
    }

    // console.log('bbox cross')
    for (let point of turf.coordAll(a.expandPoly)) {
        if (turf.booleanPointInPolygon(point, b.expandPoly)) {
            return true
        }
    }
    for (let point of turf.coordAll(b.expandPoly)) {
        if (turf.booleanPointInPolygon(point, a.expandPoly)) {
            return true
        }
    }
    return false



    // a.expandPoly.geometry.coordinates
    // return turf.booleanOverlap(a.expandPoly, b.expandPoly)

    // let list1 = a.bbox.geometry.coordinates[0].slice(0, 4)
    // let list2 = b.bbox.geometry.coordinates[0].slice(0, 4)

    // let result = []
    // for (let p1 of list1) {
    //     for (let p2 of list2) {
    //         result.push(turf.distance(p1, p2))
    //     }
    // }

    // let min = Math.min(...result)
    // return min < 10
}


const buildGeometry = function () {
    let adcodes: string[] = setting.adcodes
    let level = setting.level

    let provinceGeos: Item[] = adcodes.map(adcode => {
        let raw = require(`../data/geo/${level}/${adcode}.json`)

        if (raw.districts.length == 0) {
            return null
        }

        let { multiPolygon, district } = buildGeoJson(raw)
        let scalePoly = scaleByLength(multiPolygon, 2000)

        // fs.outputFileSync(path.join(__dirname, `../logs/${adcode}.json`), JSON.stringify(scalePoly, null, 4))
        // console.log(`${adcode}, points: ${poly.geometry.coordinates[0].length}, scalePoints: ${scalePoly.geometry.coordinates[0].length}`)

        return {
            adcode: district.adcode,
            name: district.name,
            poly: multiPolygon,
            expandPoly: scalePoly as any,
            expandPolyBbox: turf.bboxPolygon(turf.bbox(scalePoly))
        }
    })
    return provinceGeos
}


const main = function () {
    let provinceGeos = buildGeometry()
    for (let i = 0; i < provinceGeos.length; i++) {
        let x = provinceGeos[i]
        if (!x) { continue }

        if (i in adj && adj[i].length == provinceGeos.length) {
            continue
        }

        for (let j = i + 1; j < provinceGeos.length; j++) {
            let y = provinceGeos[j]
            if (!y) { continue }

            // console.log(`start calc, ${i},${j}/${provinceGeos.length}:  ${x.adcode}/${x.name} -> ${y.adcode}/${y.name}`)

            if (i in adj && j in adj[i]) {
                continue
            }


            if (!(i in adj)) {
                adj[i] = []
            }

            if (isAdjacentByBbox(x, y)) {
                console.log(`adjacent, ${x.adcode}/${x.name} -> ${y.adcode}/${y.name}`)

                adj[i][j] = 1
            } else {
                adj[i][j] = 0
            }
        }

        fs.outputFileSync(targetPath, JSON.stringify(adj))
        console.log('write to disk')
    }
}

main()