import { NextRequest, NextResponse } from "next/server";

const FIRST = [
  "Aarav",
  "Aanya",
  "Aarushi",
  "Abhay",
  "Aditi",
  "Aditya",
  "Aisha",
  "Akash",
  "Aman",
  "Amrita",
  "Ananya",
  "Anika",
  "Aniket",
  "Anirudh",
  "Anjali",
  "Ankit",
  "Anushka",
  "Arjun",
  "Arnav",
  "Aryan",
  "Avni",
  "Bhavya",
  "Chirag",
  "Deepak",
  "Dev",
  "Dhruv",
  "Diya",
  "Esha",
  "Farhan",
  "Gaurav",
  "Gayatri",
  "Harsh",
  "Harshita",
  "Isha",
  "Ishaan",
  "Janhvi",
  "Kabir",
  "Karan",
  "Kavya",
  "Krishna",
  "Kunal",
  "Lavanya",
  "Mahima",
  "Manav",
  "Meera",
  "Mihir",
  "Mohit",
  "Myra",
  "Naina",
  "Neha",
  "Nikhil",
  "Nisha",
  "Pooja",
  "Pranav",
  "Prisha",
  "Priya",
  "Rahul",
  "Raj",
  "Rajat",
  "Rhea",
  "Rishabh",
  "Riya",
  "Rohan",
  "Rohit",
  "Saanvi",
  "Sai",
  "Sakshi",
  "Sameer",
  "Sana",
  "Sanjana",
  "Sanjay",
  "Sara",
  "Sarthak",
  "Shreya",
  "Siddharth",
  "Simran",
  "Sneha",
  "Soham",
  "Suhani",
  "Tanvi",
  "Tarun",
  "Trisha",
  "Varun",
  "Ved",
  "Vidya",
  "Vikram",
  "Vivaan",
  "Yash",
  "Zara",
  "Aadhya",
  "Advait",
  "Alisha",
  "Ayaan",
  "Ira",
  "Kiara",
  "Laksh",
  "Navya",
  "Pari",
  "Reyansh",
  "Siya",
  "Tanya",
  "Vanya",
  "Yuvraj",
] as const;

const METRO = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
] as const;

const CITY = [
  "Jaipur",
  "Lucknow",
  "Kochi",
  "Chandigarh",
  "Indore",
  "Coimbatore",
  "Nagpur",
  "Bhubaneswar",
  "Visakhapatnam",
  "Surat",
  "Vadodara",
  "Thiruvananthapuram",
  "Patna",
  "Nashik",
  "Noida",
  "Gurugram",
  "Kanpur",
  "Bhopal",
] as const;

const TOWN = [
  "Mysuru",
  "Mangaluru",
  "Hubballi",
  "Warangal",
  "Guntur",
  "Vijayawada",
  "Rajkot",
  "Jodhpur",
  "Udaipur",
  "Dehradun",
  "Ranchi",
  "Raipur",
  "Guwahati",
  "Madurai",
  "Tiruchirappalli",
  "Salem",
  "Aurangabad",
  "Amritsar",
  "Jalandhar",
  "Prayagraj",
  "Meerut",
  "Ghaziabad",
  "Faridabad",
  "Kozhikode",
  "Thrissur",
  "Jamshedpur",
] as const;

const TEXT = [
  "just registered for The Hiring Games",
  "just joined the hackathon",
  "just locked in a spot",
  "just signed up to compete",
  "just entered the prize pool",
] as const;

const COOKIE = "hk_act";
const SESSION_MAX = 3;

function one<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

function city() {
  const roll = Math.random();
  return one(roll < 0.45 ? METRO : roll < 0.8 ? CITY : TOWN);
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const seen = Number(request.cookies.get(COOKIE)?.value ?? 0);
  if (!Number.isFinite(seen) || seen >= SESSION_MAX) {
    return new NextResponse(null, { status: 204 });
  }

  const res = NextResponse.json({
    name: one(FIRST),
    city: city(),
    text: one(TEXT),
  });
  res.headers.set("Cache-Control", "no-store");
  res.cookies.set(COOKIE, String(seen + 1), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 6,
  });
  return res;
}
