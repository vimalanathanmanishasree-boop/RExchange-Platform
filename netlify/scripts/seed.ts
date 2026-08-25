import { db } from "../../db/index.js";
import {
  users,
  allowedDomains,
  listings,
  exchanges,
  ratings,
  messages,
} from "../../db/schema.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding RExchange demo data...");

  await db.insert(allowedDomains).values([{ domain: "greyfriars.edu" }]).onConflictDoNothing();

  const pw = await bcrypt.hash("Campus#2026", 10);
  const adminPw = await bcrypt.hash("AdminKarma#1", 10);

  const demoUsers = [
    { email: "asha.verma@greyfriars.edu", name: "Asha Verma", department: "Computer Science", year: "3rd Year", hostelBlock: "Elm Block", karma: 140 },
    { email: "devraj.iyer@greyfriars.edu", name: "Devraj Iyer", department: "Mechanical Engineering", year: "4th Year", hostelBlock: "Cedar Block", karma: 95 },
    { email: "noor.fatima@greyfriars.edu", name: "Noor Fatima", department: "Economics", year: "2nd Year", hostelBlock: "Birch Block", karma: 210 },
    { email: "leo.dsouza@greyfriars.edu", name: "Leo D'Souza", department: "Computer Science", year: "2nd Year", hostelBlock: "Elm Block", karma: 60 },
    { email: "priya.nair@greyfriars.edu", name: "Priya Nair", department: "Biotechnology", year: "1st Year", hostelBlock: "Willow Block", karma: 30 },
    { email: "sam.thomas@greyfriars.edu", name: "Sam Thomas", department: "Physics", year: "4th Year", hostelBlock: "Cedar Block", karma: 175 },
    { email: "tara.k@greyfriars.edu", name: "Tara Krishnan", department: "Economics", year: "3rd Year", hostelBlock: "Birch Block", karma: 88 },
    { email: "admin@greyfriars.edu", name: "Meera Rao (Admin)", department: "Student Affairs", year: "Staff", hostelBlock: "", karma: 0, role: "admin" },
  ];

  const insertedUsers = [];
  for (const u of demoUsers) {
    const [row] = await db
      .insert(users)
      .values({
        email: u.email,
        passwordHash: u.role === "admin" ? adminPw : pw,
        name: u.name,
        department: u.department,
        year: u.year,
        hostelBlock: u.hostelBlock,
        verified: true,
        role: u.role || "student",
        karma: u.karma,
        bio: `${u.department} · ${u.year}`,
      })
      .onConflictDoNothing()
      .returning();
    if (row) insertedUsers.push(row);
  }

  const all = insertedUsers.length ? insertedUsers : await db.select().from(users);
  const byEmail = (e: string) => all.find((u) => u.email === e)!;

  const listingSeeds = [
    {
      owner: "asha.verma@greyfriars.edu",
      title: "Introduction to Algorithms (CLRS), 3rd Ed",
      description: "Well-loved copy, some highlighter marks in chapters 1-9. Great for CS201.",
      category: "Textbooks",
      condition: "Good",
      exchangeModes: ["Barter", "Karma Points"],
      karmaValue: 40,
      subjectCode: "CS201",
    },
    {
      owner: "devraj.iyer@greyfriars.edu",
      title: "Casio FX-991ES Scientific Calculator",
      description: "Barely used, batteries included. Perfect for thermodynamics exams.",
      category: "Electronics",
      condition: "Like New",
      exchangeModes: ["Karma Points", "Paid Resale"],
      karmaValue: 25,
      price: 450,
    },
    {
      owner: "noor.fatima@greyfriars.edu",
      title: "Sunburn Music Festival - 1 Entry Pass",
      description: "Can't make it anymore, transferring my pass. Valid gate entry, ID required.",
      category: "Event Tickets",
      condition: "New",
      exchangeModes: ["Paid Resale"],
      karmaValue: 0,
      price: 1200,
      expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      owner: "sam.thomas@greyfriars.edu",
      title: "Quantum Mechanics Semester Notes (Handwritten)",
      description: "Full semester notes with solved problem sets, PHY301. Diagrams included.",
      category: "Notes & Study Material",
      condition: "Good",
      exchangeModes: ["Free Giveaway", "Karma Points"],
      karmaValue: 15,
      subjectCode: "PHY301",
    },
    {
      owner: "tara.k@greyfriars.edu",
      title: "Excel & Financial Modeling Tutoring (1hr sessions)",
      description: "Econ senior offering 1:1 tutoring on financial modeling and macro problem sets.",
      category: "Skills/Services",
      condition: "New",
      exchangeModes: ["Karma Points"],
      karmaValue: 20,
    },
    {
      owner: "leo.dsouza@greyfriars.edu",
      title: "Mini Desk Fan + Fairy Lights bundle",
      description: "Moving out of the hostel, giving away my desk setup extras.",
      category: "Miscellaneous",
      condition: "Fair",
      exchangeModes: ["Free Giveaway"],
      karmaValue: 5,
    },
    {
      owner: "priya.nair@greyfriars.edu",
      title: "Organic Chemistry Lab Manual + Molecular Model Kit",
      description: "Used for one semester, kit is complete with all atom pieces.",
      category: "Textbooks",
      condition: "Good",
      exchangeModes: ["Barter", "Karma Points"],
      karmaValue: 30,
      subjectCode: "CHEM210",
    },
    {
      owner: "devraj.iyer@greyfriars.edu",
      title: "Arctic Monkeys Concert Ticket - Balcony",
      description: "Friend can't come, selling at cost. E-ticket, transferable.",
      category: "Event Tickets",
      condition: "New",
      exchangeModes: ["Paid Resale"],
      price: 2200,
      karmaValue: 0,
      expiryDate: new Date(Date.now() + 18 * 60 * 60 * 1000),
    },
    {
      owner: "asha.verma@greyfriars.edu",
      title: "Data Structures Crash Course Notes + Practice Sheets",
      description: "Condensed notes covering trees, graphs, DP with practice problems.",
      category: "Notes & Study Material",
      condition: "New",
      exchangeModes: ["Karma Points", "Free Giveaway"],
      karmaValue: 10,
      subjectCode: "CS201",
    },
    {
      owner: "sam.thomas@greyfriars.edu",
      title: "Guitar Lessons for Beginners",
      description: "Self-taught for 6 years, happy to teach chords and basic songs on weekends.",
      category: "Skills/Services",
      condition: "New",
      exchangeModes: ["Barter", "Karma Points"],
      karmaValue: 15,
    },
  ];

  const insertedListings = [];
  for (const l of listingSeeds) {
    const owner = byEmail(l.owner);
    if (!owner) continue;
    const [row] = await db
      .insert(listings)
      .values({
        ownerId: owner.id,
        title: l.title,
        description: l.description,
        category: l.category,
        condition: l.condition,
        exchangeModes: l.exchangeModes,
        karmaValue: l.karmaValue,
        price: (l as any).price ?? null,
        photoKeys: [],
        expiryDate: (l as any).expiryDate ?? null,
        subjectCode: (l as any).subjectCode ?? null,
        upvotes: Math.floor(Math.random() * 6),
      })
      .returning();
    insertedListings.push(row);
  }

  // A couple of completed exchanges with ratings, so the app "looks alive"
  if (insertedListings.length >= 2) {
    const l1 = insertedListings[3]; // notes from sam
    const requester1 = byEmail("leo.dsouza@greyfriars.edu");
    if (l1 && requester1) {
      const [ex1] = await db
        .insert(exchanges)
        .values({
          listingId: l1.id,
          requesterId: requester1.id,
          ownerId: l1.ownerId,
          status: "Completed",
          karmaAwarded: l1.karmaValue,
          requesterRevealed: true,
          ownerRevealed: true,
          completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        })
        .returning();
      await db.update(listings).set({ status: "Completed" }).where(eq(listings.id, l1.id));
      await db.insert(ratings).values([
        { exchangeId: ex1.id, raterId: requester1.id, rateeId: l1.ownerId, stars: 5, review: "Super clear notes, exactly what I needed before the exam." },
        { exchangeId: ex1.id, raterId: l1.ownerId, rateeId: requester1.id, stars: 4, review: "Picked up on time, great communication." },
      ]);
      await db.insert(messages).values([
        { listingId: l1.id, senderId: requester1.id, recipientId: l1.ownerId, body: "Hey, still have the quantum mechanics notes?" },
        { listingId: l1.id, senderId: l1.ownerId, recipientId: requester1.id, body: "Yep! Want to trade karma points for it?" },
        { listingId: l1.id, senderId: requester1.id, recipientId: l1.ownerId, body: "Works for me, sending the request now." },
      ]);
    }

    const l2 = insertedListings[6]; // chem kit from priya
    const requester2 = byEmail("tara.k@greyfriars.edu");
    if (l2 && requester2) {
      const [ex2] = await db
        .insert(exchanges)
        .values({
          listingId: l2.id,
          requesterId: requester2.id,
          ownerId: l2.ownerId,
          status: "Completed",
          karmaAwarded: l2.karmaValue,
          requesterRevealed: true,
          ownerRevealed: true,
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        })
        .returning();
      await db.update(listings).set({ status: "Completed" }).where(eq(listings.id, l2.id));
      await db.insert(ratings).values([
        { exchangeId: ex2.id, raterId: requester2.id, rateeId: l2.ownerId, stars: 5, review: "Kit was complete, thank you!" },
      ]);
    }

    const l3 = insertedListings[1]; // calculator, pending
    const requester3 = byEmail("noor.fatima@greyfriars.edu");
    if (l3 && requester3) {
      await db.insert(exchanges).values({
        listingId: l3.id,
        requesterId: requester3.id,
        ownerId: l3.ownerId,
        status: "Requested",
      });
      await db.update(listings).set({ status: "Pending Exchange" }).where(eq(listings.id, l3.id));
    }
  }

  console.log(`Seeded ${all.length} users and ${insertedListings.length} listings.`);
  console.log("Demo login: asha.verma@greyfriars.edu / Campus#2026");
  console.log("Admin login: admin@greyfriars.edu / AdminKarma#1");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
