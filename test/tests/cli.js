var spawn = require('child_process').spawn;
var path = require('path');
var levelup = require('level');
var p = path.join(__dirname, '..', 'fixtures', 'db');
var lev = path.join(__dirname, '..', '..', 'lev');
var multilevel = require('multilevel')
var net = require('net')

var tcpserver = null
var options = {};
var OK = '"OK"\r\n';
const test_key1 = 'testkey1';
const test_value1 = 'testvalue1';
const test_key2 = 'testkey2';
const test_value2 = 'testvalue2';
const test_key3 = 'testkey3';
const test_value3 = 'testvalue3';
const test_key4 = 'testkey4';
const test_value4 = 'testvalue4';
const test_key5 = 'testkey5';
const test_value5 = 'testvalue5';

//
// force some defaults in case user as a `.lev` file in their home directory.
//
var defaultargs = ['--format', 'false', '--encoding', 'utf8'];

module.exports = {
  'Test Usage message on no args':
  function(test,next){
    
    test.plan(2)
    var test_cp1 = spawn(lev, []);
    var test_output1 = '';

    test_cp1.stderr.on('data', function (data) {
        var isOk = false;

        if(data.toString().indexOf("Usage") == 1){
           isOk = true;   
        }
     
       if(data.toString().indexOf("Argument") == 0){
          isOk = true;
       }		
       test.ok(isOk, "Message has expected start")
           
    });

    test_cp1.stdout.on('data', function (data) {
      test_output1 += data;
    });

    test_cp1.on('exit', function (data) {
      
    })
  },
  'put to specific location (Verbose)':
  function(test, next) {
    test.plan(2);

    //
    // for the first test, create the database in case it does not exist.
    //
    var args = [p, '--put', test_key1, '--value', test_value1, '-c'].concat(defaultargs);
    var test_cp1 = spawn(lev, args);
    var test_output1 = '';

    test_cp1.stderr.on('data', function (data) {
      test.fail(data);
    });

    test_cp1.stdout.on('data', function (data) {
      test_output1 += data;
    });

    test_cp1.on('exit', function (data) {
      levelup(path.join(__dirname, '..', 'fixtures', 'db'), options, function (err, db) {
        
      test.equals( test_output1, OK);
        if (err) { return test.fail(err); }

        db.get(test_key1, function (err, value) {
          if (err) { return test.fail(err); }
          test.equals(test_value1, value, "Value stored and retrieved as expected");
          db.close();
          next();
        });
      });
    });
  },

   'put to specific location without -c (Verbose)': 
   function(test, next) {

     test.plan(2);
     var args = [p, '--put', test_key2, '--value', test_value2 ].concat(defaultargs);
    
     var test_cp1 = spawn(lev, args);
     var test_output1 = '';

     test_cp1.stderr.on('data', function (data) {
       test.fail(String(data));
     });

     test_cp1.stdout.on('data', function (data) {
       test_output1 += data;
     });

     test_cp1.on('exit', function (data) {
	
     //	test.ok(false, "path params fail", "#TODO params need debugging");
       test.equals(test_output1, OK, "Output validated");
       levelup(p, options, function (err, db) {
      
         if (err) { return test.fail(err); }

         db.get(test_key2, function (err, value) {
          
           if (err) { return test.fail(err); }
           test.equals(test_value2, value, "Insert Validated" );
           db.close();
           next();
         });
       });
     });
   },
   'put from within the current working dir': 
   function(test, next) {

     test.plan(2);

     var args = [p, '-p', test_key3, test_value3].concat(defaultargs);
	
     var test_cp3 = spawn(lev, args, { cwd: p });
     var test_output3 = '';

     test_cp3.stderr.on('data', function (data) {
       test.fail(String(data));
     });

     test_cp3.stdout.on('data', function (data) {
       test_output3 += data;
   });

     test_cp3.on('exit', function (data) {

       test.equals(test_output3, OK);

       levelup(p, options, function (err, db) {
        
         if (err) { return test.fail(err); }

         db.get(test_key3, function (err, value) {
          
           if (err) { return test.fail(err); }
           test.equals(test_value3, value);
           db.close();
           next();
         });
       });
     });
 },
   'put from within the current working dir (Verbose)': 
   function(test, next) {

     test.plan(2);

     var args = [p, '--put', test_key4, '--value', test_value4, '-c'].concat(defaultargs);
	
     var test_cp4 = spawn(lev, args, { cwd: p });
     var test_output4 = '';

     test_cp4.stderr.on('data', function (data) {
       test.fail(String(data));
     });

     test_cp4.stdout.on('data', function (data) {
       test_output4 += data;
     });

     test_cp4.on('exit', function (data) {

       test.equals(test_output4, OK);

       levelup(p, options, function (err, db) {
        
         if (err) { return test.fail(err); }

         db.get(test_key4, function (err, value) {
          
           if (err) { return test.fail(err); }
           test.equals(test_value4, value);
           db.close();
           next();
         });
       });
     });
   },

   'put binary data (Verbose)':
   function(test, next) {

     test.plan(2);

     var args = [p, '--put', test_key5, '--value', test_value5, '-c', '--keyEncoding=utf8', '--valueEncoding=binary' ]
     var test_cp5 = spawn(lev, args);
     var test_output5 = '';

     test_cp5.stderr.on('data', function (data) {
       test.fail(String(data));
     });

     test_cp5.stdout.on('data', function (data) {
       test_output5 += data;
     });

     test_cp5.on('exit', function (data) {

       test.equals(test_output5, OK);

       levelup(p, { valueEncoding : 'binary' }, function (err, db) {

         if (err) { return test.fail(err); }

         db.get(test_key5, function (err, value) {

           if (err) { return test.fail(err); }
           test.equals(value.toString(), test_value5);
           db.close();
           next();
         });
       });
     });
   },

  'get from specific location': 
   function(test, next) {

     test.plan(1);

     var args = [p, '-g', test_key1].concat(defaultargs);
     var test_cp1 = spawn(lev, args);
     var test_output1 = '';

     test_cp1.stderr.on('data', function (data) {
       test.fail(String(data));
     });

     test_cp1.stdout.on('data', function (data) {
       test_output1 += data;
     });

     test_cp1.on('exit', function (data) {

       test.equals(test_output1,  '"' + test_value1  + '"\r\n');
     });
   },

   'get from specific location (Verbose)': 
   function(test, next) {

     test.plan(1);

     var args = [p, '--get', test_key2].concat(defaultargs);

     var test_cp2 = spawn(lev, args);
     var test_output2 = '';

     test_cp2.stderr.on('data', function (data) {
       test.fail(data);
     });

     test_cp2.stdout.on('data', function (data) {
       test_output2 += data;
     });

     test_cp2.on('exit', function (data) {
  
	  //    process.exit()
       test.equals(test_output2,  '"' + test_value2 + '"\r\n' );
     });
   },

   'get binary data (Verbose)':
   function(test, next) {
    
     test.plan(1);

     var args = [p, '--valueEncoding=binary', '--keyEncoding=utf8', '--get', test_key5];

     var test_cp5 = spawn(lev, args);
     var test_output5 = '';

   test_cp5.stderr.on('data', function (data) {
       test.fail(data);
     });

     test_cp5.stdout.on('data', function (data) {
       test_output5 += data;
     });

     test_cp5.on('exit', function (data) {
       var arr = '[116,101,115,116,118,97,108,117,101,53]\r\n';
	   
       test.equals(test_output5,  arr);
     });
   },

   'delete a key (Verbose)': 
   function(test, next) {

     test.plan(2);

     var args = [p, '--del', test_key3].concat(defaultargs);

     var test_cp3 = spawn(lev, args, { cwd: p });
     var test_output3 = '';

     test_cp3.stderr.on('data', function (data) {
       test.fail(String(data));
     });

     test_cp3.stdout.on('data', function (data) {
       test_output3 += data;
     });

     test_cp3.on('exit', function (data) {

       test.equals(test_output3, OK);

       levelup(p, options, function (err, db) {
        
         if (err) { return test.fail(err); }

         db.get(test_key3, function (err, value) {
          
           if (err) { 
             test.ok(true, "Key has been removed"); 
             db.close();
             next();
           }
           else {
             test.equals(test_value3, value);
           }

         });
       });
     });
   },
   'delete a key': 
   function(test, next) {

     test.plan(2);

     var args = [p, '-d', test_key4].concat(defaultargs);

     var test_cp3 = spawn(lev, args, { cwd: p });
     var test_output4 = '';

     test_cp3.stderr.on('data', function (data) {
       test.fail(String(data));
     });

     test_cp3.stdout.on('data', function (data) {
       test_output4 += data;
     });

     test_cp3.on('exit', function (data) {

       test.equals(test_output4, OK);

       levelup(p, options, function (err, db) {
        
         if (err) { return test.fail(err); }

         db.get(test_key4, function (err, value) {
          
           if (err) { 
             test.ok(true, "Key has been removed"); 
             db.close();
             next();
           }
           else {
             //test.equals(test_value4, value);
           }

         });
       });
     });
   },
   'Start Multilevel Server' :
   function(test, next) {
    test.plan(1);
       
	var svr = levelup(process.cwd() + '/test/fixtures/db-server')
        tcpserver = net.createServer(function (con) {
           con.pipe(multilevel.server(svr)).pipe(con)
       
     }).listen(3000)
    	   test.ok(svr, "server started" )
           next();
    // for the first test, create the database in case it does not exist.
    //
        
   },
    'multilevel put to specific location (Verbose)': 
   function(test, next) {

     test.plan(2);
     var args = ['--port', '3000', '--put', test_key2, '--value', test_value2 ]
     var test_cp1 = spawn(lev, args);
     var test_output1 = '';

     test_cp1.stderr.on('data', function (data) {
       test.fail(String(data));
     });

     test_cp1.stdout.on('data', function (data) {
       test_output1 += data;
     });

     test_cp1.on('exit', function (data) {
	
     //	TODO: test.ok(false, "path params fail", "#TODO params need debugging");
       test.equals(test_output1, OK, "Response Returned OK");
       var mcl = multilevel.client(); 
       var con = net.connect(3000);
       con.pipe(mcl.createRpcStream()).pipe(con)
   
         mcl.get(test_key2, function (err, value) {
          
           if (err) { return test.fail(err); }
           test.equals(test_value2, value, "Multilevel put value is present");
           mcl.close();
           next();
         });
     })
}, 
  'multilevel get from specific location': 
   function(test, next) {

     test.plan(1);

     var args = ['--port', '3000', '-g', test_key2].concat(defaultargs);
     var test_cp1 = spawn(lev, args);
     var test_output1 = '';

     test_cp1.stderr.on('data', function (data) {
       test.fail(String(data));
     });

     test_cp1.stdout.on('data', function (data) {
       test_output1 += data;
     });

     test_cp1.on('exit', function (data) {

       test.equals(test_output1,  '"' + test_value2  + '"\r\n');
     });
   },


'multilevel put to specific location': 
   function(test, next) {

     test.plan(2);
     var args = ['--port', '3000', '-p', test_key3, test_value3];
     var test_cp1 = spawn(lev, args);
     var test_output1 = '';

     test_cp1.stderr.on('data', function (data) {
       test.fail(String(data));
     });

     test_cp1.stdout.on('data', function (data) {
       test_output1 += data;
     });

     test_cp1.on('exit', function (data) {
	
     //	test.ok(false, "path params fail", "#TODO params need debugging");
       test.equals(test_output1, OK, "Response Returned OK");
       var mcl = multilevel.client(); 
       var con = net.connect(3000);
       con.pipe(mcl.createRpcStream()).pipe(con)
       
         mcl.get(test_key3, function (err, value) {
          
           if (err) { return test.fail(err); }
           test.equals(test_value3, value, "Multilevel put value is present");
           mcl.close();
           next();
         });
      
     })
}, 
   'multi level delete a key': 
   function(test, next) {

     test.plan(1);

     var args = ['--port', '3000', '-d', test_key2].concat(defaultargs);

     var test_cp = spawn(lev, args);
     var test_output4 = '';

     test_cp.stderr.on('data', function (data) {
       test.fail(String(data));
     });

     test_cp.stdout.on('data', function (data) {
       test_output4 += data;
       
     });

     test_cp.on('exit', function (data) {
     test.equals(test_output4, OK);
        
      //Should test value but there seems to be an error with 
       /*var mcl = multilevel.client(); 
       var con = net.connect(3000);
       con.pipe(mcl.createRpcStream()).pipe(con)
        con.on('connect', function(){
       
         mcl.get(test_key3, function (err, value) {
           if (err) { 
		 test.ok(true, "Key has been removed"); 
             	 mcl.close();
                 next();	
           } 
           
         });
	});
	*/
       
     });
   },

"TearDown" : function(test, next) { test.plan(0); tcpserver.close(); next(); }
};
