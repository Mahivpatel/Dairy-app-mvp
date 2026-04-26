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

  const owner = await prisma.user.upsert({
    where: { email: 'owner@test.com' },
    update: { password: passwordHash },
    create: {
      email: 'owner@test.com',
      name: 'Ramesh',
      dairyName: 'Ramesh Dairy',
      password: passwordHash,
      pricePerBag: 20,
    }
  })

  const pricePerBag = owner.pricePerBag

  // Create Customers
  const c1 = await prisma.customer.create({
    data: { name: 'Patel Family', phone: '1234567890', address: '123 Main St', usualBags: 2, userId: owner.id }
  })
  const c2 = await prisma.customer.create({
    data: { name: 'Sharma House', phone: '0987654321', address: '456 Oak Rd', usualBags: 1, userId: owner.id }
  })
  const c3 = await prisma.customer.create({
    data: { name: 'Gupta Traders', phone: '1122334455', address: 'Market Square', usualBags: 5, userId: owner.id }
  })

  // Create March 2026 Ledgers
  const month = '2026-03'

  const l1 = await prisma.ledger.create({ data: { customerId: c1.id, month, totalBags: 0, amountDue: 0 } })
  const l2 = await prisma.ledger.create({ data: { customerId: c2.id, month, totalBags: 0, amountDue: 0 } })
  const l3 = await prisma.ledger.create({ data: { customerId: c3.id, month, totalBags: 0, amountDue: 0 } })

  // Purchases for March 2026
  const purchases = [
    { cId: c1.id, lId: l1.id, bags: 2, date: new Date('2026-03-01T00:00:00Z') },
    { cId: c1.id, lId: l1.id, bags: 2, date: new Date('2026-03-02T00:00:00Z') },
    { cId: c1.id, lId: l1.id, bags: 2, date: new Date('2026-03-03T00:00:00Z') },
    { cId: c1.id, lId: l1.id, bags: 3, date: new Date('2026-03-04T00:00:00Z') },
    { cId: c1.id, lId: l1.id, bags: 2, date: new Date('2026-03-05T00:00:00Z') },

    { cId: c2.id, lId: l2.id, bags: 1, date: new Date('2026-03-01T00:00:00Z') },
    { cId: c2.id, lId: l2.id, bags: 1, date: new Date('2026-03-04T00:00:00Z') },
    { cId: c2.id, lId: l2.id, bags: 2, date: new Date('2026-03-05T00:00:00Z') },

    { cId: c3.id, lId: l3.id, bags: 5, date: new Date('2026-03-01T00:00:00Z') },
    { cId: c3.id, lId: l3.id, bags: 5, date: new Date('2026-03-02T00:00:00Z') },
  ]

  for (const p of purchases) {
    await prisma.purchase.create({
      data: { customerId: p.cId, ledgerId: p.lId, bags: p.bags, date: p.date }
    })
  }

  const updateLedger = async (lId: string) => {
    const agg = await prisma.purchase.aggregate({
      where: { ledgerId: lId },
      _sum: { bags: true }
    })
    const totalBags = agg._sum.bags || 0
    await prisma.ledger.update({
      where: { id: lId },
      data: { totalBags, amountDue: totalBags * pricePerBag }
    })
  }

  await updateLedger(l1.id)
  await updateLedger(l2.id)
  await updateLedger(l3.id)

  console.log('Seed successful: March 2026 data added.')
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