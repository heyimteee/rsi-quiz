import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addHours, startOfDay, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

const PASSWORD = "password123";
const NOW = startOfDay(new Date());

function at(dayOffset: number, hour = 9, minute = 0) {
  return setMinutes(setHours(addDays(NOW, dayOffset), hour), minute);
}

function dateIn(year: number, monthIndex: number, day: number, hour = 9) {
  return setMinutes(setHours(new Date(year, monthIndex, day), hour), 0);
}

async function main() {
  console.log("Reset database…");
  await prisma.ticketValidation.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.bookingSegment.deleteMany();
  await prisma.emailOutbox.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.itinerarySegment.deleteMany();
  await prisma.itinerary.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.passengerProfile.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.airport.deleteMany();
  await prisma.airline.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  console.log("Seed users and profiles…");
  const hrd = await prisma.user.create({
    data: { name: "Rina Kartika", email: "hrd@demo.test", passwordHash, role: "HRD_MANAGER" },
  });
  const travel = await prisma.user.create({
    data: { name: "Bima Santoso", email: "travel@demo.test", passwordHash, role: "TRAVEL_MANAGER" },
  });
  const penumpang = await prisma.user.create({
    data: {
      name: "Aditya Pratama",
      email: "penumpang@demo.test",
      passwordHash,
      role: "PASSENGER",
      profile: {
        create: {
          fullName: "Aditya Pratama",
          nik: "3171012506950001",
          phone: "081234567890",
          birthDate: new Date(1995, 5, 25),
          passportNumber: "B1234567",
        },
      },
    },
  });
  const pelanggan = await prisma.user.create({
    data: {
      name: "Maya Sari",
      email: "pelanggan@demo.test",
      passwordHash,
      role: "PASSENGER",
      profile: {
        create: {
          fullName: "Maya Sari",
          nik: "3171021807920002",
          phone: "081298765432",
          birthDate: new Date(1992, 6, 18),
        },
      },
    },
  });
  const member = await prisma.user.create({
    data: {
      name: "Dimas Nugroho",
      email: "member@demo.test",
      passwordHash,
      role: "MEMBER",
      profile: {
        create: {
          fullName: "Dimas Nugroho",
          nik: "3171031103900003",
          phone: "081311112222",
          birthDate: new Date(1990, 2, 11),
          passportNumber: "C7654321",
        },
      },
    },
  });
  const member2 = await prisma.user.create({
    data: {
      name: "Laras Wijaya",
      email: "member2@demo.test",
      passwordHash,
      role: "MEMBER",
      profile: {
        create: {
          fullName: "Laras Wijaya",
          nik: null,
          phone: "081399998888",
          birthDate: null,
        },
      },
    },
  });
  const pengunjung = await prisma.user.create({
    data: {
      name: "Siti Rahma",
      email: "pengunjung@demo.test",
      passwordHash,
      role: "VISITOR",
      profile: {
        create: {
          fullName: "Siti Rahma",
          nik: "3171042209940004",
          phone: "081355556666",
          birthDate: new Date(1994, 8, 22),
        },
      },
    },
  });
  const budi = await prisma.user.create({
    data: {
      name: "Budi Hartono",
      email: "budi.visitor@demo.test",
      passwordHash,
      role: "VISITOR",
      profile: {
        create: {
          fullName: "Budi Hartono",
          nik: "3171050508880005",
          phone: "081377774444",
          birthDate: new Date(1988, 4, 5),
        },
      },
    },
  });
  await prisma.user.create({
    data: {
      name: "Sari Melati",
      email: "sari.visitor@demo.test",
      passwordHash,
      role: "VISITOR",
      profile: {
        create: {
          fullName: "Sari Melati",
          nik: "3171061501990006",
          phone: "081366663333",
          birthDate: new Date(1999, 0, 15),
        },
      },
    },
  });

  console.log("Seed employees and leave…");
  const employeesData = [
    { name: "Andi Saputra", nip: "198501012010011001", department: "Keuangan", email: "andi@company.test" },
    { name: "Bunga Lestari", nip: "199002022012012002", department: "Marketing", email: "bunga@company.test" },
    { name: "Candra Wijaya", nip: "198803032009011003", department: "IT", email: "candra@company.test" },
    { name: "Dewi Anggraini", nip: "199204042015012004", department: "HRD", email: "dewi@company.test" },
    { name: "Eko Prasetyo", nip: "198705052011011005", department: "Operasional", email: "eko@company.test" },
    { name: "Fitri Handayani", nip: "199306062016012006", department: "Keuangan", email: "fitri@company.test" },
    { name: "Gilang Ramadhan", nip: "199007072013011007", department: "IT", email: "gilang@company.test" },
    { name: "Hana Permata", nip: "199508082018012008", department: "Marketing", email: "hana@company.test" },
  ];
  const employees: Array<{ id: string; name: string; nip: string }> = [];
  for (const data of employeesData) {
    employees.push(
      await prisma.employee.create({
        data: { ...data, annualQuota: 12 },
      }),
    );
  }

  const year = NOW.getFullYear();
  const month = NOW.getMonth();
  const leaveRows: Array<{
    employeeId: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: string;
  }> = [];

  const reasons = [
    "Liburan keluarga",
    "Keperluan keluarga",
    "Pemeriksaan kesehatan",
    "Acara pernikahan saudara",
    "Mudik ke kampung halaman",
    "Istirahat dan pemulihan",
  ];

  // Current-month leave, spread across employees.
  const currentMonthSpans: Array<[number, number, number, string]> = [
    [0, 2, 4, "APPROVED"],
    [1, 6, 8, "APPROVED"],
    [2, 12, 13, "PENDING"],
    [3, 17, 19, "APPROVED"],
    [4, 22, 26, "APPROVED"],
    [5, 9, 10, "REJECTED"],
    [6, 1, 2, "APPROVED"],
    [7, 14, 16, "PENDING"],
  ];
  currentMonthSpans.forEach(([empIndex, startDay, endDay, status], i) => {
    const clampedStart = Math.min(startDay, 27);
    const clampedEnd = Math.min(endDay, 27);
    leaveRows.push({
      employeeId: employees[empIndex].id,
      startDate: dateIn(year, month, clampedStart),
      endDate: dateIn(year, month, Math.max(clampedStart, clampedEnd)),
      reason: reasons[i % reasons.length],
      status,
    });
  });

  // Previous month.
  leaveRows.push({
    employeeId: employees[0].id,
    startDate: dateIn(year, month - 1, 10),
    endDate: dateIn(year, month - 1, 12),
    reason: "Liburan keluarga",
    status: "APPROVED",
  });
  leaveRows.push({
    employeeId: employees[4].id,
    startDate: dateIn(year, month - 1, 20),
    endDate: dateIn(year, month - 1, 21),
    reason: "Keperluan keluarga",
    status: "APPROVED",
  });

  // Next month.
  leaveRows.push({
    employeeId: employees[1].id,
    startDate: dateIn(year, month + 1, 4),
    endDate: dateIn(year, month + 1, 7),
    reason: "Mudik ke kampung halaman",
    status: "PENDING",
  });
  leaveRows.push({
    employeeId: employees[6].id,
    startDate: dateIn(year, month + 1, 15),
    endDate: dateIn(year, month + 1, 18),
    reason: "Istirahat dan pemulihan",
    status: "APPROVED",
  });

  // Earlier this year.
  leaveRows.push({
    employeeId: employees[2].id,
    startDate: dateIn(year, 1, 17),
    endDate: dateIn(year, 1, 19),
    reason: "Pemeriksaan kesehatan",
    status: "APPROVED",
  });
  leaveRows.push({
    employeeId: employees[7].id,
    startDate: dateIn(year, 2, 3),
    endDate: dateIn(year, 2, 5),
    reason: "Acara pernikahan saudara",
    status: "APPROVED",
  });
  leaveRows.push({
    employeeId: employees[3].id,
    startDate: dateIn(year, 0, 6),
    endDate: dateIn(year, 0, 8),
    reason: "Liburan keluarga",
    status: "APPROVED",
  });

  // Previous year history.
  for (let i = 0; i < employees.length; i++) {
    leaveRows.push({
      employeeId: employees[i].id,
      startDate: dateIn(year - 1, 6, 5 + i),
      endDate: dateIn(year - 1, 6, 7 + i),
      reason: reasons[i % reasons.length],
      status: "APPROVED",
    });
  }

  // Cross-year request: 4 days in current year, 3 in next year.
  leaveRows.push({
    employeeId: employees[5].id,
    startDate: dateIn(year, 11, 28),
    endDate: dateIn(year + 1, 0, 3),
    reason: "Liburan akhir tahun",
    status: "APPROVED",
  });

  await prisma.leaveRequest.createMany({ data: leaveRows });

  console.log("Seed airports, airlines, flights…");
  const airportData = [
    { code: "CGK", city: "Jakarta", name: "Soekarno-Hatta International Airport" },
    { code: "DPS", city: "Denpasar", name: "I Gusti Ngurah Rai International Airport" },
    { code: "SUB", city: "Surabaya", name: "Juanda International Airport" },
    { code: "KNO", city: "Medan", name: "Kualanamu International Airport" },
    { code: "JOG", city: "Yogyakarta", name: "Yogyakarta International Airport" },
    { code: "UPG", city: "Makassar", name: "Sultan Hasanuddin International Airport" },
  ];
  const airports: Record<string, { id: string; code: string; city: string; name: string }> = {};
  for (const airport of airportData) {
    airports[airport.code] = await prisma.airport.create({ data: airport });
  }

  const airlineData = [
    { code: "GA", name: "Garuda Indonesia" },
    { code: "JT", name: "Lion Air" },
    { code: "QG", name: "Citilink" },
    { code: "ID", name: "Batik Air" },
  ];
  const airlines = [];
  for (const airline of airlineData) {
    airlines.push(await prisma.airline.create({ data: airline }));
  }

  const routes: Array<{ from: string; to: string; minutes: number; basePrice: number; frequency: number }> = [
    { from: "CGK", to: "DPS", minutes: 110, basePrice: 1250000, frequency: 3 },
    { from: "DPS", to: "CGK", minutes: 105, basePrice: 1200000, frequency: 3 },
    { from: "CGK", to: "SUB", minutes: 90, basePrice: 850000, frequency: 3 },
    { from: "SUB", to: "CGK", minutes: 90, basePrice: 820000, frequency: 3 },
    { from: "CGK", to: "KNO", minutes: 140, basePrice: 1450000, frequency: 3 },
    { from: "KNO", to: "CGK", minutes: 145, basePrice: 1420000, frequency: 3 },
    { from: "CGK", to: "JOG", minutes: 75, basePrice: 720000, frequency: 3 },
    { from: "JOG", to: "CGK", minutes: 75, basePrice: 700000, frequency: 3 },
    { from: "CGK", to: "UPG", minutes: 135, basePrice: 1550000, frequency: 2 },
    { from: "UPG", to: "CGK", minutes: 135, basePrice: 1520000, frequency: 2 },
    { from: "DPS", to: "SUB", minutes: 55, basePrice: 620000, frequency: 2 },
    { from: "SUB", to: "DPS", minutes: 55, basePrice: 610000, frequency: 2 },
  ];

  const departureSlots = [
    { hour: 6, minute: 30 },
    { hour: 12, minute: 15 },
    { hour: 18, minute: 40 },
  ];

  const flightRows: Array<{
    flightNumber: string;
    airlineId: string;
    originId: string;
    destinationId: string;
    departureAt: Date;
    arrivalAt: Date;
    price: number;
    seatsAvailable: number;
  }> = [];

  let flightCounter = 100;
  for (let day = 0; day <= 21; day++) {
    for (const route of routes) {
      for (let slot = 0; slot < route.frequency; slot++) {
        const departure = at(day, departureSlots[slot].hour, departureSlots[slot].minute);
        const airline = airlines[(flightCounter + slot) % airlines.length];
        const priceVariation = ((flightCounter * 7919) % 9) * 35000;
        const price = route.basePrice + priceVariation + (slot === 0 ? 0 : 45000);
        flightRows.push({
          flightNumber: `${airline.code}${flightCounter++}`,
          airlineId: airline.id,
          originId: airports[route.from].id,
          destinationId: airports[route.to].id,
          departureAt: departure,
          arrivalAt: addHours(departure, 0),
          price,
          seatsAvailable: 42 + ((flightCounter * 13) % 50),
        });
        // Fix arrival with minutes rather than whole hours.
        flightRows[flightRows.length - 1].arrivalAt = new Date(departure.getTime() + route.minutes * 60_000);
      }
    }
  }

  await prisma.flight.createMany({ data: flightRows });
  console.log(`Seeded ${flightRows.length} flights.`);

  async function findFlight(origin: string, destination: string, dayOffset: number, hour?: number) {
    const dayStart = startOfDay(addDays(NOW, dayOffset));
    const dayEnd = addDays(dayStart, 1);
    const flight = await prisma.flight.findFirst({
      where: {
        originId: airports[origin].id,
        destinationId: airports[destination].id,
        departureAt: {
          gte: hour === undefined ? dayStart : setMinutes(setHours(dayStart, hour), 0),
          lt: dayEnd,
        },
      },
      include: { airline: true, origin: true, destination: true },
      orderBy: { departureAt: "asc" },
    });
    if (!flight) throw new Error(`No flight ${origin}-${destination} on day ${dayOffset}`);
    return flight;
  }

  console.log("Seed bookings, tickets and emails…");
  let ticketCounter = 1;
  async function createBooking(input: {
    reference: string;
    bookerId: string;
    passengerId: string;
    status: string;
    tripType?: string;
    flights: Array<{ flight: Awaited<ReturnType<typeof findFlight>>; leg: string; sequence: number }>;
    sendEmail?: boolean;
  }) {
    const totalPrice = input.flights.reduce((sum, item) => sum + item.flight.price, 0);
    const booking = await prisma.booking.create({
      data: {
        referenceCode: input.reference,
        bookerId: input.bookerId,
        passengerId: input.passengerId,
        status: input.status,
        tripType: input.tripType ?? "ONE_WAY",
        totalPrice,
        segments: {
          create: input.flights.map((item) => ({
            flightId: item.flight.id,
            leg: item.leg,
            sequence: item.sequence,
          })),
        },
        ticket: {
          create: {
            ticketNumber: `TK-2026-${String(ticketCounter++).padStart(4, "0")}`,
            validationStatus: "PENDING",
          },
        },
      },
      include: { segments: { include: { flight: { include: { airline: true, origin: true, destination: true } } } }, ticket: true },
    });

    if (input.status === "CANCELLED") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { cancelledAt: NOW },
      });
    } else {
      for (const item of input.flights) {
        await prisma.flight.update({
          where: { id: item.flight.id },
          data: { seatsAvailable: { decrement: 1 } },
        });
      }
    }

    if (input.sendEmail) {
      const passenger = await prisma.user.findUnique({ where: { id: input.passengerId } });
      const firstSegment = booking.segments[0];
      await prisma.emailOutbox.create({
        data: {
          bookingId: booking.id,
          recipient: passenger?.email ?? "unknown@demo.test",
          subject: `E-Tiket ${input.reference} — ${firstSegment.flight.origin.city} ke ${firstSegment.flight.destination.city}`,
          body: [
            `Halo ${passenger?.name ?? "Pengunjung"},`,
            "",
            "E-tiket Anda telah diterbitkan.",
            `Kode booking: ${input.reference}`,
            `Nomor tiket: ${booking.ticket?.ticketNumber}`,
            `Rute: ${firstSegment.flight.origin.code} → ${firstSegment.flight.destination.code}`,
            `Maskapai: ${firstSegment.flight.airline.name}`,
            `Keberangkatan: ${firstSegment.flight.departureAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`,
            `Total: Rp${totalPrice.toLocaleString("id-ID")}`,
            "",
            "Terima kasih telah menggunakan TravelKu.",
          ].join("\n"),
        },
      });
    }

    return booking;
  }

  const f1 = await findFlight("CGK", "DPS", 1);
  const f2 = await findFlight("CGK", "SUB", 3);
  const f3 = await findFlight("CGK", "KNO", 5);
  const f4 = await findFlight("DPS", "CGK", 7);
  const f5 = await findFlight("CGK", "DPS", 2);
  const f6 = await findFlight("CGK", "SUB", 4);
  const f7 = await findFlight("CGK", "JOG", 6, 12);
  const f8 = await findFlight("SUB", "CGK", 8, 12);
  const f9out = await findFlight("CGK", "DPS", 10, 6);
  const f9ret = await findFlight("DPS", "CGK", 14, 12);
  const f10out = await findFlight("CGK", "JOG", 12, 6);
  const f10ret = await findFlight("JOG", "CGK", 15, 18);

  await createBooking({
    reference: "TRV-DEMO01",
    bookerId: penumpang.id,
    passengerId: penumpang.id,
    status: "CONFIRMED",
    flights: [{ flight: f1, leg: "OUTBOUND", sequence: 1 }],
  });
  await createBooking({
    reference: "TRV-DEMO02",
    bookerId: penumpang.id,
    passengerId: penumpang.id,
    status: "WAITING_FOR_PAYMENT",
    flights: [{ flight: f2, leg: "OUTBOUND", sequence: 1 }],
  });
  await createBooking({
    reference: "TRV-DEMO03",
    bookerId: pelanggan.id,
    passengerId: pelanggan.id,
    status: "BOOKED",
    flights: [{ flight: f3, leg: "OUTBOUND", sequence: 1 }],
  });
  await createBooking({
    reference: "TRV-DEMO04",
    bookerId: pelanggan.id,
    passengerId: pelanggan.id,
    status: "CANCELLED",
    flights: [{ flight: f4, leg: "OUTBOUND", sequence: 1 }],
  });
  await createBooking({
    reference: "TRV-DEMO05",
    bookerId: member.id,
    passengerId: member.id,
    status: "CONFIRMED",
    flights: [{ flight: f5, leg: "OUTBOUND", sequence: 1 }],
  });
  await createBooking({
    reference: "TRV-DEMO06",
    bookerId: member2.id,
    passengerId: member2.id,
    status: "CONFIRMED",
    flights: [{ flight: f6, leg: "OUTBOUND", sequence: 1 }],
  });
  await createBooking({
    reference: "TRV-DEMO07",
    bookerId: travel.id,
    passengerId: pengunjung.id,
    status: "CONFIRMED",
    sendEmail: true,
    flights: [{ flight: f7, leg: "OUTBOUND", sequence: 1 }],
  });
  await createBooking({
    reference: "TRV-DEMO08",
    bookerId: travel.id,
    passengerId: budi.id,
    status: "BOOKED",
    sendEmail: true,
    flights: [{ flight: f8, leg: "OUTBOUND", sequence: 1 }],
  });
  await createBooking({
    reference: "TRV-DEMO09",
    bookerId: penumpang.id,
    passengerId: penumpang.id,
    status: "CONFIRMED",
    tripType: "ROUND_TRIP",
    flights: [
      { flight: f9out, leg: "OUTBOUND", sequence: 1 },
      { flight: f9ret, leg: "RETURN", sequence: 2 },
    ],
  });
  await createBooking({
    reference: "TRV-DEMO10",
    bookerId: member.id,
    passengerId: member.id,
    status: "CONFIRMED",
    tripType: "ROUND_TRIP",
    flights: [
      { flight: f10out, leg: "OUTBOUND", sequence: 1 },
      { flight: f10ret, leg: "RETURN", sequence: 2 },
    ],
  });

  console.log("Seed itineraries…");
  await prisma.itinerary.create({
    data: {
      memberId: member.id,
      name: "Liburan Bali–Surabaya",
      segments: {
        create: [
          {
            originId: airports.CGK.id,
            destinationId: airports.DPS.id,
            departureDate: at(12),
            sequence: 1,
          },
          {
            originId: airports.DPS.id,
            destinationId: airports.SUB.id,
            departureDate: at(15),
            sequence: 2,
          },
        ],
      },
    },
  });
  await prisma.itinerary.create({
    data: {
      memberId: member.id,
      name: "Perjalanan Bisnis Medan",
      segments: {
        create: [
          {
            originId: airports.CGK.id,
            destinationId: airports.KNO.id,
            departureDate: at(18),
            sequence: 1,
          },
        ],
      },
    },
  });

  console.log("Seed validation history…");
  const demoTicket = await prisma.ticket.findFirst({
    where: { booking: { referenceCode: "TRV-DEMO06" } },
  });
  if (demoTicket) {
    await prisma.ticket.update({
      where: { id: demoTicket.id },
      data: { validationStatus: "REJECTED" },
    });
    await prisma.ticketValidation.create({
      data: {
        ticketId: demoTicket.id,
        profileId: member2.id,
        status: "REJECTED",
        message: "Data profil tidak lengkap",
      },
    });
  }

  console.log("Seed selesai.");
  console.log(`Login: hrd@demo.test / ${PASSWORD}`);
  console.log(`Employees: ${employees.length}, flights: ${flightRows.length}`);
  console.log(`HRD user: ${hrd.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
