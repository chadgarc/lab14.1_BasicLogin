import { Router } from 'express';
import { register, login } from '../controllers/userController.js';

/**
 * User router — URL-to-handler map only (no business logic here).
 *
 * Connections:
 * - Imports `register` / `login` from `../controllers/userController.js`,
 *   where the actual logic lives (DB queries, password checks, JWT signing).
 * - Imported by `server.js`, which mounts it at `/api/users`, producing:
 *   - `POST /api/users/register` → `register`
 *   - `POST /api/users/login` → `login`
 *
 * Why this file exists: keeping routes thin means adding a future endpoint
 * (e.g. `GET /profile`) is one import + one line, without touching logic.
 */
const router = Router();

router.post('/register', register);
router.post('/login', login);

export default router;
