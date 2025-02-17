import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import postRoute from './routes/post.route';
import authRoute from './routes/auth.route';
import dotenv from 'dotenv';
dotenv.config();

const app = express();


app.use(cors());

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({credentials:true}));
// app routes
app.use('/api/posts', postRoute);
app.use('/api/auth', authRoute);

app.listen(8000, () => {
    console.log('server listening on port...');
    
})