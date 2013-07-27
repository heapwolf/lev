var multilevel = require('multilevel')
var net = require('net')
var level = require('level')

var svr = level('./db-server') 
        net.createServer(function (con) { 
           con.pipe(multilevel.server(svr)).pipe(con) 
}).listen(3000) 
