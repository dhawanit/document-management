import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User],
  synchronize: true, // for seeding only, disable in prod
});

async function createAdmin() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

  const existingAdmin = await userRepo.findOne({ where: { email: 'admin@document.com' } });
  if (existingAdmin) {
    console.log('Admin user already exists');
    await AppDataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const admin = userRepo.create({
    username: 'admin',
    email: 'admin@document.com',
    password: hashedPassword,
    role: UserRole.ADMIN,
    canTriggerIngestion: true,
  });

  await userRepo.save(admin);
  console.log('Admin user created successfully!');
  await AppDataSource.destroy();
}

createAdmin().catch((err) => {
  console.error('Error creating admin:', err);
});