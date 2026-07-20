import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recipeRoutes from './routes/recipes';
import profileRoutes from './routes/profile';
import pantryRoutes from './routes/pantry';
import aiRoutes from './routes/ai';
import chatRoutes from './routes/chat';
import adminRoutes from './routes/admin';
import favoriteRoutes from "./routes/favorites";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok', app: 'ReCopé' });
});

app.use('/api/recipes', recipeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/favorites", favoriteRoutes);


app.listen(PORT, () => {
  console.log(`ReCopé backend running on http://localhost:${PORT}`);
});
