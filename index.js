const processDebug = require('debug')('Importer')
const axios = require('axios')
processDebug('Start Process importer')

// we are going to fetch data and insert into mysql to use with cubejs analytics
// TODO: validate enviroments variable

let nextUrl = `${process.env.TORRE_URL}?size=${process.env.TORRE_URL_SIZE}`
