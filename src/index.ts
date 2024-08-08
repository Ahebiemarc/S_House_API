import express from 'express';
import postRoute from './routes/post.route';
import authRoute from './routes/auth.route';

const app = express();

console.log('test');


// middleware
app.use(express.json());


// app routes
app.use('/api/post', postRoute);
app.use('/api/auth', authRoute);

app.listen(8000, () => {
    console.log('server listening on port...');
    
})