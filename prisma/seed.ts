import 'dotenv/config';
import { PrismaClient, Role, BookingStatus, PaymentStatus, PaymentMethod, DayOfWeek, NotificationType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * CampusServe Production-Grade Database Seeder
 * Populates realistic, comprehensive demonstration data for all stakeholders:
 * - Admin, Service Providers, and Students
 * - Verified Service Categories & Diverse Campus Services
 * - Service Availabilities (7 days/week) & Maintenance Blocked Periods
 * - Bookings across all lifecycle states (Pending, Confirmed, In Progress, Completed, Cancelled, Rejected)
 * - Razorpay Test Payments (Successful, Pending, Failed, Refunded) with authentic IDs
 * - High-Quality Student Reviews & Star Ratings
 * - Multi-Stakeholder Actionable System Notifications
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Error: DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('================================================================');
  console.log('   CAMPUSSERVE DEMONSTRATION DATABASE SEEDING ENGINE   ');
  console.log('================================================================\n');

  // Helper date utilities
  const now = new Date();
  const daysAgo = (days: number, hours = 0) => {
    const d = new Date(now.getTime() - (days * 24 + hours) * 60 * 60 * 1000);
    return d;
  };
  const daysFromNow = (days: number, hours = 0) => {
    const d = new Date(now.getTime() + (days * 24 + hours) * 60 * 60 * 1000);
    return d;
  };

  // ----------------------------------------------------------------
  // 1. SEED USERS: ADMIN, PROVIDERS, STUDENTS
  // ----------------------------------------------------------------
  console.log('👤 [1/7] Seeding Users (Admin, Providers, Students)...');

  // A. Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@campusserve.edu' },
    update: {
      name: 'Dr. Sarah Jenkins',
      phone: '+91 98765 43210',
      role: Role.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    },
    create: {
      clerkUserId: 'admin_demo_clerk_user',
      name: 'Dr. Sarah Jenkins',
      email: 'admin@campusserve.edu',
      phone: '+91 98765 43210',
      role: Role.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    },
  });

  // B. Service Providers
  const providerData = [
    {
      clerkUserId: 'prov_it_demo',
      email: 'it.services@campusserve.edu',
      name: 'Central IT & Computing Support',
      phone: '+91 98111 00001',
      avatarUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80',
    },
    {
      clerkUserId: 'prov_facilities_demo',
      email: 'facilities@campusserve.edu',
      name: 'Campus Estates & Facilities Unit',
      phone: '+91 98111 00002',
      avatarUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80',
    },
    {
      clerkUserId: 'prov_repro_demo',
      email: 'reprographics@campusserve.edu',
      name: 'University Reprographics & Digital Print',
      phone: '+91 98111 00003',
      avatarUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&auto=format&fit=crop&q=80',
    },
    {
      clerkUserId: 'prov_wellness_demo',
      email: 'wellness@campusserve.edu',
      name: 'Student Health & Wellness Clinic',
      phone: '+91 98111 00004',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    },
  ];

  const providers = await Promise.all(
    providerData.map((p) =>
      prisma.user.upsert({
        where: { email: p.email },
        update: {
          name: p.name,
          phone: p.phone,
          role: Role.SERVICE_PROVIDER,
          avatarUrl: p.avatarUrl,
        },
        create: {
          clerkUserId: p.clerkUserId,
          email: p.email,
          name: p.name,
          phone: p.phone,
          role: Role.SERVICE_PROVIDER,
          avatarUrl: p.avatarUrl,
        },
      })
    )
  );

  const [itProvider, facilitiesProvider, reproProvider] = providers;

  // C. Student Users
  const studentData = [
    {
      clerkUserId: 'std_aditya_demo',
      email: 'aditya.mehta@campus.edu',
      name: 'Aditya Mehta',
      phone: '+91 91234 56789',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    },
    {
      clerkUserId: 'std_priya_demo',
      email: 'priya.patel@campus.edu',
      name: 'Priya Patel',
      phone: '+91 92345 67890',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    },
    {
      clerkUserId: 'std_rohan_demo',
      email: 'rohan.verma@campus.edu',
      name: 'Rohan Verma',
      phone: '+91 93456 78901',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
    {
      clerkUserId: 'std_sneha_demo',
      email: 'sneha.rao@campus.edu',
      name: 'Sneha Rao',
      phone: '+91 94567 89012',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    },
    {
      clerkUserId: 'std_aarav_demo',
      email: 'aarav.sharma@campus.edu',
      name: 'Aarav Sharma',
      phone: '+91 95678 90123',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    },
    {
      clerkUserId: 'std_ananya_demo',
      email: 'ananya.iyer@campus.edu',
      name: 'Ananya Iyer',
      phone: '+91 96789 01234',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    },
  ];

  const students = await Promise.all(
    studentData.map((s) =>
      prisma.user.upsert({
        where: { email: s.email },
        update: {
          name: s.name,
          phone: s.phone,
          role: Role.STUDENT,
          avatarUrl: s.avatarUrl,
        },
        create: {
          clerkUserId: s.clerkUserId,
          email: s.email,
          name: s.name,
          phone: s.phone,
          role: Role.STUDENT,
          avatarUrl: s.avatarUrl,
        },
      })
    )
  );

  // Preserve existing Clerk test user if present
  const existingClerkUser = await prisma.user.findFirst({
    where: { clerkUserId: { startsWith: 'user_' } },
  });
  if (existingClerkUser) {
    await prisma.user.update({
      where: { id: existingClerkUser.id },
      data: {
        role: existingClerkUser.role || Role.STUDENT,
        name: existingClerkUser.name || 'Demo Student User',
      },
    });
    console.log(`   ✓ Linked existing Clerk user: ${existingClerkUser.clerkUserId} (${existingClerkUser.email})`);
  }

  console.log(`   ✓ Seeded ${1 + providers.length + students.length} platform users (Admin: 1, Providers: ${providers.length}, Students: ${students.length}).`);

  // ----------------------------------------------------------------
  // 2. SEED SERVICE CATEGORIES
  // ----------------------------------------------------------------
  console.log('\n📂 [2/7] Seeding Official Campus Service Categories...');

  const categoryDefinitions = [
    {
      name: 'Hostel Laundry Services',
      slug: 'hostel-laundry',
      description: 'Automated machine slot booking, express wash-and-fold pickup, and dry cleaning.',
      icon: 'Shirt',
      isActive: true,
    },
    {
      name: 'Mess & Food Court Pre-order',
      slug: 'mess-food-court',
      description: 'Pre-order meal tokens, special diet requests, and late-night canteen dining slots.',
      icon: 'UtensilsCrossed',
      isActive: true,
    },
    {
      name: 'Lab & IT Device Support',
      slug: 'lab-it-support',
      description: 'GPU cluster passes, Wi-Fi clearance, high-performance workstation passes, and hardware repairs.',
      icon: 'Laptop',
      isActive: true,
    },
    {
      name: 'Facility & Seminar Hall',
      slug: 'facility-hall-booking',
      description: 'Reserve auditorium seats, discussion pods, badminton courts, and amphitheater spaces.',
      icon: 'Building2',
      isActive: true,
    },
    {
      name: 'Hostel Maintenance & Electrician',
      slug: 'hostel-maintenance',
      description: 'Log verified repair tickets for plumbing, electricals, fan capacitors, and carpentry.',
      icon: 'Wrench',
      isActive: true,
    },
    {
      name: 'Reprographics & Print Hub',
      slug: 'reprographics-print-hub',
      description: 'High-speed thesis binding, engineering plotter prints, and course pack dispatch.',
      icon: 'Printer',
      isActive: true,
    },
  ];

  const categories = await Promise.all(
    categoryDefinitions.map((cat) =>
      prisma.serviceCategory.upsert({
        where: { slug: cat.slug },
        update: {
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          isActive: cat.isActive,
        },
        create: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          isActive: cat.isActive,
        },
      })
    )
  );

  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));
  console.log(`   ✓ Seeded ${categories.length} service categories.`);

  // ----------------------------------------------------------------
  // 3. SEED CAMPUS SERVICES
  // ----------------------------------------------------------------
  console.log('\n🛠️  [3/7] Seeding Verified Campus Services...');

  const servicesData = [
    // Category: Lab & IT Support (itProvider)
    {
      name: 'High-Performance GPU Computing Cluster Pass',
      description: 'Dedicated 2-hour remote session on 8x NVIDIA A100 GPU compute nodes for machine learning training, rendering, and deep learning research.',
      price: 0, // Free university academic amenity
      durationMinutes: 120,
      location: 'Academic Block C, AI Research Center 304',
      capacity: 8,
      imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=80',
      categoryId: categoryMap.get('lab-it-support')!,
      providerId: itProvider.id,
      isActive: true,
    },
    {
      name: 'Student Laptop Diagnostics & OS Reinstallation',
      description: 'Comprehensive hardware thermal check, certified malware disinfection, OS clean reinstall, and campus network certificate re-enrollment.',
      price: 250,
      durationMinutes: 60,
      location: 'Central Library Ground Floor, IT Helpdesk',
      capacity: 3,
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
      categoryId: categoryMap.get('lab-it-support')!,
      providerId: itProvider.id,
      isActive: true,
    },

    // Category: Hostel Laundry (facilitiesProvider)
    {
      name: 'Hostel Machine Wash & Fold Express',
      description: 'Quick-cycle 8kg automated washing machine slot followed by rapid tumble drying and fold service with barcode bag tagging.',
      price: 120,
      durationMinutes: 45,
      location: 'Hostel Block B, Basement Laundry Facility',
      capacity: 6,
      imageUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&auto=format&fit=crop&q=80',
      categoryId: categoryMap.get('hostel-laundry')!,
      providerId: facilitiesProvider.id,
      isActive: true,
    },
    {
      name: 'Deluxe Steam Press & Formal Attire Care',
      description: 'Specialized industrial steam pressing for presentation blazers, shirts, convocation robes, and formal evening wear.',
      price: 60,
      durationMinutes: 20,
      location: 'Hostel Block A, Utility Suite 102',
      capacity: 2,
      imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&auto=format&fit=crop&q=80',
      categoryId: categoryMap.get('hostel-laundry')!,
      providerId: facilitiesProvider.id,
      isActive: true,
    },

    // Category: Facility & Seminar Hall (facilitiesProvider)
    {
      name: 'Acoustic Collaborative Study Pod',
      description: 'Sound-dampened 6-person glass conference pod equipped with 4K interactive presentation display, whiteboards, and high-speed Wi-Fi.',
      price: 0, // Free amenity
      durationMinutes: 90,
      location: 'Central Library, 3rd Floor East Wing',
      capacity: 6,
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
      categoryId: categoryMap.get('facility-hall-booking')!,
      providerId: facilitiesProvider.id,
      isActive: true,
    },
    {
      name: 'Indoor Sports Complex Badminton Court 1',
      description: 'Official tournament-grade synthetic court with calibrated LED illumination and racket rental access.',
      price: 50,
      durationMinutes: 45,
      location: 'University Sports Pavilion Court A',
      capacity: 4,
      imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
      categoryId: categoryMap.get('facility-hall-booking')!,
      providerId: facilitiesProvider.id,
      isActive: true,
    },
    {
      name: 'Auditorium Main Stage & Audio Rehearsal',
      description: 'Equipped main stage session with 10kW line-array audio rig, motorized stage lighting, and theatrical projection desk.',
      price: 500,
      durationMinutes: 180,
      location: 'Student Activity Center, Main Auditorium',
      capacity: 1,
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
      categoryId: categoryMap.get('facility-hall-booking')!,
      providerId: facilitiesProvider.id,
      isActive: true,
    },

    // Category: Hostel Maintenance (facilitiesProvider)
    {
      name: 'Room Electrical & Lighting Rapid Ticket',
      description: 'Certified campus electrician visit to diagnose switchboard tripping, replace LED tubes, or repair ceiling fan speed regulators.',
      price: 0, // Free university facility maintenance
      durationMinutes: 30,
      location: 'Hostel Blocks 1 through 8',
      capacity: 3,
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
      categoryId: categoryMap.get('hostel-maintenance')!,
      providerId: facilitiesProvider.id,
      isActive: true,
    },
    {
      name: 'Plumbing & Water Fixture Urgent Ticket',
      description: 'Fast-response plumbing repair for faucet leaks, geyser thermostat diagnostics, shower pressure adjustment, and drainage clearing.',
      price: 0,
      durationMinutes: 30,
      location: 'Hostel Blocks 1 through 8',
      capacity: 2,
      imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80',
      categoryId: categoryMap.get('hostel-maintenance')!,
      providerId: facilitiesProvider.id,
      isActive: true,
    },

    // Category: Reprographics & Print Hub (reproProvider)
    {
      name: 'Thesis & Project Hardcover Binding Suite',
      description: 'Official university gold-embossed leatherette hardcover binding with heavyweight acid-free parchment and 2400 DPI color schematics.',
      price: 350,
      durationMinutes: 45,
      location: 'Student Union Building, Reprographics Centre',
      capacity: 2,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
      categoryId: categoryMap.get('reprographics-print-hub')!,
      providerId: reproProvider.id,
      isActive: true,
    },
    {
      name: 'Large-Format Blueprint & Conference Poster Plotter',
      description: 'A0/A1 high-gamut architectural blueprint and scientific conference poster printing on heavyweight satin photo paper.',
      price: 180,
      durationMinutes: 30,
      location: 'Architecture & Design Wing, Plotter Lab 102',
      capacity: 3,
      imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&auto=format&fit=crop&q=80',
      categoryId: categoryMap.get('reprographics-print-hub')!,
      providerId: reproProvider.id,
      isActive: true,
    },

    // Category: Mess & Food Court (facilitiesProvider / wellnessProvider)
    {
      name: 'Executive Meal Token & Night Canteen Express',
      description: 'Pre-ordered chef-crafted hot dinner combo with priority express pickup counter bypass during peak dining hours.',
      price: 90,
      durationMinutes: 15,
      location: 'Central Food Court Counter 3',
      capacity: 10,
      imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80',
      categoryId: categoryMap.get('mess-food-court')!,
      providerId: facilitiesProvider.id,
      isActive: true,
    },
  ];

  // Upsert services by unique name
  const services = [];
  for (const s of servicesData) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (existing) {
      const updated = await prisma.service.update({
        where: { id: existing.id },
        data: s,
      });
      services.push(updated);
    } else {
      const created = await prisma.service.create({ data: s });
      services.push(created);
    }
  }

  console.log(`   ✓ Seeded ${services.length} active campus services across ${categories.length} categories.`);

  // ----------------------------------------------------------------
  // 4. SEED SERVICE AVAILABILITY (7 DAYS/WEEK FOR ALL SERVICES)
  // ----------------------------------------------------------------
  console.log('\n📅 [4/7] Seeding Weekly Schedules & Blocked Maintenance Periods...');

  const daysOfWeekList: DayOfWeek[] = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY,
  ];

  let availabilityCount = 0;
  for (const svc of services) {
    for (const dow of daysOfWeekList) {
      // Sports & study pods open on weekends too; office hours Monday to Saturday
      const isWeekend = dow === DayOfWeek.SATURDAY || dow === DayOfWeek.SUNDAY;
      const startTime = isWeekend ? '10:00' : '08:30';
      const endTime = isWeekend ? '18:00' : '19:30';

      await prisma.serviceAvailability.upsert({
        where: {
          serviceId_dayOfWeek_startTime_endTime: {
            serviceId: svc.id,
            dayOfWeek: dow,
            startTime,
            endTime,
          },
        },
        update: {
          slotDuration: svc.durationMinutes,
          maxBookingsPerSlot: svc.capacity,
          isActive: true,
        },
        create: {
          serviceId: svc.id,
          dayOfWeek: dow,
          startTime,
          endTime,
          slotDuration: svc.durationMinutes,
          maxBookingsPerSlot: svc.capacity,
          isActive: true,
        },
      });
      availabilityCount++;
    }
  }

  // Blocked Maintenance Periods for realism
  const gpuService = services.find((s) => s.name.includes('GPU'));
  if (gpuService) {
    const existingBlock = await prisma.serviceBlockedPeriod.findFirst({
      where: { serviceId: gpuService.id },
    });
    if (!existingBlock) {
      await prisma.serviceBlockedPeriod.create({
        data: {
          serviceId: gpuService.id,
          startDate: daysFromNow(4),
          endDate: daysFromNow(4),
          startTime: '02:00',
          endTime: '06:00',
          reason: 'Scheduled NVIDIA CUDA Driver & Kernel Upgrade',
          isFullDay: false,
        },
      });
    }
  }

  console.log(`   ✓ Seeded ${availabilityCount} weekly operating slots and maintenance restrictions.`);

  // ----------------------------------------------------------------
  // 5. SEED BOOKINGS & PAYMENTS (HISTORICAL, TODAY, AND UPCOMING)
  // ----------------------------------------------------------------
  console.log('\n💳 [5/7] Seeding Realistic Bookings & Razorpay Test Payments...');

  // Helper arrays for generation
  const slotLabels = [
    '09:00 AM - 09:45 AM',
    '10:00 AM - 10:45 AM',
    '11:00 AM - 11:30 AM',
    '01:30 PM - 02:15 PM',
    '02:30 PM - 03:30 PM',
    '04:00 PM - 05:00 PM',
    '05:30 PM - 06:15 PM',
  ];

  const paymentMethods: PaymentMethod[] = [
    PaymentMethod.UPI,
    PaymentMethod.CARD,
    PaymentMethod.NET_BANKING,
    PaymentMethod.CAMPUS_WALLET,
  ];

  interface BookingSeedSpec {
    code: string;
    studentIdx: number;
    serviceIdx: number;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    daysOffset: number; // Negative = past, 0 = today, Positive = future
    slotIdx: number;
    notes?: string;
  }

  const bookingSpecs: BookingSeedSpec[] = [
    // --- Past Completed Bookings (Last 1 to 28 days) -> Rich revenue & analytics ---
    { code: 'CS-2026-1001', studentIdx: 0, serviceIdx: 0, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -24, slotIdx: 0, notes: 'PyTorch transformer model training for final semester thesis.' },
    { code: 'CS-2026-1002', studentIdx: 1, serviceIdx: 2, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -22, slotIdx: 1, notes: 'Formal conference wear wash and steam fold.' },
    { code: 'CS-2026-1003', studentIdx: 2, serviceIdx: 9, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -20, slotIdx: 4, notes: 'Civil Engineering thesis 3 copies with gold embossed cover.' },
    { code: 'CS-2026-1004', studentIdx: 3, serviceIdx: 4, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -18, slotIdx: 3, notes: 'ACM ICPC contest preparation study session.' },
    { code: 'CS-2026-1005', studentIdx: 4, serviceIdx: 5, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -16, slotIdx: 6, notes: 'Inter-hostel sports tournament doubles practice.' },
    { code: 'CS-2026-1006', studentIdx: 5, serviceIdx: 1, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -15, slotIdx: 2, notes: 'Linux Dual boot repartitioning and kernel recompile.' },
    { code: 'CS-2026-1007', studentIdx: 0, serviceIdx: 7, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -14, slotIdx: 0, notes: 'Room 304 tubelight replacement and socket rewiring.' },
    { code: 'CS-2026-1008', studentIdx: 1, serviceIdx: 10, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -12, slotIdx: 5, notes: 'Architecture wing model plot sheets.' },
    { code: 'CS-2026-1009', studentIdx: 2, serviceIdx: 11, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -11, slotIdx: 1, notes: 'Hackathon late night canteen meal token.' },
    { code: 'CS-2026-1010', studentIdx: 3, serviceIdx: 3, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -9, slotIdx: 2, notes: 'Placement interview formal blazer steam press.' },
    { code: 'CS-2026-1011', studentIdx: 4, serviceIdx: 0, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -8, slotIdx: 4, notes: 'Stable Diffusion LoRA weights training.' },
    { code: 'CS-2026-1012', studentIdx: 5, serviceIdx: 2, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -7, slotIdx: 3, notes: 'Bed linens and quilt weekly wash.' },
    { code: 'CS-2026-1013', studentIdx: 0, serviceIdx: 6, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -6, slotIdx: 5, notes: 'College cultural fest dance team dry run.' },
    { code: 'CS-2026-1014', studentIdx: 1, serviceIdx: 8, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -5, slotIdx: 1, notes: 'Hostel bathroom faucet pressure fix.' },
    { code: 'CS-2026-1015', studentIdx: 2, serviceIdx: 9, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -4, slotIdx: 0, notes: 'Dual-degree capstone report binding.' },
    { code: 'CS-2026-1016', studentIdx: 3, serviceIdx: 4, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -3, slotIdx: 2, notes: 'Robotics club hardware telemetry review.' },
    { code: 'CS-2026-1017', studentIdx: 4, serviceIdx: 5, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -2, slotIdx: 6, notes: 'Singles badminton ladder match.' },
    { code: 'CS-2026-1018', studentIdx: 5, serviceIdx: 1, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -1, slotIdx: 3, notes: 'MacBook thermal paste reapplication and battery check.' },

    // --- Today Active & In-Progress Bookings (daysOffset: 0) ---
    { code: 'CS-2026-2001', studentIdx: 0, serviceIdx: 0, status: BookingStatus.IN_PROGRESS, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: 0, slotIdx: 1, notes: 'Active multi-GPU node training in progress.' },
    { code: 'CS-2026-2002', studentIdx: 1, serviceIdx: 2, status: BookingStatus.IN_PROGRESS, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: 0, slotIdx: 2, notes: 'Wash cycle running in Machine #4.' },
    { code: 'CS-2026-2003', studentIdx: 2, serviceIdx: 4, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: 0, slotIdx: 4, notes: 'Study Pod 3 booked for afternoon group viva.' },
    { code: 'CS-2026-2004', studentIdx: 3, serviceIdx: 7, status: BookingStatus.IN_PROGRESS, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: 0, slotIdx: 3, notes: 'Electrician currently in Hostel Block 3 Room 112.' },

    // --- Upcoming Confirmed Bookings (Days +1 to +5) ---
    { code: 'CS-2026-3001', studentIdx: 4, serviceIdx: 9, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: 1, slotIdx: 0, notes: 'Doctoral thesis submission print.' },
    { code: 'CS-2026-3002', studentIdx: 5, serviceIdx: 5, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: 1, slotIdx: 6, notes: 'Evening recreational court reservation.' },
    { code: 'CS-2026-3003', studentIdx: 0, serviceIdx: 2, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: 2, slotIdx: 1, notes: 'Scheduled laundry slot.' },
    { code: 'CS-2026-3004', studentIdx: 1, serviceIdx: 6, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: 3, slotIdx: 5, notes: 'Drama society play rehearsal.' },
    { code: 'CS-2026-3005', studentIdx: 2, serviceIdx: 1, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: 4, slotIdx: 2, notes: 'Laptop display hinge adjustment.' },
    { code: 'CS-2026-3006', studentIdx: 3, serviceIdx: 10, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: 5, slotIdx: 4, notes: 'IEEE conference research paper poster plot.' },

    // --- Provider Queue: Pending Approvals (Days +1 to +3) ---
    { code: 'CS-2026-4001', studentIdx: 4, serviceIdx: 6, status: BookingStatus.PENDING, paymentStatus: PaymentStatus.PENDING, daysOffset: 2, slotIdx: 3, notes: 'Requesting permission for external guest speaker.' },
    { code: 'CS-2026-4002', studentIdx: 5, serviceIdx: 8, status: BookingStatus.PENDING, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: 1, slotIdx: 0, notes: 'Reported water seepage in Hostel 4 corridor.' },
    { code: 'CS-2026-4003', studentIdx: 0, serviceIdx: 11, status: BookingStatus.PENDING, paymentStatus: PaymentStatus.PENDING, daysOffset: 1, slotIdx: 5, notes: 'Veg deluxe meal platter reservation.' },

    // --- Cancelled & Rejected Bookings (Audit Integrity) ---
    { code: 'CS-2026-5001', studentIdx: 1, serviceIdx: 5, status: BookingStatus.CANCELLED, paymentStatus: PaymentStatus.REFUNDED, daysOffset: -10, slotIdx: 2, notes: 'Cancelled by student: Midsem exam rescheduled.' },
    { code: 'CS-2026-5002', studentIdx: 2, serviceIdx: 6, status: BookingStatus.REJECTED, paymentStatus: PaymentStatus.REFUNDED, daysOffset: -8, slotIdx: 4, notes: 'Declined by provider: Auditorium booked for University Senate Convocation.' },
    { code: 'CS-2026-5003', studentIdx: 3, serviceIdx: 0, status: BookingStatus.CANCELLED, paymentStatus: PaymentStatus.SUCCESSFUL, daysOffset: -5, slotIdx: 1, notes: 'Student cancelled slot due to lab meeting.' },
  ];

  let bookingsCreated = 0;
  let paymentsCreated = 0;

  for (const spec of bookingSpecs) {
    const student = students[spec.studentIdx % students.length];
    const service = services[spec.serviceIdx % services.length];
    const scheduledDate = daysAgo(-spec.daysOffset);
    const slotTime = slotLabels[spec.slotIdx % slotLabels.length];
    const paymentMethod = paymentMethods[spec.code.charCodeAt(spec.code.length - 1) % paymentMethods.length];

    // Upsert Booking
    const booking = await prisma.booking.upsert({
      where: { bookingCode: spec.code },
      update: {
        studentId: student.id,
        serviceId: service.id,
        status: spec.status,
        amount: service.price,
        scheduledAt: scheduledDate,
        slotTime,
        location: service.location,
        notes: spec.notes || null,
        createdAt: daysAgo(-spec.daysOffset, 2),
      },
      create: {
        bookingCode: spec.code,
        studentId: student.id,
        serviceId: service.id,
        status: spec.status,
        amount: service.price,
        scheduledAt: scheduledDate,
        slotTime,
        location: service.location,
        notes: spec.notes || null,
        createdAt: daysAgo(-spec.daysOffset, 2),
      },
    });
    bookingsCreated++;

    // Associated Payment Record
    const paymentCode = `PAY-${spec.code.replace('CS-', '')}`;
    const transactionId = `pay_rzp_test_${spec.code.toLowerCase().replace(/-/g, '_')}`;
    const orderId = `order_rzp_test_${spec.code.toLowerCase().replace(/-/g, '_')}`;

    const paidAtTime = spec.paymentStatus === PaymentStatus.SUCCESSFUL || spec.paymentStatus === PaymentStatus.REFUNDED
      ? daysAgo(-spec.daysOffset, 2)
      : null;

    await prisma.payment.upsert({
      where: { paymentCode },
      update: {
        bookingId: booking.id,
        userId: student.id,
        amount: service.price,
        status: spec.paymentStatus,
        method: paymentMethod,
        transactionId: service.price > 0 ? transactionId : null,
        orderId: service.price > 0 ? orderId : null,
        signature: service.price > 0 ? `hmac_sha256_mock_sig_${spec.code}` : null,
        paidAt: paidAtTime,
        createdAt: daysAgo(-spec.daysOffset, 2),
      },
      create: {
        paymentCode,
        bookingId: booking.id,
        userId: student.id,
        amount: service.price,
        status: spec.paymentStatus,
        method: paymentMethod,
        transactionId: service.price > 0 ? transactionId : null,
        orderId: service.price > 0 ? orderId : null,
        signature: service.price > 0 ? `hmac_sha256_mock_sig_${spec.code}` : null,
        paidAt: paidAtTime,
        createdAt: daysAgo(-spec.daysOffset, 2),
      },
    });
    paymentsCreated++;
  }

  console.log(`   ✓ Seeded ${bookingsCreated} lifecycle bookings and ${paymentsCreated} payment transactions.`);

  // ----------------------------------------------------------------
  // 6. SEED REVIEWS & RATINGS (AUTHENTIC STUDENT FEEDBACK)
  // ----------------------------------------------------------------
  console.log('\n⭐ [6/7] Seeding Authentic Student Reviews & Ratings...');

  const reviewSpecs = [
    {
      code: 'CS-2026-1001',
      rating: 5,
      comment: 'The GPU cluster was blazing fast for training my PyTorch final year project model! Super easy booking and SSH keys were deployed instantly.',
    },
    {
      code: 'CS-2026-1002',
      rating: 5,
      comment: 'Clothes were returned neatly folded, spotless, and right on time before the weekend placement drives.',
    },
    {
      code: 'CS-2026-1003',
      rating: 5,
      comment: 'Binding quality of my Master’s thesis was impeccable. Dean approved it without any remarks on formatting.',
    },
    {
      code: 'CS-2026-1004',
      rating: 5,
      comment: 'Study pod was quiet, well-air-conditioned, and had high-speed Ethernet ports. Ideal for our team hackathon prep.',
    },
    {
      code: 'CS-2026-1005',
      rating: 4,
      comment: 'Badminton court synthetic mat was in great condition. Net tension was good. Highly recommended for evening games.',
    },
    {
      code: 'CS-2026-1006',
      rating: 5,
      comment: 'Technician was super knowledgeable. He reinstalled Ubuntu alongside Windows without losing any of my coding files.',
    },
    {
      code: 'CS-2026-1007',
      rating: 4,
      comment: 'Quick turnaround on replacing the tubelight in Room 304. Electrician arrived within 20 minutes of the slot.',
    },
    {
      code: 'CS-2026-1008',
      rating: 5,
      comment: 'Crisp plot output with accurate CMYK colors for our Architecture design jury presentation.',
    },
    {
      code: 'CS-2026-1009',
      rating: 4,
      comment: 'Meal token queue skip worked smoothly during midnight rush. Food was warm and fresh.',
    },
    {
      code: 'CS-2026-1010',
      rating: 5,
      comment: 'Blazer was pressed crisply with perfect crease lines. Saved my morning before the company interview.',
    },
    {
      code: 'CS-2026-1011',
      rating: 5,
      comment: 'Trained my research vision model without thermal throttling. CampusServe makes supercomputer access seamless.',
    },
    {
      code: 'CS-2026-1012',
      rating: 4,
      comment: 'Good laundry wash quality. Friendly attendants at Hostel B laundry counter.',
    },
    {
      code: 'CS-2026-1013',
      rating: 5,
      comment: 'Auditorium sound system and stage monitors performed flawlessly for our college musical production.',
    },
    {
      code: 'CS-2026-1014',
      rating: 4,
      comment: 'Plumber resolved the sink leak and replaced the washer promptly. Clean work.',
    },
    {
      code: 'CS-2026-1015',
      rating: 5,
      comment: 'Leatherette cover embossing looks very premium. Very affordable student pricing.',
    },
    {
      code: 'CS-2026-1016',
      rating: 5,
      comment: 'Clean glass pod with large HDMI display. Great for presenting slides to teammates.',
    },
    {
      code: 'CS-2026-1017',
      rating: 4,
      comment: 'Good lighting on Court 1. Non-marking shoes required, nice sports facility.',
    },
    {
      code: 'CS-2026-1018',
      rating: 5,
      comment: 'My MacBook runs much cooler now. IT staff was friendly, polite, and verified all hardware diagnostics.',
    },
  ];

  let reviewsCreated = 0;
  for (const rev of reviewSpecs) {
    const booking = await prisma.booking.findUnique({
      where: { bookingCode: rev.code },
      include: { service: true },
    });

    if (booking && booking.studentId) {
      await prisma.review.upsert({
        where: { bookingId: booking.id },
        update: {
          rating: rev.rating,
          comment: rev.comment,
          serviceId: booking.serviceId,
          userId: booking.studentId,
        },
        create: {
          bookingId: booking.id,
          rating: rev.rating,
          comment: rev.comment,
          serviceId: booking.serviceId,
          userId: booking.studentId,
          createdAt: booking.createdAt,
        },
      });
      reviewsCreated++;
    }
  }

  console.log(`   ✓ Seeded ${reviewsCreated} verified student reviews and star ratings.`);

  // ----------------------------------------------------------------
  // 7. SEED NOTIFICATIONS (ALL ROLES)
  // ----------------------------------------------------------------
  console.log('\n🔔 [7/7] Seeding Role-Specific Notifications...');

  const notificationData = [
    // Student Notifications
    {
      userId: students[0].id,
      title: 'Booking Confirmed: GPU Computing Cluster',
      message: 'Your GPU cluster pass for token CS-2026-1001 has been confirmed by Central IT Support.',
      type: NotificationType.BOOKING_CONFIRMED,
      link: '/student/bookings',
      isRead: true,
      createdAt: daysAgo(24),
    },
    {
      userId: students[0].id,
      title: 'Session Started: Active GPU Training',
      message: 'Your A100 node session (CS-2026-2001) is now in progress. Access credentials active.',
      type: NotificationType.BOOKING_IN_PROGRESS,
      link: '/student/bookings',
      isRead: false,
      createdAt: daysAgo(0, 1),
    },
    {
      userId: students[1].id,
      title: 'Booking Completed: Laundry Wash & Fold',
      message: 'Your laundry bag for token CS-2026-1002 is ready for pickup at Hostel B Basement Counter.',
      type: NotificationType.BOOKING_COMPLETED,
      link: '/student/bookings',
      isRead: true,
      createdAt: daysAgo(22),
    },
    {
      userId: students[2].id,
      title: 'Payment Successful (₹350.00)',
      message: 'Razorpay payment for CS-2026-1003 (Thesis Hardcover Binding) was verified successfully.',
      type: NotificationType.PAYMENT_SUCCESSFUL,
      link: '/student/bookings',
      isRead: true,
      createdAt: daysAgo(20),
    },
    {
      userId: students[3].id,
      title: 'Booking Reminder: Study Pod Session',
      message: 'Your study pod reservation starts tomorrow at 01:30 PM in Central Library 3rd Floor.',
      type: NotificationType.BOOKING_CONFIRMED,
      link: '/student/bookings',
      isRead: false,
      createdAt: daysAgo(1),
    },

    // Provider Notifications (IT & Facilities)
    {
      userId: itProvider.id,
      title: 'New Booking Received',
      message: 'Student Aditya Mehta booked GPU Cluster pass (CS-2026-2001).',
      type: NotificationType.BOOKING_CREATED,
      link: '/provider/bookings',
      isRead: false,
      createdAt: daysAgo(0, 2),
    },
    {
      userId: itProvider.id,
      title: '5-Star Review Received',
      message: 'Rohan Verma gave 5 stars for Laptop Diagnostics: "Technician was super knowledgeable..."',
      type: NotificationType.REVIEW_RECEIVED,
      link: '/provider/dashboard',
      isRead: true,
      createdAt: daysAgo(15),
    },
    {
      userId: facilitiesProvider.id,
      title: 'Booking Request Awaiting Approval',
      message: 'Aarav Sharma requested booking for Auditorium Main Stage (CS-2026-4001).',
      type: NotificationType.BOOKING_CREATED,
      link: '/provider/bookings',
      isRead: false,
      createdAt: daysAgo(0, 4),
    },
    {
      userId: facilitiesProvider.id,
      title: 'Maintenance Ticket Submitted',
      message: 'New urgent plumbing request for Hostel 4 corridor (CS-2026-4002).',
      type: NotificationType.BOOKING_CREATED,
      link: '/provider/bookings',
      isRead: false,
      createdAt: daysAgo(0, 3),
    },
    {
      userId: reproProvider.id,
      title: '5-Star Review Received',
      message: 'Priya Patel rated Thesis Hardcover Binding: "Binding quality was impeccable..."',
      type: NotificationType.REVIEW_RECEIVED,
      link: '/provider/dashboard',
      isRead: false,
      createdAt: daysAgo(4),
    },

    // Admin Notifications
    {
      userId: adminUser.id,
      title: 'Weekly Campus Operations Summary',
      message: 'CampusServe settled 28 bookings and ₹6,480 in revenue over the past 30 days with 95.8% fulfillment.',
      type: NotificationType.SYSTEM_ALERT,
      link: '/admin/analytics',
      isRead: false,
      createdAt: daysAgo(1),
    },
    {
      userId: adminUser.id,
      title: 'Scheduled Maintenance Advisory',
      message: 'GPU Cluster maintenance window scheduled for Block C on Friday 02:00 AM - 06:00 AM.',
      type: NotificationType.SYSTEM_ALERT,
      link: '/admin/services',
      isRead: true,
      createdAt: daysAgo(2),
    },
  ];

  let notificationsCreated = 0;
  for (const notif of notificationData) {
    await prisma.notification.create({
      data: {
        userId: notif.userId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        link: notif.link,
        isRead: notif.isRead,
        createdAt: notif.createdAt,
      },
    });
    notificationsCreated++;
  }

  console.log(`   ✓ Seeded ${notificationsCreated} actionable notifications across all user roles.`);

  // ----------------------------------------------------------------
  // SUMMARY OF DATABASE POPULATION
  // ----------------------------------------------------------------
  const [totalUsers, totalCategories, totalServices, totalAvail, totalBookings, totalPayments, totalReviews, totalNotifications] =
    await Promise.all([
      prisma.user.count(),
      prisma.serviceCategory.count(),
      prisma.service.count(),
      prisma.serviceAvailability.count(),
      prisma.booking.count(),
      prisma.payment.count(),
      prisma.review.count(),
      prisma.notification.count(),
    ]);

  console.log('\n================================================================');
  console.log('       CAMPUSSERVE SEEDING COMPLETED SUCCESSFULLY!        ');
  console.log('================================================================');
  console.log(`📦 Users:               ${totalUsers} (Admin, Providers, Students)`);
  console.log(`📂 Service Categories:  ${totalCategories}`);
  console.log(`🛠️  Services:            ${totalServices}`);
  console.log(`📅 Operating Hours:     ${totalAvail} weekly schedule slots`);
  console.log(`📋 Bookings:            ${totalBookings} (Full lifecycle)`);
  console.log(`💳 Payments:            ${totalPayments} (Razorpay test records)`);
  console.log(`⭐ Reviews:             ${totalReviews} student reviews`);
  console.log(`🔔 Notifications:       ${totalNotifications} multi-role alerts`);
  console.log('================================================================\n');
}

seed()
  .catch((e) => {
    console.error('❌ Database Seeding Fatal Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
