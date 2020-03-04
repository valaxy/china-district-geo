import "./app.sass"
import { Component, Vue } from "vue-property-decorator"
import { buildGeoJson, scaleByLength } from '../src/geometry'

@Component
class App extends Vue {
    mounted() {
        let map = new AMap.Map((this.$refs as any).map, {

        })

        map.add(new AMap.GeoJSON({
            geoJSON: scaleByLength(buildGeoJson(require('../data/geo/province/150000.json')).multiPolygon, 2000) as any,
            getPolygon(geojson, lnglats) {
                return new AMap.Polygon({
                    path: lnglats,
                    strokeColor: null,
                    fillColor: 'red',
                    fillOpacity: 0.5,
                })
            }
        }))

        map.add(new AMap.GeoJSON({
            geoJSON: scaleByLength(buildGeoJson(require('../data/geo/province/110000.json')).multiPolygon, 2000) as any,
            getPolygon(geojson, lnglats) {
                return new AMap.Polygon({
                    path: lnglats,
                    strokeColor: null,
                    fillColor: 'blue',
                    fillOpacity: 0.5,
                })
            }
        }))
    }

    render() {
        return (
            <div class="map" ref="map"></div>
        )
    }
}



new Vue({
    render: h => h(App)
}).$mount('.everything')
