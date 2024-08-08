import {Router} from 'express';

const router = Router();

router.get('/test', (req, res) => {
    res.json({message: 'Hello from the API!'});
});

router.post('/test', (req, res) => {
    res.json({message: 'Hello from the API!'});
});

router.put('/test', (req, res) => {
    res.json({message: 'Hello from the API!'});
});

router.delete('/test', (req, res) => {
    res.json({message: 'Hello from the API!'});
});



export default router;

