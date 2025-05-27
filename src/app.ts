//app.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import postRoute from './routes/post.route';
import authRoute from './routes/auth.route';
import testRoute from './routes/test.route';
import userRoute from './routes/user.route';
import reviewRoute from './routes/reviews.route';
import chatRoute from './routes/chat.route';
import messageRoute from './routes/message.route';





const app = express();

// middleware


//app.use(cors());

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "*", // ou précise l’origine
  credentials: true,
}));

// app routes
app.use('/api/auth', authRoute);
app.use('/api/test', testRoute);
app.use('/api/posts', postRoute);
app.use('/api/users', userRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/chats', chatRoute);
app.use('/api/message', messageRoute);


export default app;