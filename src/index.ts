import express from 'express';
import cookieParser from 'cookie-parser';
import postRoute from './routes/post.route';
import authRoute from './routes/auth.route';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());

// app routes
app.use('/api/post', postRoute);
app.use('/api/auth', authRoute);

app.listen(8000, () => {
    console.log('server listening on port...');
    
})