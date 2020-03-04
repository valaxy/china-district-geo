import request = require('request-promise')
import fs = require('fs-extra')
import path = require('path')
import { secret } from './secret'

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

const main = async function () {
    for (let setting of settings) {
        let { level, adcodes } = setting

        for (let i = 0; i < adcodes.length; i++) {
            let adcode = adcodes[i]

            let dataFilePath = path.join(__dirname, `../data/geo/${level}/${adcode}.json`)
            if (fs.existsSync(dataFilePath)) {
                console.log(`level=${level}, exist ${i}/${adcodes.length}: ${adcode}`)
                continue
            }

            console.log(`level=${level}, start to crawl ${i}/${adcodes.length}: ${adcode}`)

            let res = await request.get('https://restapi.amap.com/v3/config/district', {
                qs: {
                    key: secret.key,
                    keywords: adcode,
                    subdistrict: 0,
                    extensions: 'all',
                },
                json: true
            })

            if (res.status != '1' || res.info != 'OK') {
                console.error(res)
                throw new Error(`crawl ${adcode} fail`)
            }

            fs.outputJSONSync(dataFilePath, res)
        }
    }
}


main()