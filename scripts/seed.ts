import { connectDB } from '../src/lib/mongodb';
import { hashPassword } from '../src/lib/auth';
import { User } from '../src/models/User';
import { Customer } from '../src/models/Customer';
import { Vehicle } from '../src/models/Vehicle';
import { InventoryItem } from '../src/models/Inventory';
import { ServiceCatalogItem } from '../src/models/Service';
import { mockCustomers, mockVehicles, availableParts, availableServices } from '../src/lib/mockData';

async function main() {
  await connectDB();

  // Default admin
  const email = 'superadmin@caraffair.com';
  const existing = await User.findOne({ email });
  if (!existing) {
    const passwordHash = await hashPassword('password123');
    await User.create({ name: 'Super Admin', email, passwordHash, role: 'admin' });
    console.log('Created default admin:', email, '/ password123');
  } else {
    console.log('Admin already exists, skipping');
  }

  // Seed reference data only if collections are empty
  if ((await Customer.estimatedDocumentCount()) === 0) {
    const idMap: Record<string, string> = {};
    for (const c of mockCustomers) {
      const created = await Customer.create({
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
      });
      idMap[c.id] = String(created._id);
    }
    for (const v of mockVehicles) {
      const customerId = idMap[v.customerId];
      if (!customerId) continue;
      await Vehicle.create({ ...v, customerId });
    }
    console.log('Seeded customers + vehicles');
  }

  if ((await InventoryItem.estimatedDocumentCount()) === 0) {
    await InventoryItem.insertMany(
      availableParts.map((p: { name: string; partNumber: string; unitCost: number }) => ({
        name: p.name,
        partNumber: p.partNumber,
        category: 'General',
        quantity: 10,
        unitCost: p.unitCost,
        reorderLevel: 2,
        supplier: 'Default Supplier',
      }))
    );
    console.log('Seeded inventory');
  }

  if ((await ServiceCatalogItem.estimatedDocumentCount()) === 0) {
    await ServiceCatalogItem.insertMany(
      availableServices.map((s: { name: string; description: string; cost: number; laborHours: number }) => ({
        name: s.name,
        description: s.description,
        cost: s.cost,
        laborHours: s.laborHours,
      }))
    );
    console.log('Seeded services');
  }

  console.log('Seed complete');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
