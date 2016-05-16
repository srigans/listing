/**
 * New node file
 */
var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST

router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}))

//build the REST operations at the base for listings
//this will be accessible from http://127.0.0.1:3000/listings if the default route for / is left unchanged
router.route('/')
    //GET all listings
    .get(function(req, res, next) {
        //retrieve all listings from Monogo
        mongoose.model('Listing').find({}, function (err, listings) {
              if (err) {
                  return console.error(err);
              } else {
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                      //HTML response will render the index.jade file in the views/listings folder. We are also setting "listings" to be an accessible variable in our jade view
                    html: function(){
                        res.render('listings/index', {
                              title: 'All my Listings',
                              "listings" : listings
                          });
                    },
                    //JSON response will show all listings in JSON format
                    json: function(){
                        res.json(listings);
                    }
                });
              }     
        });
    })
    //POST a new listing
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var title = req.body.title;
        var description = req.body.description;
        var isactive = req.body.isactive;
        //call the create function for our database
        mongoose.model('Listing').create({
        	title : title,
        	description : description,
            isactive : isactive
        }, function (err, listing) {
              if (err) {
                  res.send("There was a problem adding the information to the database.");
              } else {
                  //Listing has been created
                  console.log('POST creating new listing: ' + listing);
                  res.format({
                      //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("listings");
                        // And forward to success page
                        res.redirect("/listings");
                    },
                    //JSON response will show the newly created listing
                    json: function(){
                        res.json(listing);
                    }
                });
              }
        })
    });

/* GET New Listing page. */
router.get('/create', function(req, res) {
    res.render('listings/create', { title: 'Create New Listing' });
});

//route middleware to validate :id
router.param('id', function(req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Listing').findById(id, function (err, listing) {
        //if it isn't found, we are going to repond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                html: function(){
                    next(err);
                 },
                json: function(){
                       res.json({message : err.status  + ' ' + err});
                 }
            });
        //if it is found we continue on
        } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            //console.log(listing);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
        } 
    });
});

router.route('/:id')
.get(function(req, res) {
  mongoose.model('Listing').findById(req.id, function (err, listing) {
    if (err) {
      console.log('GET Error: There was a problem retrieving: ' + err);
    } else {
      console.log('GET Retrieving ID: ' + listing._id);
      //var listingdob = listing.dob.toISOString();
      //listingdob = listingdob.substring(0, listingdob.indexOf('T'))
      res.format({
        html: function(){
            res.render('listings/show', {
              //"listingdob" : listingdob,
              "listing" : listing
            });
        },
        json: function(){
            res.json(listing);
        }
      });
    }
  });
});

//GET the individual listing by Mongo ID
router.get('/:id/edit', function(req, res) {
    //search for the listing within Mongo
    mongoose.model('Listing').findById(req.id, function (err, listing) {
        if (err) {
            console.log('GET Error: There was a problem retrieving: ' + err);
        } else {
            //Return the listing
            console.log('GET Retrieving ID: ' + listing._id);
            //format the date properly for the value to show correctly in our edit form
          //var listingdob = listing.dob.toISOString();
          //listingdob = listingdob.substring(0, listingdob.indexOf('T'))
            res.format({
                //HTML response will render the 'edit.jade' template
                html: function(){
                       res.render('listings/edit', {
                          title: 'Listing' + listing._id,
                        //"listingdob" : listingdob,
                          "listing" : listing
                      });
                 },
                 //JSON response will return the JSON output
                json: function(){
                       res.json(listing);
                 }
            });
        }
    });
})
//PUT to update a listing by ID
.put('/:id/edit', function(req, res) {
    // Get our REST or form values. These rely on the "name" attributes
    var title = req.body.title;
    var description = req.body.description;
    var isactive = req.body.isactive;

   //find the document by ID
        mongoose.model('Listing').findById(req.id, function (err, listing) {
            //update it
            listing.update({
            	title : title,
                description : description,
                isactive : isactive
            }, function (err, listingID) {
              if (err) {
                  res.send("There was a problem updating the information to the database: " + err);
              } 
              else {
                      //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                      res.format({
                          html: function(){
                               res.redirect("/listings/" + listing._id);
                         },
                         //JSON responds showing the updated values
                        json: function(){
                               res.json(listing);
                         }
                      });
               }
            })
        });
})
//DELETE a Listing by ID
.delete('/:id/edit', function(req, res) {
    //find listing by ID
    mongoose.model('Listing').findById(req.id, function (err, listing) {
        if (err) {
            return console.error(err);
        } else {
            //remove it from Mongo
            listing.remove(function (err, listing) {
                if (err) {
                    return console.error(err);
                } else {
                    //Returning success messages saying it was deleted
                    console.log('DELETE removing ID: ' + listing._id);
                    res.format({
                        //HTML returns us back to the main page, or you can create a success page
                          html: function(){
                               res.redirect("/listings");
                         },
                         //JSON returns the item with the message that is has been deleted
                        json: function(){
                               res.json({message : 'deleted',
                                   item : listing
                               });
                         }
                      });
                }
            });
        }
    });
});

module.exports = router;