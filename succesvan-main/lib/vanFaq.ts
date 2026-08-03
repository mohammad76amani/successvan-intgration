import type { CategoryDetail } from "@/lib/category-detail";
import { buildCategoryPricingSummary } from "@/lib/category-detail";

type VanFaqItem = {
    question: string;
    answer: string;
};

export const VAN_DETAIL_FAQS: Record<string, VanFaqItem[]> = {
    "Short Wheel Base": [
        {
            question: "What is a Short Wheel Base van best used for?",
            answer:
                "A Short Wheel Base van is best for small moves, tools, boxed items, office furniture, student moves and city deliveries. It is a compact self-drive van hire option in London when you need more space than a car but do not want a large commercial vehicle.",
        },
        {
            question: "How much space does a Short Wheel Base van have?",
            answer:
                "Our Short Wheel Base van offers around 6.0 to 6.5 m³ of load volume, making it suitable for small furniture, boxes, tools and light business loads.",
        },
        {
            question: "Can I drive a Short Wheel Base van with a standard licence?",
            answer:
                "In most cases, a Short Wheel Base van can be driven with a standard Licence B, subject to our hire terms, driver checks and eligibility requirements.",
        },
        {
            question: "Is a Short Wheel Base van easy to drive in London?",
            answer:
                "Yes, the Short Wheel Base van is one of the easiest van hire options to drive around London. Its compact size helps with narrow streets, parking and short-distance city journeys.",
        },
        {
            question: "How much does Short Wheel Base van hire cost?",
            answer:
                "Current hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.",
        },
    ],

    "Medium Wheel Base": [
        {
            question: "What is a Medium Wheel Base van suitable for?",
            answer:
                "A Medium Wheel Base van is suitable for furniture moves, trade jobs, boxed stock, tools, small office moves and loads up to approximately 3 metres long.",
        },
        {
            question: "How big is a Medium Wheel Base van?",
            answer:
                "Our Medium Wheel Base van has around 10.0 m³ of load volume, giving customers more space than a Short Wheel Base van while still being practical for London driving.",
        },
        {
            question: "Can I use a Medium Wheel Base van for moving house?",
            answer:
                "Yes, a Medium Wheel Base van can be a good choice for small house moves, flat moves, student moves and transporting furniture or appliances.",
        },
        {
            question: "Do I need a special licence for Medium Wheel Base van hire?",
            answer:
                "A Medium Wheel Base van is usually available with a standard Licence B, subject to our driver eligibility checks and hire requirements.",
        },
        {
            question: "How much does Medium Wheel Base van hire cost?",
            answer:
                "Current hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.",
        },
    ],

    "Long Wheel Base": [
        {
            question: "What is a Long Wheel Base van best for?",
            answer:
                "A Long Wheel Base van is best for larger furniture moves, office relocations, trade equipment, appliances, boxed stock and carrying up to 4 Euro pallets depending on load layout.",
        },
        {
            question: "How much load space does a Long Wheel Base van have?",
            answer:
                "Our Long Wheel Base van offers around 11.5 m³ of load volume, making it a practical large van hire option for customers who need extra capacity.",
        },
        {
            question: "Is a Long Wheel Base van good for business use?",
            answer:
                "Yes, Long Wheel Base van hire is popular with tradespeople, delivery businesses, contractors and companies needing self-drive commercial vehicle rental in London.",
        },
        {
            question: "Can I drive a Long Wheel Base van on a normal licence?",
            answer:
                "In most cases, a Long Wheel Base van can be driven with a standard Licence B, subject to driver checks, insurance conditions and our rental terms.",
        },
        {
            question: "How much does Long Wheel Base van rental cost?",
            answer:
                "Current hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.",
        },
    ],

    "Extra Long Wheel Base": [
        {
            question: "What is an Extra Long Wheel Base van used for?",
            answer:
                "An Extra Long Wheel Base van is used for large or long loads such as furniture, timber, pipes, trade materials, event equipment, retail stock and bulky items.",
        },
        {
            question: "How much space is inside an Extra Long Wheel Base van?",
            answer:
                "Our Extra Long Wheel Base van offers around 15.1 m³ of load volume, making it one of the largest panel van hire options available before choosing a Luton van.",
        },
        {
            question: "Can an Extra Long Wheel Base van carry pallets?",
            answer:
                "Yes, depending on the load and safe weight distribution, an Extra Long Wheel Base van may carry up to 5 Euro pallets.",
        },
        {
            question: "Is Extra Long Wheel Base van hire self-drive?",
            answer:
                "Yes, this is a self-drive van hire service. Customers collect the van, drive it themselves and return it according to the agreed rental terms.",
        },
        {
            question: "How much does Extra Long Wheel Base van hire cost?",
            answer:
                "Current hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.",
        },
    ],

    "Luton With Tail-Lift": [
        {
            question: "What is a Luton van with tail lift best used for?",
            answer:
                "A Luton van with tail lift is best for house moves, office relocations, furniture, appliances, pallets, bulky items and heavy goods that are easier to load with a hydraulic lift.",
        },
        {
            question: "How big is a Luton van with tail lift?",
            answer:
                "Our Luton van with tail lift offers around 16 to 18.5 m³ of load volume, giving customers a large box-style loading area for moving and transport jobs.",
        },
        {
            question: "What does the tail lift do?",
            answer:
                "The hydraulic tail lift helps raise heavier items from ground level to the loading area. It has an approximate lifting capacity of 500 kg, subject to safe use and hire conditions.",
        },
        {
            question: "Can I use a Luton van for moving house in London?",
            answer:
                "Yes, Luton van hire is one of the most popular choices for house moves, flat moves and office relocations in London because of its large box body and easier loading access.",
        },
        {
            question: "How much does Luton van with tail lift hire cost?",
            answer:
                "Current hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.",
        },
    ],

    "CrewCab Van": [
        {
            question: "What is a Crew Cab van used for?",
            answer:
                "A Crew Cab van is used for transporting both people and equipment. It is ideal for work crews, construction teams, maintenance jobs, contractors and tradespeople.",
        },
        {
            question: "How many seats does a Crew Cab van have?",
            answer:
                "Our Crew Cab van has 6 seats, making it suitable for teams who need to travel together while still carrying tools and work equipment.",
        },
        {
            question: "How much load space does a Crew Cab van have?",
            answer:
                "The Crew Cab van has around 3.1 to 3.7 m³ of load volume, giving useful storage space behind the passenger area.",
        },
        {
            question: "Is a Crew Cab van good for construction work?",
            answer:
                "Yes, Crew Cab van hire is a practical option for construction teams, site workers, engineers, decorators and maintenance crews who need one vehicle for staff and tools.",
        },
        {
            question: "How much does Crew Cab van hire cost?",
            answer:
                "Current hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.",
        },
    ],

    "Flat Bed Pickup Van": [
        {
            question: "What is a Flat Bed Pickup van best for?",
            answer:
                "A Flat Bed Pickup van is best for oversized, awkward or heavy outdoor loads, including construction materials, landscaping supplies, timber, machinery and site equipment.",
        },
        {
            question: "What is the payload of a Flat Bed Pickup van?",
            answer:
                "Our Flat Bed Pickup van has a payload of up to 2.2 tonnes, subject to safe loading, weight limits and hire conditions.",
        },
        {
            question: "Can a Flat Bed Pickup van be loaded by forklift?",
            answer:
                "Yes, the open flatbed design with drop sides can make forklift loading, crane loading and side access easier than with an enclosed panel van.",
        },
        {
            question: "What size is the load bed?",
            answer:
                "The Flat Bed Pickup van has an approximate 3.6 m × 2.05 m load bed, suitable for many construction, landscaping and trade loads.",
        },
        {
            question: "How much does Flat Bed Pickup van hire cost?",
            answer:
                "Current hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.",
        },
    ],

    "Fridge Van": [
        {
            question: "What is a Fridge van used for?",
            answer:
                "A Fridge van is used for transporting chilled goods, catering products, food and drink, frozen goods, pharmaceuticals and other temperature-sensitive items.",
        },
        {
            question: "What temperature can the Fridge van maintain?",
            answer:
                "Our Fridge van supports chilled operation from 0°C to +5°C, with an optional freezer specification down to -18°C depending on the vehicle and booking requirements.",
        },
        {
            question: "How much load space does a Fridge van have?",
            answer:
                "The Fridge van offers around 9.3 to 10 m³ of load volume, making it suitable for food suppliers, caterers, event operators and cold-chain transport.",
        },
        {
            question: "Is Fridge van hire self-drive?",
            answer:
                "Yes, our Fridge van hire is self-drive. Customers collect the refrigerated vehicle, drive it themselves and return it according to the agreed hire terms.",
        },
        {
            question: "How much does Fridge van hire cost?",
            answer:
                "Current hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.",
        },
    ],

    "Tipper Van": [
        {
            question: "What is a Tipper van used for?",
            answer:
                "A Tipper van is used for construction waste, gravel, sand, soil, landscaping materials, site clearance and other loose loads that need faster unloading.",
        },
        {
            question: "How does a Tipper van unload materials?",
            answer:
                "The hydraulic tipping body lifts the load area, helping loose materials slide out more quickly and reducing manual unloading work.",
        },
        {
            question: "What is the payload of a Tipper van?",
            answer:
                "Our Tipper van has a payload of up to 1.5 tonnes, subject to safe loading, weight limits and rental conditions.",
        },
        {
            question: "Is Tipper van hire suitable for landscaping?",
            answer:
                "Yes, Tipper van hire is a useful option for landscaping jobs, garden waste, soil, sand, gravel and site materials across London.",
        },
        {
            question: "How much does Tipper van hire cost?",
            answer:
                "Current hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.",
        },
    ],

    "8 Seater Tourneo": [
        {
            question: "What is an 8 Seater Tourneo best used for?",
            answer:
                "An 8 Seater Tourneo is best for family trips, small group travel, corporate outings, events, day trips and self-drive passenger transport.",
        },
        {
            question: "Is the 8 Seater Tourneo self-drive?",
            answer:
                "Yes, the 8 Seater Tourneo is hired on a self-drive basis. Success Van Hire provides the vehicle, not a chauffeur or driver.",
        },
        {
            question: "Can I use an 8 Seater Tourneo for airport journeys?",
            answer:
                "Yes, customers may use the 8 Seater Tourneo for airport journeys they drive themselves. This is not an airport transfer service supplied with a driver.",
        },
        {
            question: "Do I need a special licence for an 8 Seater Tourneo?",
            answer:
                "In most cases, an 8 Seater Tourneo can be driven with a standard Licence B, subject to our driver checks, insurance rules and hire terms.",
        },
        {
            question: "How much does 8 Seater Tourneo hire cost?",
            answer:
                "Current hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.",
        },
    ],

    "9 Seater Tourneo": [
        {
            question: "What is a 9 Seater Tourneo suitable for?",
            answer:
                "A 9 Seater Tourneo is suitable for larger family trips, group travel, corporate journeys, school-related travel, sightseeing and self-drive passenger transport.",
        },
        {
            question: "Is 9 Seater Tourneo hire available without a driver?",
            answer:
                "Yes, our 9 Seater Tourneo hire is self-drive only. The customer collects the vehicle, drives it and returns it according to the hire agreement.",
        },
        {
            question: "Can I hire a 9 Seater Tourneo for group travel in London?",
            answer:
                "Yes, the 9 Seater Tourneo is a practical option for group travel in London when you need more seats than a standard car or people carrier.",
        },
        {
            question: "What licence do I need for a 9 Seater Tourneo?",
            answer:
                "A standard Licence B may be accepted for 9 Seater Tourneo hire, subject to driver eligibility, insurance checks and our rental conditions.",
        },
        {
            question: "How much does 9 Seater Tourneo hire cost?",
            answer:
                "Current hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.",
        },
    ],

    "14 Seater Minibus": [
        {
            question: "What is a 14 Seater Minibus best used for?",
            answer:
                "A 14 Seater Minibus is best for large groups, corporate events, school trips, organised journeys, sightseeing and community travel.",
        },
        {
            question: "Is 14 Seater Minibus hire self-drive?",
            answer:
                "Yes, this is a self-drive minibus hire service. Success Van Hire provides the vehicle only and does not supply a driver.",
        },
        {
            question: "What licence do I need for a 14 Seater Minibus?",
            answer:
                "A 14 Seater Minibus may require Licence Class D or D1, depending on the driver, use case and hire conditions. Customers should check eligibility before booking.",
        },
        {
            question: "Can I hire a 14 Seater Minibus for school trips?",
            answer:
                "Yes, a 14 Seater Minibus can be suitable for school trips and organised group journeys when the customer has an eligible driver and meets the hire requirements.",
        },
        {
            question: "How much does 14 Seater Minibus hire cost?",
            answer:
                "Current hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.",
        },
    ],

    "17 Seater Minibus": [
        {
            question: "What is a 17 Seater Minibus used for?",
            answer:
                "A 17 Seater Minibus is used for larger group transport, corporate events, organised tours, sports teams, community groups and extended group journeys.",
        },
        {
            question: "Is 17 Seater Minibus hire self-drive only?",
            answer:
                "Yes, our 17 Seater Minibus hire is self-drive only. The customer must provide an eligible driver and manage the journey independently.",
        },
        {
            question: "What licence do I need for a 17 Seater Minibus?",
            answer:
                "A 17 Seater Minibus usually requires Licence Class D or D1. Customers must check licence eligibility, insurance rules and hire conditions before booking.",
        },
        {
            question: "Can I hire a 17 Seater Minibus for corporate events?",
            answer:
                "Yes, 17 Seater Minibus hire is suitable for corporate events, team travel and organised group journeys when driven by an eligible customer driver.",
        },
        {
            question: "How much does 17 Seater Minibus hire cost?",
            answer:
                "Current hire prices are loaded from the live booking data for this vehicle. Prices may depend on availability, hire duration and booking conditions.",
        },
    ],
};

export function getVanDetailFaqs(category: CategoryDetail): VanFaqItem[] | null {
    const faqs = VAN_DETAIL_FAQS[category.name];
    if (!faqs) return null;

    return faqs.map((faq) => {
        if (!faq.question.toLowerCase().startsWith("how much")) return faq;

        return {
            ...faq,
            answer: buildCategoryPricingSummary(category),
        };
    });
}

export function buildVanFaqSchema(faqs: VanFaqItem[]) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    };
}
