const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const {Schema} = mongoose;
mongoose.connect(process.env.MONGO_URI)

const UserSchema = new Schema({
  username: String
}) 
   
const User = mongoose.model('User', UserSchema)

const ExerciseSchema = new Schema({
  user_id: {type: String, require: true},
  description:{type:String, require: true},
  duration: {type:Number, require: true},
  date:{type: Date, require: false}
})

const Exercise = mongoose.model('Exercise',ExerciseSchema)
app.use(cors())
app.use(express.urlencoded({extended: true}));
app.use(express.json())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', async (req,res) => {
  console.log(req.body);
  let userObj = new User({
    username: req.body.username
  })

  try{
    const user = await userObj.save()
    console.log(user)
    res.json(user)
  }catch(err){
    console.log(err)
  }
})

app.post('/api/users/:_id/exercises', async(req,res) => {
  const id = req.params._id;
  const {description, duration, date} = req.body;
  try{
    const user = await User.findById(id);
    if(!user){
      res.json('Could not find User');
    }else{
      const exerciseObj = new Exercise({
        user_id:id,
        description:description,
        duration: duration,
        date: date?new Date(date) : new Date() 
      })

      const exercise = await exerciseObj.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      })
    }
  }catch(err){
    console.log(err);
  }
})

app.get('/api/users/:_id/logs', async(req,res) => {
  const id = req.params._id;
  const {from, to, limit} = req.query;
  const user = await User.findById(id);
  if(!user){
    res.json("user not detected");
  }

  let dateObj = {}

  if(from){
    dateObj['$gte'] = new Date(from);
  }

  if(to){
    dateObj['$lte'] = new Date(to);
  }
  let filter = {
    user_id: id
  }

  if(from || to){
    filter.date = dateObj;
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500);
  
  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))
  
  res.json({
    username: user.username,
    count: exercises.length,
    _id: user.id,
    log
  })

})

app.get('/api/users', async(req,res) => {
  
  const users = await User.find().select("username");
  if(!users){
    res.json("No Users Detected");
  }else{
    res.json(users)
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
