//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const atlasPassword = "admin123";
const databaseName = "todolistDB";
const atlasURL = "mongodb+srv://admin-prat33k:" + atlasPassword + "@cluster0.4wyjr.mongodb.net/" + databaseName;
//connect and make todolistDB mongoDB server through mongoose
mongoose.connect(atlasURL);


const itemsSchema = {
    name: String
};

const listSchema = {
    name: String,
    items: [itemsSchema]
};

// collection model for list items
const Item = mongoose.model("Item", itemsSchema);
// make a new collection of the list user provides us 
const List = mongoose.model("List", listSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add new items."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];


const app = express();

// to use body-parser
app.use(bodyParser.urlencoded({extended: true}));
// tell express to serve up thw public folder as static resource
app.use(express.static("public"));


// set the view engine to ejs 
//this will assume a views directory containing an .ejs file
// refer to documentation ejs with express
app.set("view engine", "ejs");



app.get("/", function(req, res) {

    
    const day = "Today";

    Item.find({}, function(err, foundItems) {

        if(foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err){
                if(err) {
                    console.log(err);
                } else {
                    console.log("default items are added successfully");
                }
            });

            res.redirect("/");
            
        } else {

            // uses the view engine to render the page
            // renders a file named list.ejs inside views folder and passes the variables in it in the form of js object key value pair
            // set the letiable kindOfDay in the ejs file = day
            res.render("list", {listHeading: day, allItems: foundItems});
        }
    });
    

});


app.get("/:customListName", function(req, res) {

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList) {

        if(err) {
            console.log(err);
        } else {
            if(!foundList) {
                // create a new list 

                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();

                //redirect to current route
                res.redirect("/" + customListName);
            } else {
                // show an existing list
                res.render("list", {listHeading: foundList.name, allItems: foundList.items});
            }
        }
    });

    
});

app.post("/", function(req, res) {

    //new to do list item recived from html form
    const item = new Item({
        name: req.body.newItem
    });
    
    const currentList = req.body.listButton;

    if(currentList === "Today") {
        // if item is added to root route
        item.save();
        res.redirect("/");
    } else {
        // if item is added to the custom made list route
        
        List.findOne({name: currentList}, function(err, foundList) {
            if(!err) {

                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + currentList);
            }
        });
    }

});

app.post("/delete", function(req, res) {

    const toDeleteId = req.body.checkedItem_id;
    const listName = req.body.listName;

    if(listName === "Today") {
    
        Item.deleteOne({_id: toDeleteId}, function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("Successfully deleted checked item");
            }
        });

        res.redirect("/");
    } else {

        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: toDeleteId}}}, function(err, foundList) {
            if(!err) {
                res.redirect("/" + listName);
            }
        });
   
    }
});



app.get("/about", function(req, res) {

    res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
    console.log("server is running at port 3000");
});
