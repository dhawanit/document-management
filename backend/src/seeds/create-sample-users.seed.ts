import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User],
  synchronize: true, // only for seeding
});

async function createSampleUsers() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

  console.log('⚙️ Generating 1000 sample users...');

  const hashedPassword = await bcrypt.hash('Password@123', 10);
  const users: Partial<User>[] = [];

  for (let i = 1; i <= 1000; i++) {
    const role = Math.random() > 0.5 ? UserRole.EDITOR : UserRole.VIEWER;
    users.push({
      username: `user${i}`,
      email: `user${i}@example.com`,
      password: hashedPassword,
      role,
      canTriggerIngestion: role === UserRole.EDITOR ? false : false,
    });
  }

  // Insert in chunks to avoid large single query
  const chunkSize = 100;
  for (let i = 0; i < users.length; i += chunkSize) {
    await userRepo.insert(users.slice(i, i + chunkSize));
  }

  console.log('Successfully created 1000 sample users.');
  await AppDataSource.destroy();
}

createSampleUsers().catch((err) => {
  console.error('Error creating sample users:', err);
});