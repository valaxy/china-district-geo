import * as turf from '@turf/turf'
import * as assert from 'assert'

export const buildGeoJson = function (raw: any) {
    assert.equal(raw.districts.length, 1)
    let district = raw.districts[0]

    return {
        district,
        multiPolygon: turf.multiPolygon([
            district.polyline.split('|').map(text => {
                return text.split(';').map(lnglatstr => {
                    let blocks = lnglatstr.split(',')
                    return [parseFloat(blocks[0]), parseFloat(blocks[1])]
                })
            })
        ])
    }
}


export const scaleByLength = function (geometry: turf.AllGeoJSON, meters: number) {
    let area = Math.abs(turf.area(geometry)) // 河北省是负数
    let bigArea = area + turf.length(geometry, { units: 'kilometers' }) * 1000 * meters // 扩大1000米的面积
    let scale = bigArea / area
    // console.log(area, bigArea, scale)
    return turf.transformScale(geometry, scale)
}