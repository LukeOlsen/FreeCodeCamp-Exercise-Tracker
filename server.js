const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


var userSchema = new mongoose.Schema({
  userName: {
    type: String, 
    required: true,
    unique: true
  },
  userId: String,
  workout: [{
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: Date
  }],
});

var User = mongoose.model('User', userSchema);
var idCount = 0;
var userError = false;
var tempUser = "";




app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/exercise/new-user', function(req, res, next){
  function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }  
  //tempUser = req.body.username;
  var newUser = new User({userName: req.body.username})
  var tempId = makeid()
  User.findOne({userName: req.body.username}, function(err, data){
    if (err){next(err)}
    if (data){
      res.send("Username already created!");
    } else {
      var newUser = new User({userName: req.body.username, userId: tempId});
      //idCount++;
      console.log(newUser);
      newUser.save(function(err, data){
        if(err){next(err)} else {
       res.json({userName: req.body.username, userId: tempId});
        }
      });  
    }
  });
});

app.post('/api/exercise/add', function(req, res, next){
  var workoutToAdd = {description: req.body.description,
                      duration: req.body.duration,
                      date: req.body.date,                     
                     };
  console.log(workoutToAdd);
  User.findOne({userId: req.body.userId}, function(err, data){
    console.log(data);
    if (data){
      if (err){
        console.log(err);
        next(err)
      } else {
        data.workout.push(workoutToAdd);
        res.send(data);
        data.save(function(err, updateWorkout){
          if (err) {next(err)}
        })
      }
    } else {
      res.send("User not found");
    }
  });
});


app.get("/api/exercise/log", function(req, res, next){
  let final 
  User.find({userId: req.body.userId}).select('userName workout.description workout.duration workout.date').exec(function(err, data){    
    if (req.body.from && req.body.to && !req.body.limit){
      function checkDate(a){
        return (a >= req.body.from && a <= req.body.to)
      }
      for (var i = 0; i < data.workout.length; i++){
        final = checkDate(data.workout[i].date);
        res.send(final);
      }
      
    } else if (req.body.from && req.body.to && req.body.limit){
      function checkDate(a){
        return (a >= req.body.from && a <= req.body.to)
      }
      for (var i = 0; i < req.body.limit; i++){
        final = checkDate(data.workout[i].date);
        res.send(final);
      }
    } else if (!req.body.from && !req.body.to && req.body.limit){
      let shortWorkout = []
      for (var i = 0; i < req.body.limit; i++){
        shortWorkout.push(data.workout[i]);
        final = shortWorkout;
        res.send(final);
      }
    } else {
      res.send(data.workout);
    }
  });

});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
