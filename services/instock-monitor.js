import checker from 'ikea-availability-checker'
import axios from 'axios'
import fetch from "node-fetch"
import { load } from 'cheerio'

export async function starInstockMonitor(notifyClients) {

    // setInterval(async function() {
    //     let res = await checker.availability('027', '00588161')
    //     console.log(new Date() + ' - Checking ikea stock, result: ' + JSON.stringify(res))
    
    //     if (res.stock > 0) {
    //         console.log(new Date() + ' - Ikea INSTOCK: ' + res.stock)
    //         axios.get(`https://tools.fmning.com/api/notifications?message=Ikea closet is in stock`).then( res => {})
    //     }
    // }, 900000)// 15 minutes


    setInterval(async function() {
        let url = `https://pishposhbaby.com/products/silver-cross-reef-2-stroller?variant=44477730193585`
        let content = await (await fetch(url)).text()

        let $ = load(content)
        let element = $('script').filter(function() {
            if ($(this).attr('type') != 'application/ld+json') return false
            return $(this).text().includes('offers')
        })
        let priceList = ''
        let price = 0
        JSON.parse(element.text()).offers.forEach(o => {
            if (o.sku == 'SX2312-GNUC') {
                price = o.price
            }
            priceList += o.price + ', '
        })

        if (price == 999.99) {
            console.log(new Date() + ' - pishposhbaby price at ' + priceList)
        } else if (price > 999.99) {
            console.log(new Date() + ' - pishposhbaby priced higher, at ' + priceList)
        } else {
            console.log(new Date() + ' - pishposhbaby priced lower, at ' + priceList)
            axios.get(`https://tools.fmning.com/api/notifications?message=Silver Cross Reef 2 Stroller has lower price at phishposhbaby`).then( res => {})
        }
    }, 900000)// 15 minutes


    setInterval(async function() {
        let url = `https://enlightenedbaby.com/products/silver-cross-reef-2-stroller?variant=46801529831656`
        let content = await (await fetch(url)).text()

        let $ = load(content)
        let element = $('script').filter(function() {
            if ($(this).attr('type') != 'application/ld+json') return false
            return $(this).text().includes('offers')
        })
        
        let price = JSON.parse(element.text()).offers.price

        if (price == 1199.99) {
            console.log(new Date() + ' - enlightenedbaby price at ' + price)
        } else if (price > 1199.99) {
            console.log(new Date() + ' - enlightenedbaby priced higher, at ' + price)
        } else {
            console.log(new Date() + ' - enlightenedbaby priced lower, at ' + price)
            axios.get(`https://tools.fmning.com/api/notifications?message=Silver Cross Reef 2 Stroller has lower price at enlightenedbaby`).then( res => {})
        }
    }, 900000)// 15 minutes

}






