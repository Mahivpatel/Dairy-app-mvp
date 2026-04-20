import { PrismaClient } from '../src/generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'owner@test.com' },
    update: { password: passwordHash },
    create: {
      email: 'owner@test.com',
      name: 'Ramesh',
      dairyName: 'Ramesh Dairy',
      password: passwordHash,
      customers: {
        create: [
          {
            name: 'Patel family',
            phone: '1234567890',
            address: '123 Main St',
          }
        ]
      }
    }
  })
  console.log('Seed successful:', user)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })